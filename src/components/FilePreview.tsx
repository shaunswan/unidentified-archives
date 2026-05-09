"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { fileHref, fileKind, fileName } from "@/lib/cases";
import { Database, FileText, Film, Image as ImageIcon, Play } from "lucide-react";

const kindMeta = {
  pdf: { Icon: FileText, label: "DOCUMENT", tint: "text-primary" },
  video: { Icon: Film, label: "VIDEO", tint: "text-accent" },
  image: { Icon: ImageIcon, label: "IMAGE", tint: "text-primary" },
  data: { Icon: Database, label: "DATA", tint: "text-muted-foreground" },
} as const;

export function FilePreview({ path, index }: { path: string; index: number }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const kind = fileKind(path);
  const { Icon, label, tint } = kindMeta[kind];
  const name = fileName(path);
  const previewHref = fileHref(path);
  const isVideo = kind === "video";

  return (
    <>
      <div className="group relative overflow-hidden rounded-sm border border-border bg-card transition-all hover:border-primary/60">
        <div className="relative aspect-video overflow-hidden bg-secondary">
          {isVideo ? (
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="block h-full w-full text-left"
              aria-label={`Play ${name}`}
            >
              <PreviewSurface kind={kind} name={name} previewHref={previewHref} tint={tint} Icon={Icon} />
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex items-center gap-2 rounded-sm border border-border/70 bg-background/85 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-foreground backdrop-blur-sm">
                  <Play className="h-3 w-3 fill-current" /> Play in app
                </div>
              </div>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="block h-full w-full text-left"
              aria-label={`Open ${name}`}
            >
              <PreviewSurface
                kind={kind}
                name={name}
                previewHref={previewHref}
                tint={tint}
                Icon={Icon}
              />
            </button>
          )}
          <div className="pointer-events-none absolute inset-0 scanlines opacity-30" />
          <div className="pointer-events-none vignette absolute inset-0" />
          <div className="absolute left-2 top-2 rounded-sm border border-border/70 bg-background/80 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-muted-foreground backdrop-blur-sm">
            #{String(index + 1).padStart(3, "0")}
          </div>
          <div className="absolute right-2 top-2 rounded-sm border border-border/70 bg-background/80 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-foreground backdrop-blur-sm">
            {label}
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border/60 p-3">
          <div className="min-w-0 flex-1">
            <div className="truncate font-mono text-xs text-foreground">{name}</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {path.split("/")[0]}
            </div>
          </div>
          {isVideo ? (
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="shrink-0 rounded-sm border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Open
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="shrink-0 rounded-sm border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Open
            </button>
          )}
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl border-border bg-card p-0 sm:rounded-sm">
          <div className="border-b border-border/60 px-6 py-4">
            <DialogTitle className="font-display text-2xl">{name}</DialogTitle>
            <DialogDescription className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {isVideo ? "In-app video player" : "In-app document viewer"}
            </DialogDescription>
          </div>
          <div className="bg-black/90 p-4">
            <ExpandedPreview kind={kind} name={name} previewHref={previewHref} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

type PreviewSurfaceProps = {
  kind: ReturnType<typeof fileKind>;
  name: string;
  previewHref: string;
  tint: string;
  Icon: typeof FileText;
};

function PreviewSurface({ kind, name, previewHref, tint, Icon }: PreviewSurfaceProps) {
  if (kind === "image") {
    return (
      <img
        src={previewHref}
        alt={name}
        className="pointer-events-none h-full w-full object-cover"
        loading="lazy"
      />
    );
  }

  if (kind === "video") {
    return (
      <video
        className="pointer-events-none h-full w-full object-cover"
        src={previewHref}
        muted
        playsInline
        preload="metadata"
      />
    );
  }

  if (kind === "pdf") {
    return (
      <object
        data={`${previewHref}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
        type="application/pdf"
        className="pointer-events-none h-full w-full bg-background"
        aria-label={name}
      >
        <FallbackPreview tint={tint} Icon={Icon} />
      </object>
    );
  }

  return <FallbackPreview tint={tint} Icon={Icon} />;
}

function FallbackPreview({ tint, Icon }: { tint: string; Icon: typeof FileText }) {
  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center gap-3"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 30% 30%, oklch(0.78 0.16 62 / 0.15), transparent 70%)",
      }}
    >
      <Icon className={`h-10 w-10 ${tint}`} strokeWidth={1.2} />
      <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        Preview unavailable
      </div>
    </div>
  );
}

function ExpandedPreview({
  kind,
  name,
  previewHref,
}: {
  kind: ReturnType<typeof fileKind>;
  name: string;
  previewHref: string;
}) {
  if (kind === "image") {
    return <img src={previewHref} alt={name} className="max-h-[75vh] w-full rounded-sm object-contain" />;
  }

  if (kind === "video") {
    return (
      <video
        className="max-h-[75vh] w-full rounded-sm bg-black"
        src={previewHref}
        controls
        playsInline
        autoPlay
        loop
      />
    );
  }

  if (kind === "pdf") {
    return (
      <object
        data={`${previewHref}#toolbar=1&navpanes=0&view=FitH`}
        type="application/pdf"
        className="h-[75vh] w-full rounded-sm bg-background"
        aria-label={name}
      >
        <iframe src={previewHref} title={name} className="h-[75vh] w-full rounded-sm bg-background" />
      </object>
    );
  }

  return (
    <iframe
      src={previewHref}
      title={name}
      className="h-[75vh] w-full rounded-sm bg-background"
    />
  );
}
