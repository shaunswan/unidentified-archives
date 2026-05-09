import { fileKind, fileName } from "@/lib/cases";
import { FileText, Film, Image as ImageIcon, Database, Lock } from "lucide-react";

const kindMeta = {
  pdf: { Icon: FileText, label: "DOCUMENT", tint: "text-primary" },
  video: { Icon: Film, label: "VIDEO", tint: "text-accent" },
  image: { Icon: ImageIcon, label: "IMAGE", tint: "text-primary" },
  data: { Icon: Database, label: "DATA", tint: "text-muted-foreground" },
} as const;

export function FilePreview({ path, index }: { path: string; index: number }) {
  const kind = fileKind(path);
  const { Icon, label, tint } = kindMeta[kind];
  const name = fileName(path);

  return (
    <div className="group relative overflow-hidden rounded-sm border border-border bg-card transition-all hover:border-primary/60">
      <div className="relative aspect-video overflow-hidden bg-secondary">
        <div className="absolute inset-0 scanlines opacity-50" />
        <div className="vignette absolute inset-0" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              kind === "video"
                ? "radial-gradient(ellipse at 50% 50%, oklch(0.55 0.22 28 / 0.18), transparent 70%)"
                : "radial-gradient(ellipse at 30% 30%, oklch(0.78 0.16 62 / 0.15), transparent 70%)",
          }}
        />
        <div className="relative flex h-full flex-col items-center justify-center gap-3">
          <Icon className={`h-10 w-10 ${tint}`} strokeWidth={1.2} />
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            {label} · PREVIEW
          </div>
        </div>
        <div className="absolute left-2 top-2 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
          #{String(index + 1).padStart(3, "0")}
        </div>
        <div className="absolute right-2 top-2 flex items-center gap-1 font-mono text-[9px] uppercase tracking-widest text-accent">
          <Lock className="h-2.5 w-2.5" /> Restricted
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border/60 p-3">
        <div className="min-w-0 flex-1">
          <div className="truncate font-mono text-xs text-foreground">{name}</div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {path.split("/")[0]}
          </div>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-sm border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          Open
        </button>
      </div>
    </div>
  );
}
