import "./lib/error-capture";

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import archiveData from "./data/cases.json";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;
const repositoryRoot = path.resolve(process.cwd(), "repository");
const radioRoot = path.resolve(repositoryRoot, "09_UAP_Radio");
const staticRoutes = ["/", "/search", "/timeline", "/map", "/about"];
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

async function maybeServeRadioPlaylist(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (url.pathname !== "/api/radio") return null;

  try {
    const entries = await readdir(radioRoot, { withFileTypes: true });
    const tracks = entries
      .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".mp3")
      .map((entry) => {
        const relativePath = `09_UAP_Radio/${entry.name}`;
        const encodedPath = relativePath
          .split("/")
          .map((segment) => encodeURIComponent(segment))
          .join("/");

        return {
          name: path.basename(entry.name, ".mp3").replace(/[_-]+/g, " "),
          path: relativePath,
          href: `/repository/${encodedPath}`,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return Response.json({ tracks });
  } catch {
    return Response.json({ tracks: [] });
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
      "media-src 'self' blob:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
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

async function maybeServeRepositoryAsset(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/repository/")) return null;

  const relativePath = decodeURIComponent(url.pathname.slice("/repository/".length));
  const absolutePath = path.resolve(repositoryRoot, relativePath);
  const relativeToRoot = path.relative(repositoryRoot, absolutePath);

  if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
    return new Response("Not found", { status: 404 });
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
    try {
      const machineIndexResponse = maybeServeMachineIndex(request);
      if (machineIndexResponse) return withSecurityHeaders(machineIndexResponse);

      const radioResponse = await maybeServeRadioPlaylist(request);
      if (radioResponse) return withSecurityHeaders(radioResponse);

      const assetResponse = await maybeServeRepositoryAsset(request);
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
