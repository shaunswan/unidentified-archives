import { createFileRoute, Link } from "@tanstack/react-router";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Globe2, MapPin } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { buildEvidenceMapPoints, type EvidenceMapPoint } from "@/lib/archive-index";

export const Route = createFileRoute("/map")({
  component: EvidenceMapPage,
  head: () => ({
    meta: [
      { title: "Evidence Map - The UAP Archive" },
      {
        name: "description",
        content:
          "An interactive map of approximate archive regions and non-geographic space program evidence in PURSUE Release 01.",
      },
    ],
  }),
});

type EvidenceMapComponent = React.ComponentType<{
  points: EvidenceMapPoint[];
  selectedId: string;
  onSelect: (id: string) => void;
}>;

function EvidenceMapPage() {
  const points = useMemo(buildEvidenceMapPoints, []);
  const mappedPoints = points.filter((point) => point.location.coordinates);
  const spacePoints = points.filter((point) => point.location.category === "space");
  const [selectedId, setSelectedId] = useState(mappedPoints[0]?.location.id ?? "");
  const [MapComponent, setMapComponent] = useState<EvidenceMapComponent | null>(null);

  const selectedPoint =
    points.find((point) => point.location.id === selectedId) ?? mappedPoints[0] ?? points[0];

  useEffect(() => {
    let mounted = true;
    import("@/components/EvidenceMap").then((module) => {
      if (mounted) setMapComponent(() => module.default);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="border-b border-border/70 pb-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-primary">
            Geographic Index
          </div>
          <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-end">
            <div>
              <h1 className="font-display text-5xl leading-tight sm:text-6xl">Evidence Map</h1>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
                Approximate archive regions for cases and episodes with geographic context. Region
                markers summarize clustered evidence; exact incident coordinates are not claimed.
              </p>
            </div>
            <div className="border border-border bg-card p-4">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <Globe2 className="h-3.5 w-3.5" />
                Coverage
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <MiniStat label="Regions" value={String(mappedPoints.length)} />
                <MiniStat
                  label="Cases"
                  value={String(new Set(points.flatMap((p) => p.cases.map((c) => c.caseId))).size)}
                />
                <MiniStat
                  label="Files"
                  value={String(points.reduce((sum, p) => sum + p.fileCount, 0))}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 py-8 lg:grid-cols-[1fr_22rem]">
          <div>
            {MapComponent ? (
              <MapComponent
                points={points}
                selectedId={selectedPoint?.location.id ?? ""}
                onSelect={setSelectedId}
              />
            ) : (
              <div className="flex h-[34rem] items-center justify-center border border-border bg-secondary font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Loading interactive map
              </div>
            )}
            <p className="mt-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <ExternalLink className="h-3 w-3" />
              Map tiles by OpenStreetMap. Markers are curated archive regions.
            </p>
          </div>

          <aside className="space-y-5">
            {selectedPoint && <RegionPanel point={selectedPoint} />}

            <div className="border border-border bg-card p-4">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Archive Regions
              </div>
              <div className="mt-3 max-h-80 space-y-2 overflow-auto pr-1">
                {mappedPoints.map((point) => (
                  <button
                    key={point.location.id}
                    type="button"
                    onClick={() => setSelectedId(point.location.id)}
                    className={
                      "flex w-full items-center justify-between gap-3 border px-3 py-2 text-left transition-colors " +
                      (selectedPoint?.location.id === point.location.id
                        ? "border-primary bg-secondary"
                        : "border-border hover:border-primary")
                    }
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-serif text-sm font-bold">
                        {point.location.label}
                      </span>
                      <span className="block font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                        {point.fileCount} files · {point.dateSpan}
                      </span>
                    </span>
                    <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>

            {spacePoints.map((point) => (
              <div key={point.location.id} className="border border-border bg-card p-4">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Non-Geographic Collection
                </div>
                <h3 className="mt-2 font-display text-2xl">{point.location.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Apollo and Skylab evidence is kept separate from the terrestrial map so the
                  archive does not imply a false ground location.
                </p>
                <EvidenceLinks point={point} />
              </div>
            ))}
          </aside>
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

function RegionPanel({ point }: { point: EvidenceMapPoint }) {
  return (
    <div className="border border-border bg-card p-4">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {point.location.category === "broad-region"
          ? "Broad Archive Region"
          : "Approximate Archive Region"}
      </div>
      <h2 className="mt-2 font-display text-3xl leading-tight">{point.location.label}</h2>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <MiniStat label="Cases" value={String(point.cases.length)} />
        <MiniStat label="Episodes" value={String(point.episodes.length)} />
        <MiniStat label="Files" value={String(point.fileCount)} />
      </div>
      <div className="mt-4 space-y-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <div>Date span: {point.dateSpan}</div>
        <div>Agencies: {point.agencies.join(", ") || "Unknown"}</div>
        <div>
          Types:{" "}
          {point.types
            .slice(0, 4)
            .map((type) => type.replace(/_/g, " "))
            .join(", ")}
        </div>
      </div>
      <EvidenceLinks point={point} />
    </div>
  );
}

function EvidenceLinks({ point }: { point: EvidenceMapPoint }) {
  const episodes = point.episodes.slice(0, 5);

  return (
    <div className="mt-4 border-t border-border/60 pt-3">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Linked evidence
      </div>
      <div className="mt-2 space-y-2">
        {episodes.map(({ caseItem, episode }) => (
          <Link
            key={`${caseItem.caseId}-${episode.episodeId}`}
            to="/cases/$caseId/episodes/$episodeId"
            params={{ caseId: caseItem.caseId, episodeId: episode.episodeId }}
            className="block border border-border px-3 py-2 transition-colors hover:border-primary"
          >
            <span className="block font-serif text-sm font-bold leading-snug">{episode.title}</span>
            <span className="mt-1 block font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              {caseItem.caseId} · {episode.files.length} files
            </span>
          </Link>
        ))}
        {point.episodes.length > episodes.length && (
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            + {point.episodes.length - episodes.length} more episodes in this region
          </p>
        )}
      </div>
    </div>
  );
}
