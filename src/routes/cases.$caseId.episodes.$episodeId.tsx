import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { FilePreview } from "@/components/FilePreview";
import { getCase, getEpisode } from "@/lib/cases";
import { ArrowLeft, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/cases/$caseId/episodes/$episodeId")({
  component: EpisodePage,
  loader: ({ params }) => {
    const c = getCase(params.caseId);
    const ep = getEpisode(params.caseId, params.episodeId);
    if (!c || !ep) throw notFound();
    const idx = c.episodes!.findIndex((e) => e.episodeId === ep.episodeId);
    const prev = idx > 0 ? c.episodes![idx - 1] : null;
    const next = idx < c.episodes!.length - 1 ? c.episodes![idx + 1] : null;
    return { c, ep, idx, prev, next };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.ep.title} — UAP Archive` : "Episode" },
      { name: "description", content: loaderData?.ep.description ?? loaderData?.ep.title ?? "" },
    ],
  }),
});

function EpisodePage() {
  const { c, ep, idx, prev, next } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <article className="mx-auto max-w-5xl px-6 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <Link to="/" className="hover:text-primary">Archive</Link>
          <span>/</span>
          <Link to="/cases/$caseId" params={{ caseId: c.caseId }} className="hover:text-primary">
            {c.caseId}
          </Link>
          <span>/</span>
          <span className="text-foreground">{ep.episodeId}</span>
        </nav>

        {/* Episode header */}
        <header className="relative mt-8 overflow-hidden rounded-sm border border-border bg-card p-8 sm:p-12">
          <div
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at 90% 10%, oklch(0.78 0.16 62 / 0.2), transparent 60%)",
            }}
          />
          <div className="scanlines absolute inset-0 opacity-30" />

          <div className="relative">
            <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
              <span>Episode {String(idx + 1).padStart(2, "0")}</span>
              <span className="text-muted-foreground">· {ep.episodeId}</span>
              {ep.date && <span className="text-muted-foreground">· {ep.date}</span>}
              {ep.dateRange && <span className="text-muted-foreground">· {ep.dateRange}</span>}
              {ep.location && <span className="text-muted-foreground">· {ep.location}</span>}
              {ep.status === "redacted" && <span className="stamp !text-[10px]">Redacted</span>}
            </div>

            <h1 className="mt-6 font-display text-4xl leading-tight sm:text-5xl">
              {ep.title}
            </h1>

            {ep.description && (
              <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                {ep.description}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <span>Type · {ep.type.replace(/_/g, " ")}</span>
              <span>· {ep.files.length} files</span>
              {ep.mission && <span>· {ep.mission}</span>}
              {ep.missions && <span>· {ep.missions.join(" / ")}</span>}
            </div>
          </div>
        </header>

        {/* Synopsis (case context) */}
        <section className="mt-10">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Context
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            Part of <Link to="/cases/$caseId" params={{ caseId: c.caseId }} className="text-foreground underline-offset-4 hover:text-primary hover:underline">{c.title}</Link>
            {c.agency ? ` — a ${c.agency} ` : " — a "}
            collection covering {c.yearRange ?? c.year ?? "the disclosed period"}.
            {" "}{c.description}
          </p>
        </section>

        {/* Files */}
        <section className="mt-12">
          <div className="mb-6 flex items-end justify-between border-b border-border/60 pb-3">
            <h2 className="font-display text-2xl">Source Material</h2>
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {ep.files.length} files
            </span>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {ep.files.map((f, i) => (
              <FilePreview key={f + i} path={f} index={i} />
            ))}
          </div>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            ⓘ Previews are placeholders — original files will be wired in once hosted.
          </p>
        </section>

        {/* Pager */}
        <nav className="mt-16 grid grid-cols-1 gap-4 border-t border-border/60 pt-8 sm:grid-cols-2">
          {prev ? (
            <Link
              to="/cases/$caseId/episodes/$episodeId"
              params={{ caseId: c.caseId, episodeId: prev.episodeId }}
              className="group flex flex-col gap-1 rounded-sm border border-border p-5 transition-colors hover:border-primary"
            >
              <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <ArrowLeft className="h-3 w-3" /> Previous episode
              </span>
              <span className="font-display text-lg group-hover:text-primary">{prev.title}</span>
            </Link>
          ) : <div />}
          {next ? (
            <Link
              to="/cases/$caseId/episodes/$episodeId"
              params={{ caseId: c.caseId, episodeId: next.episodeId }}
              className="group flex flex-col items-end gap-1 rounded-sm border border-border p-5 text-right transition-colors hover:border-primary"
            >
              <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Next episode <ArrowRight className="h-3 w-3" />
              </span>
              <span className="font-display text-lg group-hover:text-primary">{next.title}</span>
            </Link>
          ) : <div />}
        </nav>
      </article>
    </div>
  );
}
