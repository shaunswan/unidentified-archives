import { cases, metadata, totalEpisodes, totalFiles, type Case, type Episode } from "@/lib/cases";

export const siteName = "The UAP Gazette";
export const siteUrl = (
  import.meta.env.VITE_SITE_URL || "https://unidentified-archives.pages.dev"
).replace(/\/$/, "");
export const defaultTitle = "The UAP Gazette - Declassified UAP Files";
export const defaultDescription =
  "A searchable public archive of PURSUE Release 01: 9 UAP cases, 23 incidents, narrative episodes, maps, timelines, and source files.";
export const socialImage = "/og-image.png";

type SeoOptions = {
  title?: string;
  description?: string;
  path?: string;
  type?: "website" | "article";
  image?: string;
  noindex?: boolean;
};

const absoluteUrl = (path = "/") => {
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
};

export function seoHead({
  title = defaultTitle,
  description = defaultDescription,
  path = "/",
  type = "website",
  image = socialImage,
  noindex = false,
}: SeoOptions = {}) {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: noindex ? "noindex, nofollow" : "index, follow" },
      { name: "author", content: siteName },
      { name: "application-name", content: siteName },
      {
        name: "keywords",
        content:
          "UAP archive, UFO documents, PURSUE Release 01, declassified files, Department of War UAP, NASA debriefings, CENTCOM UAP, FBI field photography",
      },
      { property: "og:site_name", content: siteName },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: type },
      { property: "og:url", content: url },
      { property: "og:image", content: imageUrl },
      { property: "og:image:width", content: "512" },
      { property: "og:image:height", content: "512" },
      { property: "og:image:alt", content: "The UAP Gazette archive insignia" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: imageUrl },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

export function truncateDescription(value: string, maxLength = 155) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).replace(/\s+\S*$/, "")}...`;
}

export function caseDescription(c: Case) {
  const period = c.yearRange ?? c.year?.toString() ?? c.date;
  const locations = c.locations?.join(", ") ?? c.location;
  const details = [c.agency, period, locations].filter(Boolean).join(" - ");
  return truncateDescription(`${c.description}${details ? ` Includes ${details}.` : "."}`);
}

export function episodeDescription(c: Case, ep: Episode) {
  const details = [c.title, ep.date ?? ep.dateRange, ep.location ?? c.location, c.agency]
    .filter(Boolean)
    .join(" - ");
  return truncateDescription(`${ep.description ?? ep.title}. Part of ${details}.`);
}

export function archiveSummary() {
  const agencies = Array.from(new Set(cases.map((c) => c.agency).filter(Boolean))).join(", ");
  return `PURSUE Release 01 index with ${cases.length} cases, ${metadata.totalIncidents} incidents, ${totalEpisodes} episodes, and ${totalFiles} source files. Agencies represented include ${agencies}.`;
}
