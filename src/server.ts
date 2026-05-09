import "./lib/error-capture";

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;
const repositoryRoot = path.resolve(process.cwd(), "repository");
const radioRoot = path.resolve(repositoryRoot, "09_UAP_Radio");

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
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
      const radioResponse = await maybeServeRadioPlaylist(request);
      if (radioResponse) return radioResponse;

      const assetResponse = await maybeServeRepositoryAsset(request);
      if (assetResponse) return assetResponse;

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};
