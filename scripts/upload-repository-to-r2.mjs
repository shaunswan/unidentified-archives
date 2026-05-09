#!/usr/bin/env node
/**
 * Uploads ./repository/** to a Cloudflare R2 bucket via the S3-compatible API.
 *
 * Required env (from .env.local or shell):
 *   R2_ACCOUNT_ID
 *   R2_ACCESS_KEY_ID
 *   R2_SECRET_ACCESS_KEY
 *   R2_BUCKET                (defaults to "unidentified-archives")
 * Optional:
 *   R2_PUBLIC_BASE_URL       (printed at the end if not set, sourced from `wrangler r2 bucket dev-url`)
 *
 * Skips: .git, .gitkeep, and " (N)" duplicate files when a canonical sibling exists.
 *
 * Flags: --dry-run, --skip-videos, --refresh-radio-only, --concurrency=8
 */

import { createReadStream } from "node:fs";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoDir = path.resolve(scriptDir, "..");

async function loadEnvFiles() {
  for (const name of [".env.local", ".env"]) {
    try {
      const raw = await readFile(path.join(repoDir, name), "utf8");
      for (const line of raw.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        let val = trimmed.slice(eq + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (key && val && !(key in process.env)) process.env[key] = val;
      }
    } catch {
      // ignore missing env files
    }
  }
}

async function collectFiles(absDir, out = []) {
  const entries = await readdir(absDir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(absDir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === ".git") continue;
      await collectFiles(full, out);
      continue;
    }
    if (entry.name === ".gitkeep") continue;
    out.push(full);
  }
  return out;
}

const SUFFIX_RE = /\s*\((\d+)\)(?=\.[^./\\]+$|$)/;

function canonicalName(filename) {
  return filename.replace(SUFFIX_RE, "");
}

function dedupeDuplicates(absoluteFiles, repoRoot) {
  const groups = new Map();
  for (const abs of absoluteFiles) {
    const rel = posixRelative(repoRoot, abs);
    const dir = rel.includes("/") ? rel.slice(0, rel.lastIndexOf("/")) : "";
    const file = rel.slice(dir.length ? dir.length + 1 : 0);
    const key = `${dir}/${canonicalName(file)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ abs, rel, file });
  }

  const kept = [];
  for (const candidates of groups.values()) {
    if (candidates.length === 1) {
      kept.push(candidates[0].abs);
      continue;
    }
    candidates.sort((a, b) => {
      const am = a.file.match(SUFFIX_RE);
      const bm = b.file.match(SUFFIX_RE);
      const ai = am ? Number(am[1]) : -1;
      const bi = bm ? Number(bm[1]) : -1;
      return ai - bi;
    });
    kept.push(candidates[0].abs);
  }
  return kept.sort((a, b) => a.localeCompare(b));
}

function posixRelative(fromDir, absolute) {
  return path.relative(fromDir, absolute).split(path.sep).join("/");
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".pdf":
      return "application/pdf";
    case ".mp4":
      return "video/mp4";
    case ".mov":
      return "video/quicktime";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".mp3":
      return "audio/mpeg";
    case ".json":
      return "application/json; charset=utf-8";
    case ".md":
    case ".txt":
      return "text/plain; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  let concurrency = 6;
  for (const arg of args) {
    if (arg.startsWith("--concurrency=")) {
      const n = Number(arg.split("=")[1]);
      if (Number.isFinite(n) && n > 0) concurrency = Math.min(32, Math.floor(n));
    }
  }
  return {
    dry: args.includes("--dry-run"),
    skipVideos: args.includes("--skip-videos"),
    refreshRadioOnly: args.includes("--refresh-radio-only"),
    concurrency,
  };
}

async function writeRadioManifest(uploadedKeys) {
  const tracks = uploadedKeys
    .filter((key) => key.startsWith("09_UAP_Radio/") && key.toLowerCase().endsWith(".mp3"))
    .sort()
    .map((p) => ({ path: p }));
  const target = path.join(repoDir, "src", "data", "radio-tracks.json");
  await writeFile(target, `${JSON.stringify({ tracks }, null, 2)}\n`, "utf8");
  console.error(`Wrote ${tracks.length} track(s) to src/data/radio-tracks.json`);
}

async function runWithLimit(items, limit, worker) {
  const queue = items.slice();
  let active = 0;
  let index = 0;
  return new Promise((resolve, reject) => {
    const next = () => {
      if (queue.length === 0 && active === 0) return resolve();
      while (active < limit && queue.length > 0) {
        const item = queue.shift();
        const i = index++;
        active++;
        Promise.resolve(worker(item, i))
          .then(() => {
            active--;
            next();
          })
          .catch((err) => reject(err));
      }
    };
    next();
  });
}

async function main() {
  await loadEnvFiles();
  const opts = parseArgs();

  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = (process.env.R2_BUCKET?.trim() || "unidentified-archives");

  if (!opts.dry && (!accountId || !accessKeyId || !secretAccessKey)) {
    console.error(
      "Missing R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY. Add them to .env.local.",
    );
    process.exit(1);
  }

  const repoRoot = path.resolve(repoDir, "repository");
  let st;
  try {
    st = await stat(repoRoot);
  } catch {
    console.error(`Repository folder not found: ${repoRoot}`);
    process.exit(1);
  }
  if (!st.isDirectory()) {
    console.error(`Not a directory: ${repoRoot}`);
    process.exit(1);
  }

  const all = await collectFiles(repoRoot);
  const dedup = dedupeDuplicates(all, repoRoot);
  let candidates = dedup;
  if (opts.skipVideos) {
    candidates = candidates.filter((abs) => !posixRelative(repoRoot, abs).startsWith("07_Videos/"));
  }
  if (opts.refreshRadioOnly) {
    candidates = candidates.filter((abs) =>
      posixRelative(repoRoot, abs).startsWith("09_UAP_Radio/"),
    );
  }

  if (candidates.length === 0) {
    console.warn("No files to upload after filters.");
    process.exit(0);
  }

  const totalBytes = (
    await Promise.all(candidates.map((abs) => stat(abs).then((s) => s.size)))
  ).reduce((a, b) => a + b, 0);

  console.error(
    `Plan: ${candidates.length} file(s), ${(totalBytes / 1024 / 1024).toFixed(1)} MB${opts.skipVideos ? " (videos skipped)" : ""}${opts.refreshRadioOnly ? " (radio only)" : ""}.`,
  );

  if (opts.dry) {
    for (const abs of candidates) console.log(`[dry-run] ${posixRelative(repoRoot, abs)}`);
    console.error("\nDry run complete. No files uploaded.");
    return;
  }

  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  let done = 0;
  const startedAt = Date.now();
  const uploadedKeys = [];

  await runWithLimit(candidates, opts.concurrency, async (abs) => {
    const key = posixRelative(repoRoot, abs);
    const size = (await stat(abs)).size;
    const body = size <= 16 * 1024 * 1024 ? await readFile(abs) : createReadStream(abs);
    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentTypeFor(key),
      ContentLength: size,
    });
    await client.send(cmd);
    uploadedKeys.push(key);
    done += 1;
    const pct = ((done / candidates.length) * 100).toFixed(1);
    console.error(
      `[${done}/${candidates.length} ${pct}%] ${(size / 1024 / 1024).toFixed(2)} MB  ${key}`,
    );
  });

  const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.error(`\nUploaded ${done} file(s) in ${elapsedSec}s.`);

  if (!opts.refreshRadioOnly) {
    await writeRadioManifest(uploadedKeys);
  } else {
    const existing = JSON.parse(
      await readFile(path.join(repoDir, "src", "data", "radio-tracks.json"), "utf8").catch(
        () => '{"tracks":[]}',
      ),
    );
    const existingPaths = new Set((existing.tracks ?? []).map((t) => t.path));
    for (const key of uploadedKeys) existingPaths.add(key);
    const merged = Array.from(existingPaths)
      .filter((p) => p.startsWith("09_UAP_Radio/") && p.toLowerCase().endsWith(".mp3"))
      .sort()
      .map((p) => ({ path: p }));
    await writeFile(
      path.join(repoDir, "src", "data", "radio-tracks.json"),
      `${JSON.stringify({ tracks: merged }, null, 2)}\n`,
      "utf8",
    );
    console.error(`Updated src/data/radio-tracks.json (${merged.length} track(s)).`);
  }

  if (!process.env.R2_PUBLIC_BASE_URL?.trim()) {
    console.error(
      "\nNext: set R2_PUBLIC_BASE_URL on Vercel (and locally if you want to test the redirect path):",
    );
    console.error(
      "  - Cloudflare dashboard \u2192 R2 \u2192 unidentified-archives \u2192 Settings \u2192 enable Public Development URL",
    );
    console.error(
      "  - Then set: R2_PUBLIC_BASE_URL=https://pub-XXXXXXXX.r2.dev (no trailing slash)",
    );
  }
}

await main().catch((err) => {
  console.error(err?.stack ?? err);
  process.exit(1);
});
