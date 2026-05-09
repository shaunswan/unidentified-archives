import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { metadata, totalEpisodes, totalFiles, cases } from "@/lib/cases";

export const Route = createFileRoute("/about")({
  component: About,
  head: () => ({
    meta: [
      { title: "About — The UAP Archive" },
      { name: "description", content: "About the PURSUE Release 01 archive: methodology, sources, and how to navigate the cases." },
    ],
  }),
});

function About() {
  const agencies = Array.from(new Set(cases.map((c) => c.agency).filter(Boolean))) as string[];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-6 py-20">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">
          About the archive
        </div>
        <h1 className="mt-6 font-display text-5xl leading-tight sm:text-6xl">
          A documentary lens on the disclosed.
        </h1>

        <div className="prose-invert mt-10 space-y-6 text-lg leading-relaxed text-muted-foreground">
          <p>
            On {metadata.created}, the Department of War posted the first
            tranche of materials it calls <em className="text-foreground">PURSUE Release 01</em> —
            a collection of mission reports, diplomatic cables, NASA crew
            debriefings, FBI field photography, witness statements and
            video evidence relating to Unidentified Anomalous Phenomena.
          </p>
          <p>
            This archive reorganizes those <span className="text-foreground">{totalFiles} files</span>
            {" "}into <span className="text-foreground">{cases.length} cases</span> and
            {" "}<span className="text-foreground">{totalEpisodes} narrative episodes</span> so that
            you can move through the material the way you would a
            documentary series — by location, by mission, by year — instead
            of as a flat directory.
          </p>
          <p>
            Originating agencies in this release include
            {" "}{agencies.join(", ")}. The geography spans the Apollo
            program of the late 1960s, Cold War cables from Papua New
            Guinea and Kazakhstan, decades of CENTCOM operations across the
            Persian Gulf and Mediterranean, and recent FBI field
            investigations across the Western United States.
          </p>
          <p>
            Original files are hosted by the source.
            {" "}
            <a
              href="https://www.war.gov/ufo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              www.war.gov/ufo ↗
            </a>
          </p>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-6 border-t border-border/60 pt-8">
          {[
            [String(cases.length).padStart(2, "0"), "Cases"],
            [String(totalEpisodes), "Episodes"],
            [String(totalFiles), "Files"],
          ].map(([n, l]) => (
            <div key={l}>
              <div className="font-display text-4xl text-primary">{n}</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {l}
              </div>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}
