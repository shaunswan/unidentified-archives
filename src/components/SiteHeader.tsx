import { Link } from "@tanstack/react-router";
import { UapRadioControl } from "@/components/UapRadio";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-double border-foreground bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-3 md:flex-row md:items-center md:justify-between">
        <Link to="/" className="gazette-logo" aria-label="The UAP Gazette, Declassified Edition">
          <span className="gazette-logo__copy" aria-hidden="true">
            <span className="font-blackletter text-2xl leading-none">The UAP Gazette</span>
            <span className="font-serif text-[11px] italic text-muted-foreground">
              Declassified Edition
            </span>
          </span>
          <span className="gazette-logo__visitor" aria-hidden="true">
            <span className="pixel-visitor pixel-visitor--saucer">
              <span className="pixel-visitor__beam" />
            </span>
            <span className="pixel-visitor pixel-visitor--alien">
              <span className="pixel-visitor__eye pixel-visitor__eye--left" />
              <span className="pixel-visitor__eye pixel-visitor__eye--right" />
            </span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] md:gap-5">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="transition-colors hover:underline underline-offset-4 [&.active]:font-bold [&.active]:underline"
          >
            Catalog
          </Link>
          <Link
            to="/timeline"
            className="transition-colors hover:underline underline-offset-4 [&.active]:font-bold [&.active]:underline"
          >
            Timeline
          </Link>
          <Link
            to="/about"
            className="transition-colors hover:underline underline-offset-4 [&.active]:font-bold [&.active]:underline"
          >
            Masthead
          </Link>
          <UapRadioControl />
          <a
            href="https://www.war.gov/ufo"
            target="_blank"
            rel="noopener noreferrer"
            className="font-serif italic normal-case tracking-normal hover:underline underline-offset-4"
          >
            Source [ext]
          </a>
        </nav>
      </div>
    </header>
  );
}
