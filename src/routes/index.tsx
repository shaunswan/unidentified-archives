import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { CaseCard } from "@/components/CaseCard";
import { cases, metadata, totalEpisodes, totalFiles } from "@/lib/cases";
import heroImg from "@/assets/hero-uap.jpg";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "The UAP Archive — Declassified Files, PURSUE Release 01" },
      { name: "description", content: "Browse 9 cases and 23+ incidents from the Department of War's first major UAP disclosure release." },
    ],
  }),
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt="A glowing unidentified object in a dark night sky"
            width={1920}
            height={1088}
            className="h-full w-full object-cover opacity-70"
          />
          <div className="vignette absolute inset-0" />
          <div className="scanlines absolute inset-0 opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/30 to-background" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-32 sm:pt-32 sm:pb-44">
          <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary">
            ◈ Declassified · {metadata.created}
          </div>
          <h1 className="mt-6 max-w-4xl font-display text-5xl leading-[1.05] sm:text-7xl md:text-8xl">
            What the sky <em className="not-italic text-primary">refused</em> to explain.
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            An interactive archive of the Department of War's first major UAP
            disclosure: nine cases, twenty-three incidents, and one hundred
            and ninety-seven files spanning six decades — from Apollo to
            the Strait of Hormuz.
          </p>

          <div className="mt-12 flex flex-wrap gap-4">
            <a
              href="#cases"
              className="rounded-sm border border-primary bg-primary px-6 py-3 font-mono text-xs uppercase tracking-widest text-primary-foreground transition-all hover:bg-transparent hover:text-primary"
            >
              ▶ Begin browsing
            </a>
            <Link
              to="/about"
              className="rounded-sm border border-border px-6 py-3 font-mono text-xs uppercase tracking-widest text-foreground transition-all hover:border-primary hover:text-primary"
            >
              About this release
            </Link>
          </div>

          {/* Stats strip */}
          <dl className="mt-20 grid max-w-3xl grid-cols-2 gap-x-6 gap-y-8 border-t border-border/60 pt-8 sm:grid-cols-4">
            {[
              ["09", "Cases"],
              [String(metadata.totalIncidents), "Incidents"],
              [String(totalEpisodes), "Episodes"],
              [String(totalFiles), "Files"],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="font-display text-4xl text-primary sm:text-5xl">{n}</div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {l}
                </div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* CASES GRID */}
      <section id="cases" className="relative mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 flex items-end justify-between border-b border-border/60 pb-6">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Catalog · 9 cases
            </div>
            <h2 className="mt-3 font-display text-4xl">The Files</h2>
          </div>
          <div className="hidden font-mono text-xs uppercase tracking-widest text-muted-foreground sm:block">
            Source: war.gov/ufo
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cases.map((c, i) => (
            <CaseCard key={c.caseId} c={c} index={i} />
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-6 font-mono text-xs uppercase tracking-widest text-muted-foreground sm:flex-row sm:items-center">
          <span>The UAP Archive · PURSUE Release 01</span>
          <span>Compiled {metadata.created} · Source www.war.gov/ufo</span>
        </div>
      </footer>
    </div>
  );
}
