import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_var(--color-primary)]" />
          <div className="flex flex-col leading-none">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              PURSUE / Release 01
            </span>
            <span className="font-display text-lg">The UAP Archive</span>
          </div>
        </Link>
        <nav className="flex items-center gap-6 font-mono text-xs uppercase tracking-widest">
          <Link to="/" activeOptions={{ exact: true }} className="text-muted-foreground transition-colors hover:text-foreground [&.active]:text-primary">
            Cases
          </Link>
          <Link to="/about" className="text-muted-foreground transition-colors hover:text-foreground [&.active]:text-primary">
            About
          </Link>
          <a href="https://www.war.gov/ufo" target="_blank" rel="noopener noreferrer" className="text-muted-foreground transition-colors hover:text-foreground">
            Source ↗
          </a>
        </nav>
      </div>
    </header>
  );
}
