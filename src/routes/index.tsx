import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { CaseCard } from "@/components/CaseCard";
import { cases, metadata, totalEpisodes, totalFiles } from "@/lib/cases";
import { defaultDescription, defaultTitle, seoHead } from "@/lib/seo";
import { Map, Search } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    ...seoHead({ title: defaultTitle, description: defaultDescription, path: "/" }),
  }),
});

function Index() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen newsprint text-foreground">
      <SiteHeader />

      {/* MASTHEAD */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-6 pt-10">
          {/* Top dateline strip */}
          <div className="flex flex-wrap items-end justify-between gap-2 border-b border-foreground/70 pb-2 font-serif text-[11px] italic">
            <span>Vol. I &middot; No. 01</span>
            <span className="uppercase tracking-widest not-italic">Declassified Edition</span>
            <span>Price: One Dime</span>
          </div>

          {/* Masthead title */}
          <h1 className="mt-4 text-center font-blackletter text-7xl leading-none sm:text-8xl md:text-[9rem]">
            The UAP Gazette
          </h1>

          {/* Sub dateline */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rule-double py-2 font-serif text-xs">
            <span className="uppercase tracking-widest">{today}</span>
            <span className="italic">"All The Truth That's Fit To Disclose"</span>
            <span className="uppercase tracking-widest">PURSUE / Release {metadata.created}</span>
          </div>

          {/* HERO HEADLINE — newspaper style */}
          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-12">
            {/* Left column: lead story */}
            <article className="md:col-span-8 md:border-r md:border-foreground/40 md:pr-8">
              <div className="text-center">
                <div className="font-mono text-[11px] uppercase tracking-[0.3em]">
                  ★ Extra ★ Extra ★
                </div>
                <h2 className="mt-3 font-serif text-5xl font-black leading-[0.95] sm:text-6xl md:text-7xl">
                  ARE WE ALONE?
                </h2>
                <div className="mt-3 font-serif text-2xl italic">
                  Department of War Releases First Tranche of UAP Files
                </div>
                <div className="mt-2 font-mono text-[10px] uppercase tracking-widest">
                  By Staff Correspondents &middot; Filed from Washington
                </div>
              </div>

              <div className="mt-8 columns-1 gap-8 sm:columns-2 [&>p]:mb-4 [&>p]:font-serif [&>p]:text-[15px] [&>p]:leading-relaxed [&>p]:text-justify">
                <p className="dropcap">
                  In an extraordinary disclosure, the Department of War has posted the first tranche
                  of materials it calls PURSUE Release {metadata.created} — a sweeping collection of
                  mission reports, diplomatic cables, NASA crew debriefings, field photographs,
                  witness statements and motion-picture evidence concerning Unidentified Anomalous
                  Phenomena.
                </p>
                <p>
                  The archive, presented herein, reorganizes some {totalFiles} files into{" "}
                  {cases.length} cases and {totalEpisodes} narrative episodes — that the curious
                  reader may pursue the matter not as a flat directory but as a documentary serial:
                  by mission, by location, by year.
                </p>
                <p>
                  Geographies span the Apollo program of the late 'sixties, Cold War cables from
                  Papua New Guinea and Kazakhstan, decades of CENTCOM operations across the Persian
                  Gulf and Mediterranean, and recent Bureau field investigations across the Western
                  United States.
                </p>
                <p>
                  Readers are invited to begin with the Catalog below, or to consult the Timeline
                  for a chronological accounting of events. The originals remain hosted by the
                  source.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-foreground/40 pt-4">
                <a
                  href="#cases"
                  className="border-2 border-foreground bg-foreground px-5 py-2 font-mono text-[11px] uppercase tracking-widest text-background transition hover:bg-background hover:text-foreground"
                >
                  Read the catalog →
                </a>
                <Link
                  to="/timeline"
                  className="border-2 border-foreground px-5 py-2 font-mono text-[11px] uppercase tracking-widest transition hover:bg-foreground hover:text-background"
                >
                  Open timeline
                </Link>
                <Link
                  to="/about"
                  className="font-serif text-sm italic underline underline-offset-4"
                >
                  About this edition
                </Link>
              </div>
            </article>

            {/* Right column: sidebar stories */}
            <aside className="md:col-span-4">
              <div className="border-y-4 border-double border-foreground py-3 text-center">
                <div className="font-mono text-[10px] uppercase tracking-[0.3em]">
                  By the Numbers
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-3">
                  {[
                    ["09", "Cases"],
                    [String(metadata.totalIncidents), "Incidents"],
                    [String(totalEpisodes), "Episodes"],
                    [String(totalFiles), "Files"],
                  ].map(([n, l]) => (
                    <div key={l} className="border border-foreground/30 px-2 py-3">
                      <div className="font-serif text-4xl font-black leading-none">{n}</div>
                      <div className="mt-1 font-mono text-[9px] uppercase tracking-widest">{l}</div>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="mt-6 border-t border-foreground/40 pt-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.3em]">
                  Inside this edition
                </div>
                <ul className="mt-3 space-y-3 font-serif text-sm">
                  <li className="border-b border-dashed border-foreground/40 pb-2">
                    <span className="font-black">Apollo Crew Debriefs</span> — astronauts on
                    sightings beyond the cradle of Earth.
                  </li>
                  <li className="border-b border-dashed border-foreground/40 pb-2">
                    <span className="font-black">Strait of Hormuz</span> — CENTCOM logs an
                    unidentified contact at altitude.
                  </li>
                  <li className="border-b border-dashed border-foreground/40 pb-2">
                    <span className="font-black">Papua, '74</span> — diplomatic cables from a
                    missionary's village.
                  </li>
                  <li>
                    <span className="font-black">Western U.S. Files</span> — Bureau field
                    photography across four states.
                  </li>
                </ul>
              </div>

              <div className="mt-6 border-2 border-foreground p-4 text-center">
                <div className="font-serif text-2xl font-black uppercase tracking-widest">
                  Notice
                </div>
                <p className="mt-2 font-serif text-sm italic">
                  This edition is compiled from public records released by the Department of War.
                  Files remain hosted by the source.
                </p>
                <a
                  href="https://www.war.gov/ufo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block font-mono text-[10px] uppercase tracking-widest underline underline-offset-4"
                >
                  www.war.gov/ufo ↗
                </a>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* CASES GRID */}
      <section id="cases" className="relative mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 rule-double py-3 text-center">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em]">
            Section B &middot; The Catalog
          </div>
          <h2 className="mt-2 font-serif text-4xl font-black">Nine Cases of Note</h2>
          <div className="mt-1 font-serif text-sm italic">
            — arranged for the discerning reader —
          </div>
        </div>

        <div className="mb-8 grid gap-4 border-y border-foreground/50 py-5 md:grid-cols-2">
          <Link
            to="/search"
            className="group flex items-center gap-4 border border-foreground/60 bg-card p-4 transition-colors hover:bg-secondary"
          >
            <Search className="h-6 w-6 shrink-0" strokeWidth={1.5} />
            <span>
              <span className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Research Desk
              </span>
              <span className="mt-1 block font-serif text-xl font-black group-hover:underline">
                Search cases, episodes, files, agencies, regions, and dates
              </span>
            </span>
          </Link>
          <Link
            to="/map"
            className="group flex items-center gap-4 border border-foreground/60 bg-card p-4 transition-colors hover:bg-secondary"
          >
            <Map className="h-6 w-6 shrink-0" strokeWidth={1.5} />
            <span>
              <span className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Geographic Index
              </span>
              <span className="mt-1 block font-serif text-xl font-black group-hover:underline">
                Browse approximate archive regions on an evidence map
              </span>
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cases.map((c, i) => (
            <CaseCard key={c.caseId} c={c} index={i} />
          ))}
        </div>
      </section>

      <footer className="border-t-4 border-double border-foreground py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 text-center font-serif text-xs italic sm:flex-row">
          <span>The UAP Gazette &middot; PURSUE Release 01</span>
          <span>Compiled {metadata.created} &middot; Source: www.war.gov/ufo</span>
        </div>
      </footer>
    </div>
  );
}
