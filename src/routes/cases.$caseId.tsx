import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { getCase, type Case, type Episode } from "@/lib/cases";
import { ArrowLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/cases/$caseId")({
  component: CasePage,
  loader: ({ params }) => {
    const c = getCase(params.caseId);
    if (!c) throw notFound();
    return { c: c! };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.c.title} — UAP Archive` : "Case — UAP Archive" },
      { name: "description", content: loaderData?.c.description ?? "" },
    ],
  }),
});

function CasePage() {
  const { c } = Route.useLoaderData();
  const period = c.yearRange ?? c.year?.toString() ?? c.date ?? "—";
  const fileCount =
    (c.files?.length ?? 0) +
    (c.episodes?.reduce((n: number, e: Episode) => n + e.files.length, 0) ?? 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Header band */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 80% 20%, oklch(0.78 0.16 62 / 0.18), transparent 60%), radial-gradient(ellipse at 10% 90%, oklch(0.55 0.22 28 / 0.12), transparent 60%)",
          }}
        />
        <div className="scanlines absolute inset-0 opacity-40" />

        <div className="relative mx-auto max-w-7xl px-6 py-16">
          <Link to="/" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary">
            <ArrowLeft className="h-3 w-3" /> All cases
          </Link>

          <div className="mt-8 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
            <span>{c.caseId}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{period}</span>
            {c.agency && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{c.agency}</span>
              </>
            )}
            <span className="stamp ml-2 !text-[10px]">Declassified</span>
          </div>

          <h1 className="mt-6 max-w-4xl font-display text-5xl leading-[1.05] sm:text-6xl">
            {c.title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            {c.description}
          </p>

          <div className="mt-10 grid max-w-2xl grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            <Stat label="Episodes" value={String(c.episodes?.length ?? 0)} />
            <Stat label="Files" value={String(fileCount)} />
            {c.location && <Stat label="Location" value={c.location} />}
            {c.locations && <Stat label="Regions" value={String(c.locations.length)} />}
            {c.totalVideos && <Stat label="Videos" value={String(c.totalVideos)} />}
            {c.subIncidents && <Stat label="Sub-Incidents" value={String(c.subIncidents)} />}
          </div>

          {c.locations && (
            <div className="mt-6 flex flex-wrap gap-2">
              {c.locations.map((l: string) => (
                <span key={l} className="rounded-sm border border-border bg-card px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {l}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Episodes */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex items-end justify-between border-b border-border/60 pb-4">
          <h2 className="font-display text-3xl">Episodes</h2>
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {c.episodes?.length ?? 0} entries
          </span>
        </div>

        {c.episodes && c.episodes.length > 0 ? (
          <ol className="divide-y divide-border/60">
            {c.episodes.map((e: Episode, i: number) => (
              <li key={e.episodeId}>
                <Link
                  to="/cases/$caseId/episodes/$episodeId"
                  params={{ caseId: c.caseId, episodeId: e.episodeId }}
                  className="group flex items-center gap-6 py-6 transition-colors hover:bg-card/50"
                >
                  <div className="font-display text-4xl text-muted-foreground transition-colors group-hover:text-primary sm:text-5xl">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      <span>{e.episodeId}</span>
                      {e.date && <span>· {e.date}</span>}
                      {e.dateRange && <span>· {e.dateRange}</span>}
                      {e.location && <span>· {e.location}</span>}
                      {e.status === "redacted" && (
                        <span className="text-accent">· REDACTED</span>
                      )}
                    </div>
                    <h3 className="mt-2 font-display text-2xl leading-snug transition-colors group-hover:text-primary">
                      {e.title}
                    </h3>
                    {e.description && (
                      <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                        {e.description}
                      </p>
                    )}
                  </div>
                  <div className="hidden text-right sm:block">
                    <div className="font-mono text-xs text-muted-foreground">
                      {e.files.length} files
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-muted-foreground">No episodes catalogued.</p>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display text-2xl text-foreground">{value}</div>
      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
