import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { cases, type Case, type Episode } from "@/lib/cases";
import { seoHead } from "@/lib/seo";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/timeline")({
  component: TimelinePage,
  head: () => ({
    ...seoHead({
      title: "UAP Incident Timeline - 1969 to 2026",
      description:
        "A chronological timeline of dated UAP incidents from Apollo-era reports through Western U.S. field investigations, drawn from PURSUE Release 01.",
      path: "/timeline",
    }),
  }),
});

type TimelineEntry = {
  year: number;
  date: string;
  sortKey: number;
  title: string;
  caseId: string;
  caseTitle: string;
  episodeId: string;
  location?: string;
  type: string;
  agency?: string;
  fileCount: number;
  description?: string;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseDate(raw?: string): { year: number; month: number; label: string } | null {
  if (!raw) return null;
  // Try YYYY-MM
  const ym = raw.match(/^(\d{4})-(\d{2})/);
  if (ym) {
    const y = parseInt(ym[1], 10);
    const m = parseInt(ym[2], 10);
    return { year: y, month: m, label: `${MONTHS[m - 1]} ${y}` };
  }
  const y = raw.match(/^(\d{4})/);
  if (y) return { year: parseInt(y[1], 10), month: 0, label: y[1] };
  return null;
}

function buildEntries(): TimelineEntry[] {
  const out: TimelineEntry[] = [];
  for (const c of cases) {
    if (!c.episodes) continue;
    for (const ep of c.episodes) {
      const raw =
        ep.date ?? ep.dateRange?.split(" ")[0] ?? c.date ?? (c.year ? String(c.year) : undefined);
      const parsed = parseDate(raw);
      if (!parsed) continue;
      out.push({
        year: parsed.year,
        date: parsed.label,
        sortKey: parsed.year * 100 + parsed.month,
        title: ep.title,
        caseId: c.caseId,
        caseTitle: c.title,
        episodeId: ep.episodeId,
        location: ep.location ?? c.location,
        type: ep.type,
        agency: c.agency,
        fileCount: ep.files.length,
        description: ep.description,
      });
    }
  }
  return out.sort((a, b) => a.sortKey - b.sortKey);
}

const ERA_TINTS: Record<string, string> = {
  "1960s": "oklch(0.55 0.22 28)",
  "1970s": "oklch(0.6 0.18 40)",
  "1980s": "oklch(0.7 0.17 60)",
  "1990s": "oklch(0.75 0.15 80)",
  "2000s": "oklch(0.78 0.16 62)",
  "2010s": "oklch(0.65 0.18 200)",
  "2020s": "oklch(0.7 0.16 240)",
};
const eraOf = (y: number) => `${Math.floor(y / 10) * 10}s`;

function TimelinePage() {
  const entries = useMemo(buildEntries, []);
  const eras = useMemo(() => Array.from(new Set(entries.map((e) => eraOf(e.year)))), [entries]);
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [eraFilter, setEraFilter] = useState<string | "all">("all");

  const visible = useMemo(() => {
    let v = entries;
    if (eraFilter !== "all") v = v.filter((e) => eraOf(e.year) === eraFilter);
    return order === "asc" ? v : [...v].reverse();
  }, [entries, order, eraFilter]);

  const minYear = entries[0]?.year ?? 0;
  const maxYear = entries[entries.length - 1]?.year ?? 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* Header */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="scanlines absolute inset-0 opacity-30" />
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 70% 20%, oklch(0.78 0.16 62 / 0.18), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-6 py-16">
          <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary">
            Chronology
          </div>
          <h1 className="mt-6 max-w-4xl font-display text-5xl leading-[1.05] sm:text-7xl">
            {minYear} → {maxYear}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Every dated incident in the archive, plotted in sequence. Move from Apollo's lunar
            anomalies to last year's Western US field investigations along a single thread of
            declassified time.
          </p>

          {/* Era axis */}
          <div className="mt-12">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Decades
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <FilterChip active={eraFilter === "all"} onClick={() => setEraFilter("all")}>
                All
              </FilterChip>
              {eras.map((era) => (
                <FilterChip
                  key={era}
                  active={eraFilter === era}
                  onClick={() => setEraFilter(era)}
                  tint={ERA_TINTS[era]}
                >
                  {era}
                </FilterChip>
              ))}
              <button
                onClick={() => setOrder((o) => (o === "asc" ? "desc" : "asc"))}
                className="ml-auto rounded-sm border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                Order · {order === "asc" ? "Oldest first" : "Newest first"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="relative mx-auto max-w-5xl px-6 py-16">
        {visible.length === 0 ? (
          <p className="text-muted-foreground">No entries.</p>
        ) : (
          <ol className="relative">
            {/* Spine */}
            <div className="pointer-events-none absolute top-0 bottom-0 left-[7.25rem] hidden w-px bg-border sm:block" />

            {visible.map((e, i) => {
              const prev = visible[i - 1];
              const showYear = !prev || prev.year !== e.year;
              const tint = ERA_TINTS[eraOf(e.year)] ?? "var(--color-primary)";

              return (
                <li key={e.caseId + e.episodeId + i} className="relative">
                  {showYear && (
                    <div className="sticky top-[64px] z-10 -mx-2 mb-4 mt-10 flex items-baseline gap-4 bg-background/85 px-2 py-2 backdrop-blur first:mt-0">
                      <span className="font-display text-5xl" style={{ color: tint }}>
                        {e.year}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                        {eraOf(e.year)}
                      </span>
                    </div>
                  )}

                  <Link
                    to="/cases/$caseId/episodes/$episodeId"
                    params={{ caseId: e.caseId, episodeId: e.episodeId }}
                    className="group relative grid grid-cols-1 gap-4 py-5 sm:grid-cols-[7rem_1fr] sm:gap-8"
                  >
                    {/* Date */}
                    <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground sm:text-right">
                      {e.date}
                    </div>

                    {/* Node */}
                    <div className="absolute left-[7.25rem] top-7 hidden -translate-x-1/2 sm:block">
                      <div
                        className="h-3 w-3 rounded-full ring-4 ring-background transition-all group-hover:scale-125"
                        style={{ backgroundColor: tint, boxShadow: `0 0 16px ${tint}` }}
                      />
                    </div>

                    {/* Card */}
                    <div className="rounded-sm border border-border bg-card p-5 transition-all group-hover:border-primary/60 group-hover:shadow-[0_0_24px_-12px_var(--color-primary)] sm:ml-4">
                      <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        <span style={{ color: tint }}>{e.type.replace(/_/g, " ")}</span>
                        {e.location && (
                          <>
                            <span>·</span>
                            <span>{e.location}</span>
                          </>
                        )}
                        {e.agency && (
                          <>
                            <span>·</span>
                            <span>{e.agency}</span>
                          </>
                        )}
                      </div>
                      <h3 className="mt-2 font-display text-2xl leading-snug transition-colors group-hover:text-primary">
                        {e.title}
                      </h3>
                      {e.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                          {e.description}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        <span>{e.caseTitle}</span>
                        <span>{e.fileCount} files</span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
  tint,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tint?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-sm border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors " +
        (active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:border-primary hover:text-primary")
      }
      style={!active && tint ? { color: tint, borderColor: `${tint}55` } : undefined}
    >
      {children}
    </button>
  );
}
