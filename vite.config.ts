// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";
import path from "node:path";

const isVercel = process.env.VERCEL === "1";

// Default build: Cloudflare (`dist/server` + worker). Vercel sets VERCEL=1 during CI and needs Nitro instead —
// see https://vercel.com/docs/frameworks/full-stack/tanstack-start
export default defineConfig({
  cloudflare: isVercel ? false : undefined,
  plugins: isVercel ? [nitro()] : [],
  vite: {
    define: {
      __REPOSITORY_ROOT__: JSON.stringify(path.resolve(process.cwd(), "repository").replace(/\\/g, "/")),
    },
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
