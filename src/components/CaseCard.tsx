import { Link } from "@tanstack/react-router";
import type { Case } from "@/lib/cases";

const typeLabel: Record<string, string> = {
  initial_report: "Initial Assessment",
  military_operations: "Military Ops",
  historical_cables: "Diplomatic Cables",
  space_program: "Space Program",
  field_investigation: "Field Investigation",
  testimony: "Witness Testimony",
  presentation: "Briefing",
  video_evidence: "Video Archive",
  compiled_index: "Index",
};

export function CaseCard({ c, index }: { c: Case; index: number }) {
  const epCount = c.episodes?.length ?? 0;
  const fileCount =
    (c.files?.length ?? 0) +
    (c.episodes?.reduce((n, e) => n + e.files.length, 0) ?? 0);
  const period = c.yearRange ?? c.year?.toString() ?? c.date ?? "—";

  return (
    <Link
      to="/cases/$caseId"
      params={{ caseId: c.caseId }}
      className="group relative flex flex-col overflow-hidden rounded-sm border border-border bg-card transition-all hover:border-primary/60 hover:shadow-[0_0_30px_-12px_var(--color-primary)]"
    >
      <div className="absolute right-3 top-3 z-10 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        EP. {String(index + 1).padStart(2, "0")}
      </div>

      <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
        <div
          className="absolute inset-0 scanlines opacity-60 transition-opacity group-hover:opacity-100"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 70% 40%, oklch(0.78 0.16 62 / 0.25), transparent 60%), linear-gradient(180deg, oklch(0.18 0.02 60), oklch(0.1 0.01 60))",
          }}
        />
        <div className="vignette absolute inset-0" />
        <div className="absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-widest text-primary">
          {typeLabel[c.type] ?? c.type}
        </div>
        <div className="absolute right-3 bottom-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {c.agency ?? "—"}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          {period}{c.location ? ` · ${c.location}` : ""}
        </div>
        <h3 className="font-display text-2xl leading-tight text-foreground transition-colors group-hover:text-primary">
          {c.title}
        </h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
        <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <span>{epCount} episodes</span>
          <span>{fileCount} files</span>
        </div>
      </div>
    </Link>
  );
}
