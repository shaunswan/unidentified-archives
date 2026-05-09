import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import {
  archiveFacets,
  buildArchiveSearchIndex,
  defaultArchiveFilters,
  searchArchive,
  type ArchiveSearchFilters,
  type ArchiveSearchKind,
  type ArchiveSearchResult,
} from "@/lib/archive-index";
import { fileHref } from "@/lib/cases";
import { seoHead } from "@/lib/seo";

export const Route = createFileRoute("/search")({
  component: SearchPage,
  head: () => ({
    ...seoHead({
      title: "Search UAP Cases, Episodes, Files, Agencies, and Regions",
      description:
        "Search the PURSUE Release 01 archive by case, episode, agency, region, date, evidence type, source folder, PDF, image, video, and file name.",
      path: "/search",
    }),
  }),
});

const kindLabels: Record<ArchiveSearchKind, string> = {
  case: "Cases",
  episode: "Episodes",
  file: "Files",
};

function SearchPage() {
  const index = useMemo(buildArchiveSearchIndex, []);
  const facets = useMemo(() => archiveFacets(index), [index]);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<ArchiveSearchFilters>(defaultArchiveFilters);

  const results = useMemo(() => searchArchive(query, filters, index), [filters, index, query]);
  const grouped = useMemo(
    () => ({
      case: results.filter((result) => result.kind === "case"),
      episode: results.filter((result) => result.kind === "episode"),
      file: results.filter((result) => result.kind === "file"),
    }),
    [results],
  );

  const hasFilters = Object.values(filters).some((value) => value !== "all");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="border-b border-border/70 pb-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-primary">
            Research Desk
          </div>
          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-end">
            <div>
              <h1 className="font-display text-5xl leading-tight sm:text-6xl">Evidence Search</h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
                Search the archive by case, episode, file, agency, region, date, evidence type, or
                source folder.
              </p>
            </div>
            <div className="border border-border bg-card p-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Indexed material
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <MiniStat label="Cases" value={String(grouped.case.length)} />
                <MiniStat label="Episodes" value={String(grouped.episode.length)} />
                <MiniStat label="Files" value={String(grouped.file.length)} />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 py-8 lg:grid-cols-[20rem_1fr]">
          <aside className="space-y-5">
            <div className="border border-border bg-card p-4">
              <label
                htmlFor="archive-search"
                className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
              >
                Search terms
              </label>
              <div className="mt-2 flex items-center gap-2 border border-border bg-background px-3 py-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  id="archive-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Apollo, Syria, FBI, mp4..."
                  className="min-w-0 flex-1 bg-transparent font-mono text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Filters
                </div>
                {(hasFilters || query) && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setFilters(defaultArchiveFilters());
                    }}
                    className="font-mono text-[10px] uppercase tracking-widest text-foreground underline underline-offset-4"
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="mt-4 space-y-3">
                <FilterSelect
                  label="Agency"
                  value={filters.agency}
                  options={facets.agencies}
                  onChange={(agency) => setFilters((current) => ({ ...current, agency }))}
                />
                <FilterSelect
                  label="Region"
                  value={filters.location}
                  options={facets.locations}
                  onChange={(location) => setFilters((current) => ({ ...current, location }))}
                />
                <FilterSelect
                  label="Evidence Type"
                  value={filters.type}
                  options={facets.types}
                  onChange={(type) => setFilters((current) => ({ ...current, type }))}
                />
                <FilterSelect
                  label="Decade"
                  value={filters.decade}
                  options={facets.decades}
                  onChange={(decade) => setFilters((current) => ({ ...current, decade }))}
                />
                <FilterSelect
                  label="File Type"
                  value={filters.fileType}
                  options={facets.fileTypes}
                  onChange={(fileType) => setFilters((current) => ({ ...current, fileType }))}
                />
              </div>
            </div>
          </aside>

          <section>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3">
              <div>
                <h2 className="font-display text-3xl">Results</h2>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {results.length} matching records
                </p>
              </div>
              {!query && !hasFilters && (
                <div className="font-serif text-sm italic text-muted-foreground">
                  Begin with a term, or browse the archive facets at left.
                </div>
              )}
            </div>

            {results.length === 0 ? (
              <div className="border border-dashed border-border p-8 text-center">
                <h3 className="font-display text-2xl">No matches found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try a broader region, agency, file type, or a shorter search term.
                </p>
              </div>
            ) : (
              <div className="space-y-10">
                {(["case", "episode", "file"] as ArchiveSearchKind[]).map((kind) => (
                  <ResultGroup key={kind} title={kindLabels[kind]} results={grouped[kind]} />
                ))}
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border/60 px-2 py-3">
      <div className="font-display text-2xl text-foreground">{value}</div>
      <div className="mt-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full border border-border bg-background px-3 py-2 font-mono text-xs text-foreground outline-none"
      >
        <option value="all">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option.replace(/_/g, " ")}
          </option>
        ))}
      </select>
    </label>
  );
}

function ResultGroup({ title, results }: { title: string; results: ArchiveSearchResult[] }) {
  if (results.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <h3 className="font-display text-2xl">{title}</h3>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {results.length}
        </span>
      </div>
      <div className="divide-y divide-border/60 border-y border-border/60">
        {results.slice(0, 40).map((result) => (
          <ResultRow key={result.id} result={result} />
        ))}
      </div>
      {results.length > 40 && (
        <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Showing first 40 {title.toLowerCase()}; refine filters for a shorter list.
        </p>
      )}
    </section>
  );
}

function ResultRow({ result }: { result: ArchiveSearchResult }) {
  const meta = [
    result.caseId,
    result.episodeId,
    result.agency,
    result.locations[0],
    result.dates[0],
    result.fileType,
  ].filter(Boolean);

  const body = (
    <>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {meta.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <h4 className="mt-2 font-display text-xl leading-snug group-hover:text-primary">
          {result.title}
        </h4>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {result.summary}
        </p>
      </div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Open
      </div>
    </>
  );

  if (result.kind === "file" && result.filePath) {
    return (
      <div className="group flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
        <Link
          to={result.episodeId ? "/cases/$caseId/episodes/$episodeId" : "/cases/$caseId"}
          params={
            result.episodeId
              ? { caseId: result.caseId, episodeId: result.episodeId }
              : { caseId: result.caseId }
          }
          className="flex min-w-0 flex-1 items-center gap-4"
        >
          {body}
        </Link>
        <a
          href={fileHref(result.filePath)}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 border border-border px-3 py-2 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          Source file
        </a>
      </div>
    );
  }

  return (
    <Link
      to={result.kind === "case" ? "/cases/$caseId" : "/cases/$caseId/episodes/$episodeId"}
      params={
        result.kind === "case"
          ? { caseId: result.caseId }
          : { caseId: result.caseId, episodeId: result.episodeId! }
      }
      className="group flex items-center gap-4 py-4"
    >
      {body}
    </Link>
  );
}
