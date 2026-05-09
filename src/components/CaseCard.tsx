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
      className="group relative flex flex-col overflow-hidden border border-foreground/70 bg-card p-5 transition-all hover:bg-secondary"
    >
      {/* Top dateline */}
      <div className="flex items-center justify-between border-b border-foreground/40 pb-2 font-mono text-[10px] uppercase tracking-widest">
        <span>No. {String(index + 1).padStart(2, "0")}</span>
        <span>{c.agency ?? "—"}</span>
      </div>

      {/* Kicker */}
      <div className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.25em]">
        {typeLabel[c.type] ?? c.type}
      </div>

      {/* Headline */}
      <h3 className="mt-2 text-center font-serif text-2xl font-black leading-tight">
        {c.title}
      </h3>

      {/* Byline */}
      <div className="mt-2 text-center font-serif text-xs italic">
        {period}{c.location ? ` · ${c.location}` : ""}
      </div>

      <div className="my-3 border-t border-dashed border-foreground/40" />

      {/* Lede */}
      <p className="font-serif text-sm leading-relaxed text-foreground/85 text-justify line-clamp-4">
        {c.description}
      </p>

      <div className="mt-auto flex items-center justify-between border-t border-foreground/40 pt-3 font-mono text-[10px] uppercase tracking-widest">
        <span>{epCount} episodes</span>
        <span className="italic font-serif normal-case tracking-normal">cont'd inside →</span>
        <span>{fileCount} files</span>
      </div>
    </Link>
  );
}
