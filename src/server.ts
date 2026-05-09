import "./lib/error-capture";

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import archiveData from "./data/cases.json";
import radioManifest from "./data/radio-tracks.json";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

type R2ObjectBody = {
  body: ReadableStream | null;
  httpEtag?: string;
  size?: number;
  httpMetadata?: { contentType?: string };
};

type R2ListResult = {
  objects: Array<{ key: string; size: number }>;
  truncated?: boolean;
  cursor?: string;
};

type R2Bucket = {
  get(key: string): Promise<R2ObjectBody | null>;
  list(options?: { prefix?: string; cursor?: string; limit?: number }): Promise<R2ListResult>;
};

type WorkerEnv =
  | {
      REPOSITORY?: R2Bucket;
      R2_PUBLIC_BASE_URL?: string;
    }
  | null
  | undefined;

let serverEntryPromise: Promise<ServerEntry> | undefined;
const repositoryRoot = path.resolve(process.cwd(), "repository");
const radioRoot = path.resolve(repositoryRoot, "09_UAP_Radio");
const staticRoutes = ["/", "/search", "/timeline", "/map", "/about"];

function getR2Bucket(env: WorkerEnv): R2Bucket | null {
  const bucket = env?.REPOSITORY;
  if (bucket && typeof bucket === "object" && typeof bucket.get === "function") {
    return bucket;
  }
  return null;
}

function getPublicR2BaseUrl(env: WorkerEnv): string | null {
  const candidates = [env?.R2_PUBLIC_BASE_URL, getProcessEnv("R2_PUBLIC_BASE_URL")];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      return value.trim().replace(/\/$/, "");
    }
  }
  return null;
}

function getProcessEnv(key: string): string | undefined {
  if (typeof process === "undefined" || !process.env) return undefined;
  return process.env[key];
}

function encodeR2PathForUrl(relativePath: string): string {
  return relativePath
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

const releaseDate = (archiveData as ArchiveData).metadata.created;

type ArchiveEpisode = {
  episodeId: string;
  title: string;
  description?: string;
  files: string[];
};

type ArchiveCase = {
  caseId: string;
  title: string;
  description: string;
  agency?: string;
  episodes?: ArchiveEpisode[];
};

type ArchiveData = {
  metadata: {
    title: string;
    created: string;
    source: string;
    totalCases: number;
    totalIncidents: number;
  };
  cases: ArchiveCase[];
};

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry),
    );
  }
  return serverEntryPromise;
}

function contentTypeFor(filePath: string): string {
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

type RadioTrack = { name: string; path: string; href: string };

function trackForRadioKey(key: string): RadioTrack {
  const filename = key.split("/").pop() ?? key;
  return {
    name: path.basename(filename, ".mp3").replace(/[_-]+/g, " "),
    path: key,
    href: `/repository/${encodeR2PathForUrl(key)}`,
  };
}

function manifestRadioTracks(): RadioTrack[] {
  const tracks = (radioManifest as { tracks?: Array<{ path: string }> }).tracks ?? [];
  return tracks
    .filter((track) => typeof track.path === "string" && track.path.toLowerCase().endsWith(".mp3"))
    .map((track) => trackForRadioKey(track.path))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function maybeServeRadioPlaylist(request: Request, env: WorkerEnv): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== "/api/radio") return null;

  try {
    const bucket = getR2Bucket(env);
    if (bucket) {
      const tracks: RadioTrack[] = [];
      let cursor: string | undefined;
      do {
        const result = await bucket.list({ prefix: "09_UAP_Radio/", cursor });
        for (const obj of result.objects) {
          if (!obj.key.toLowerCase().endsWith(".mp3")) continue;
          tracks.push(trackForRadioKey(obj.key));
        }
        cursor = result.truncated ? result.cursor : undefined;
      } while (cursor);
      tracks.sort((a, b) => a.name.localeCompare(b.name));
      return Response.json({ tracks });
    }

    if (getPublicR2BaseUrl(env)) {
      return Response.json({ tracks: manifestRadioTracks() });
    }

    try {
      const entries = await readdir(radioRoot, { withFileTypes: true });
      const tracks = entries
        .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".mp3")
        .map((entry) => trackForRadioKey(`09_UAP_Radio/${entry.name}`))
        .sort((a, b) => a.name.localeCompare(b.name));
      return Response.json({ tracks });
    } catch {
      return Response.json({ tracks: manifestRadioTracks() });
    }
  } catch {
    return Response.json({ tracks: manifestRadioTracks() });
  }
}

function securityHeaders(): Record<string, string> {
  return {
    "content-security-policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      "frame-src 'self' https: blob:",
      "object-src 'self' https: blob:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
    "cross-origin-opener-policy": "same-origin",
    "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    "referrer-policy": "strict-origin-when-cross-origin",
    "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "x-permitted-cross-domain-policies": "none",
  };
}

function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(securityHeaders())) {
    if (!headers.has(key)) headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function originFor(request: Request) {
  return new URL(request.url).origin;
}

function archiveRoutes() {
  const data = archiveData as ArchiveData;
  return data.cases.flatMap((c) => [
    `/cases/${encodeURIComponent(c.caseId)}`,
    ...(c.episodes ?? []).map(
      (ep) => `/cases/${encodeURIComponent(c.caseId)}/episodes/${encodeURIComponent(ep.episodeId)}`,
    ),
  ]);
}

function sitemapResponse(request: Request): Response {
  const origin = originFor(request);
  const routes = [...staticRoutes, ...archiveRoutes()];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes
    .map(
      (route) =>
        `  <url><loc>${xmlEscape(`${origin}${route}`)}</loc><lastmod>${releaseDate}</lastmod></url>`,
    )
    .join("\n")}\n</urlset>\n`;

  return new Response(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}

function robotsResponse(request: Request): Response {
  const origin = originFor(request);
  return new Response(
    [
      "User-agent: *",
      "Allow: /",
      "Disallow: /api/",
      "",
      `Sitemap: ${origin}/sitemap.xml`,
      `Host: ${new URL(origin).host}`,
      "",
    ].join("\n"),
    {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "public, max-age=3600",
      },
    },
  );
}

function llmsResponse(request: Request): Response {
  const origin = originFor(request);
  const data = archiveData as ArchiveData;
  const cases = data.cases
    .map((c) => {
      const episodes = (c.episodes ?? [])
        .map(
          (ep) =>
            `  - [${ep.title}](${origin}/cases/${encodeURIComponent(c.caseId)}/episodes/${encodeURIComponent(ep.episodeId)}): ${ep.description ?? `${ep.files.length} source file(s)`}`,
        )
        .join("\n");
      return `- [${c.title}](${origin}/cases/${encodeURIComponent(c.caseId)}): ${c.description}${c.agency ? ` Agency: ${c.agency}.` : ""}\n${episodes}`;
    })
    .join("\n");

  return new Response(
    [
      "# The UAP Gazette",
      "",
      "> Searchable public index for PURSUE Release 01 UAP cases, episodes, timelines, regions, and source files.",
      "",
      "## Core Pages",
      "",
      `- [Catalog](${origin}/): Case catalog and release overview`,
      `- [Search](${origin}/search): Search by case, episode, agency, region, date, evidence type, and file`,
      `- [Timeline](${origin}/timeline): Chronological incident index`,
      `- [Map](${origin}/map): Geographic evidence index`,
      `- [About](${origin}/about): Methodology and source notes`,
      "",
      "## Cases and Episodes",
      "",
      cases,
      "",
    ].join("\n"),
    {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "public, max-age=3600",
      },
    },
  );
}

function securityTxtResponse(request: Request): Response {
  const origin = originFor(request);
  return new Response(
    [
      "Contact: https://github.com/shaunswan/unidentified-archives/security/advisories/new",
      `Canonical: ${origin}/.well-known/security.txt`,
      "Preferred-Languages: en",
      "",
    ].join("\n"),
    {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "public, max-age=86400",
      },
    },
  );
}

function maybeServeMachineIndex(request: Request): Response | null {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/sitemap.xml") return sitemapResponse(request);
  if (pathname === "/robots.txt") return robotsResponse(request);
  if (pathname === "/llms.txt") return llmsResponse(request);
  if (pathname === "/.well-known/security.txt") return securityTxtResponse(request);
  return null;
}

async function maybeServeRepositoryAsset(
  request: Request,
  env: WorkerEnv,
): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/repository/")) return null;

  const relativePath = decodeURIComponent(url.pathname.slice("/repository/".length));
  const absolutePath = path.resolve(repositoryRoot, relativePath);
  const relativeToRoot = path.relative(repositoryRoot, absolutePath);

  if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
    return new Response("Not found", { status: 404 });
  }

  const r2Key = relativePath.replace(/\\/g, "/");

  const bucket = getR2Bucket(env);
  if (bucket) {
    const obj = await bucket.get(r2Key);
    if (!obj || !obj.body) return new Response("Not found", { status: 404 });
    const headers = new Headers({
      "content-type": obj.httpMetadata?.contentType ?? contentTypeFor(r2Key),
      "cache-control": "public, max-age=300",
      "content-disposition": `inline; filename="${path.basename(r2Key)}"`,
    });
    if (obj.httpEtag) headers.set("etag", obj.httpEtag);
    if (typeof obj.size === "number") headers.set("content-length", String(obj.size));
    return new Response(obj.body, { status: 200, headers });
  }

  const publicBaseUrl = getPublicR2BaseUrl(env);
  if (publicBaseUrl) {
    return Response.redirect(`${publicBaseUrl}/${encodeR2PathForUrl(r2Key)}`, 307);
  }

  try {
    const contents = await readFile(absolutePath);
    return new Response(contents, {
      status: 200,
      headers: {
        "content-type": contentTypeFor(absolutePath),
        "cache-control": "public, max-age=300",
        "content-disposition": `inline; filename="${path.basename(absolutePath)}"`,
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const workerEnv = env as WorkerEnv;
    try {
      const machineIndexResponse = maybeServeMachineIndex(request);
      if (machineIndexResponse) return withSecurityHeaders(machineIndexResponse);

      const radioResponse = await maybeServeRadioPlaylist(request, workerEnv);
      if (radioResponse) return withSecurityHeaders(radioResponse);

      const assetResponse = await maybeServeRepositoryAsset(request, workerEnv);
      if (assetResponse) return withSecurityHeaders(assetResponse);

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return withSecurityHeaders(await normalizeCatastrophicSsrResponse(response));
    } catch (error) {
      console.error(error);
      return withSecurityHeaders(brandedErrorResponse());
    }
  },
};
