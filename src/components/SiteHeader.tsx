import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-double border-foreground bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link to="/" className="flex items-baseline gap-3">
          <span className="font-blackletter text-2xl leading-none">The UAP Gazette</span>
          <span className="font-serif text-[11px] italic text-muted-foreground">— Declassified Edition —</span>
        </Link>
        <nav className="flex items-center gap-5 font-mono text-[11px] uppercase tracking-[0.2em]">
          <Link to="/" activeOptions={{ exact: true }} className="transition-colors hover:underline underline-offset-4 [&.active]:font-bold [&.active]:underline">
            Catalog
          </Link>
          <Link to="/timeline" className="transition-colors hover:underline underline-offset-4 [&.active]:font-bold [&.active]:underline">
            Timeline
          </Link>
          <Link to="/about" className="transition-colors hover:underline underline-offset-4 [&.active]:font-bold [&.active]:underline">
            Masthead
          </Link>
          <a href="https://www.war.gov/ufo" target="_blank" rel="noopener noreferrer" className="italic font-serif normal-case tracking-normal hover:underline underline-offset-4">
            Source ↗
          </a>
        </nav>
      </div>
    </header>
  );
}
