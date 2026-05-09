import { cases, fileKind, fileName, type Case, type Episode } from "@/lib/cases";

export type ArchiveSearchKind = "case" | "episode" | "file";

export type ArchiveSearchResult = {
  id: string;
  kind: ArchiveSearchKind;
  title: string;
  summary: string;
  caseId: string;
  caseTitle: string;
  episodeId?: string;
  episodeTitle?: string;
  filePath?: string;
  agency?: string;
  locations: string[];
  types: string[];
  dates: string[];
  fileType?: ReturnType<typeof fileKind>;
  scoreText: {
    primary: string;
    secondary: string;
    metadata: string;
  };
};

export type ArchiveSearchFilters = {
  agency: string;
  location: string;
  type: string;
  decade: string;
  fileType: string;
};

export type EvidenceLocation = {
  id: string;
  label: string;
  aliases: string[];
  coordinates?: [number, number];
  approximate: boolean;
  category: "region" | "broad-region" | "space";
};

export type EvidenceMapPoint = {
  location: EvidenceLocation;
  cases: Case[];
  episodes: Array<{ caseItem: Case; episode: Episode }>;
  fileCount: number;
  dateSpan: string;
  agencies: string[];
  types: string[];
};

const EMPTY_FILTERS: ArchiveSearchFilters = {
  agency: "all",
  location: "all",
  type: "all",
  decade: "all",
  fileType: "all",
};

export const defaultArchiveFilters = (): ArchiveSearchFilters => ({ ...EMPTY_FILTERS });

export const evidenceLocations: EvidenceLocation[] = [
  {
    id: "syria",
    label: "Syria",
    aliases: ["Syria"],
    coordinates: [34.8021, 38.9968],
    approximate: true,
    category: "region",
  },
  {
    id: "arabian-gulf",
    label: "Arabian Gulf",
    aliases: ["Arabian Gulf"],
    coordinates: [26.75, 51.25],
    approximate: true,
    category: "region",
  },
  {
    id: "persian-gulf",
    label: "Persian Gulf",
    aliases: ["Persian Gulf"],
    coordinates: [27.2, 51.6],
    approximate: true,
    category: "region",
  },
  {
    id: "strait-of-hormuz",
    label: "Strait of Hormuz",
    aliases: ["Strait of Hormuz"],
    coordinates: [26.5667, 56.25],
    approximate: true,
    category: "region",
  },
  {
    id: "gulf-of-aden",
    label: "Gulf of Aden",
    aliases: ["Gulf of Aden"],
    coordinates: [12.5, 48],
    approximate: true,
    category: "region",
  },
  {
    id: "mediterranean",
    label: "Mediterranean",
    aliases: ["Mediterranean", "Mediterranean Sea"],
    coordinates: [35, 18],
    approximate: true,
    category: "region",
  },
  {
    id: "iran",
    label: "Iran",
    aliases: ["Iran"],
    coordinates: [32.4279, 53.688],
    approximate: true,
    category: "region",
  },
  {
    id: "papua-new-guinea",
    label: "Papua New Guinea",
    aliases: ["Papua New Guinea"],
    coordinates: [-6.315, 143.9555],
    approximate: true,
    category: "region",
  },
  {
    id: "kazakhstan",
    label: "Kazakhstan",
    aliases: ["Kazakhstan"],
    coordinates: [48.0196, 66.9237],
    approximate: true,
    category: "region",
  },
  {
    id: "western-us",
    label: "Western United States",
    aliases: ["Western United States"],
    coordinates: [39.5, -111.5],
    approximate: true,
    category: "broad-region",
  },
  {
    id: "various",
    label: "Various Regions",
    aliases: ["Various"],
    coordinates: [25, -30],
    approximate: true,
    category: "broad-region",
  },
  {
    id: "space-program",
    label: "Space Program",
    aliases: ["Space Program", "Apollo", "Skylab", "NASA"],
    approximate: true,
    category: "space",
  },
];

const normalize = (value: string) => value.toLowerCase().trim();

const unique = <T>(values: T[]) => Array.from(new Set(values.filter(Boolean)));

const caseLocations = (caseItem: Case) =>
  unique([caseItem.location, ...(caseItem.locations ?? [])].filter(Boolean) as string[]);

const episodeLocations = (caseItem: Case, episode: Episode) =>
  unique([episode.location, ...caseLocations(caseItem)].filter(Boolean) as string[]);

const entryDecades = (dates: string[]) =>
  unique(
    dates
      .map((date) => date.match(/\d{4}/)?.[0])
      .filter(Boolean)
      .map((year) => `${Math.floor(Number(year) / 10) * 10}s`),
  );

const dateValue = (caseItem: Case, episode?: Episode) =>
  unique(
    [
      episode?.date,
      episode?.dateRange,
      caseItem.date,
      caseItem.year?.toString(),
      caseItem.yearRange,
    ].filter(Boolean) as string[],
  );

const caseTypes = (caseItem: Case, episode?: Episode) =>
  unique([caseItem.type, episode?.type].filter(Boolean) as string[]);

export function buildArchiveSearchIndex(): ArchiveSearchResult[] {
  const results: ArchiveSearchResult[] = [];

  for (const caseItem of cases) {
    const locations = caseLocations(caseItem);
    const dates = dateValue(caseItem);
    const types = caseTypes(caseItem);

    results.push({
      id: caseItem.caseId,
      kind: "case",
      title: caseItem.title,
      summary: caseItem.description,
      caseId: caseItem.caseId,
      caseTitle: caseItem.title,
      agency: caseItem.agency,
      locations,
      types,
      dates,
      scoreText: {
        primary: `${caseItem.caseId} ${caseItem.title}`,
        secondary: `${locations.join(" ")} ${caseItem.agency ?? ""} ${dates.join(" ")}`,
        metadata: `${caseItem.description} ${types.join(" ")}`,
      },
    });

    for (const episode of caseItem.episodes ?? []) {
      const episodeDates = dateValue(caseItem, episode);
      const episodeTypes = caseTypes(caseItem, episode);
      const episodeLocs = episodeLocations(caseItem, episode);

      results.push({
        id: episode.episodeId,
        kind: "episode",
        title: episode.title,
        summary: episode.description ?? caseItem.description,
        caseId: caseItem.caseId,
        caseTitle: caseItem.title,
        episodeId: episode.episodeId,
        episodeTitle: episode.title,
        agency: caseItem.agency,
        locations: episodeLocs,
        types: episodeTypes,
        dates: episodeDates,
        scoreText: {
          primary: `${episode.episodeId} ${episode.title}`,
          secondary: `${caseItem.caseId} ${caseItem.title} ${episodeLocs.join(" ")} ${caseItem.agency ?? ""} ${episodeDates.join(" ")}`,
          metadata: `${episode.description ?? ""} ${episodeTypes.join(" ")} ${(episode.files ?? []).join(" ")}`,
        },
      });

      for (const path of episode.files ?? []) {
        const name = fileName(path);
        const kind = fileKind(path);
        const folder = path.split("/")[0] ?? "";

        results.push({
          id: `${episode.episodeId}:${path}`,
          kind: "file",
          title: name,
          summary: `${folder} source material for ${episode.title}`,
          caseId: caseItem.caseId,
          caseTitle: caseItem.title,
          episodeId: episode.episodeId,
          episodeTitle: episode.title,
          filePath: path,
          agency: caseItem.agency,
          locations: episodeLocs,
          types: unique([...episodeTypes, folder]),
          dates: episodeDates,
          fileType: kind,
          scoreText: {
            primary: `${name} ${path}`,
            secondary: `${episode.episodeId} ${episode.title} ${caseItem.caseId} ${caseItem.title}`,
            metadata: `${folder} ${kind} ${episodeLocs.join(" ")} ${caseItem.agency ?? ""} ${episodeDates.join(" ")}`,
          },
        });
      }
    }

    for (const path of caseItem.files ?? []) {
      const name = fileName(path);
      const kind = fileKind(path);
      const folder = path.split("/")[0] ?? "";

      results.push({
        id: `${caseItem.caseId}:${path}`,
        kind: "file",
        title: name,
        summary: `${folder} source material for ${caseItem.title}`,
        caseId: caseItem.caseId,
        caseTitle: caseItem.title,
        filePath: path,
        agency: caseItem.agency,
        locations,
        types: unique([...types, folder]),
        dates,
        fileType: kind,
        scoreText: {
          primary: `${name} ${path}`,
          secondary: `${caseItem.caseId} ${caseItem.title}`,
          metadata: `${folder} ${kind} ${locations.join(" ")} ${caseItem.agency ?? ""} ${dates.join(" ")}`,
        },
      });
    }
  }

  return results;
}

export function archiveFacets(results = buildArchiveSearchIndex()) {
  return {
    agencies: unique(results.map((r) => r.agency).filter(Boolean) as string[]).sort(),
    locations: unique(results.flatMap((r) => r.locations)).sort(),
    types: unique(results.flatMap((r) => r.types)).sort(),
    decades: unique(results.flatMap((r) => entryDecades(r.dates))).sort(),
    fileTypes: unique(results.map((r) => r.fileType).filter(Boolean) as string[]).sort(),
  };
}

const matchesFilter = (result: ArchiveSearchResult, filters: ArchiveSearchFilters) => {
  if (filters.agency !== "all" && result.agency !== filters.agency) return false;
  if (filters.location !== "all" && !result.locations.includes(filters.location)) return false;
  if (filters.type !== "all" && !result.types.includes(filters.type)) return false;
  if (filters.decade !== "all" && !entryDecades(result.dates).includes(filters.decade)) {
    return false;
  }
  if (filters.fileType !== "all" && result.fileType !== filters.fileType) return false;
  return true;
};

const rankResult = (result: ArchiveSearchResult, query: string) => {
  if (!query) return result.kind === "case" ? 30 : result.kind === "episode" ? 20 : 10;

  const q = normalize(query);
  const primary = normalize(result.scoreText.primary);
  const secondary = normalize(result.scoreText.secondary);
  const metadata = normalize(result.scoreText.metadata);

  let score = 0;
  if (primary === q) score += 300;
  if (primary.includes(q)) score += 160;
  if (secondary.includes(q)) score += 90;
  if (metadata.includes(q)) score += 35;
  for (const token of q.split(/\s+/).filter(Boolean)) {
    if (primary.includes(token)) score += 25;
    if (secondary.includes(token)) score += 14;
    if (metadata.includes(token)) score += 5;
  }

  return score;
};

export function searchArchive(
  query: string,
  filters: ArchiveSearchFilters = EMPTY_FILTERS,
  index = buildArchiveSearchIndex(),
) {
  const scored = index
    .filter((result) => matchesFilter(result, filters))
    .map((result) => ({ result, score: rankResult(result, query) }))
    .filter(({ score }) => !query.trim() || score > 0)
    .sort((a, b) => b.score - a.score || a.result.title.localeCompare(b.result.title));

  return scored.map(({ result }) => result);
}

const locationFor = (caseItem: Case, episode?: Episode) => {
  const fields = episode ? episodeLocations(caseItem, episode) : caseLocations(caseItem);
  const text = normalize(
    `${fields.join(" ")} ${caseItem.title} ${episode?.title ?? ""} ${caseItem.agency ?? ""}`,
  );

  if (caseItem.agency === "NASA" || text.includes("apollo") || text.includes("skylab")) {
    return evidenceLocations.find((l) => l.id === "space-program");
  }

  return evidenceLocations.find((location) =>
    location.aliases.some((alias) => fields.includes(alias) || text.includes(normalize(alias))),
  );
};

const sortYears = (dates: string[]) =>
  dates
    .flatMap((date) => [...date.matchAll(/\d{4}/g)].map((match) => Number(match[0])))
    .filter(Boolean)
    .sort((a, b) => a - b);

const dateSpan = (dates: string[]) => {
  const years = sortYears(dates);
  if (years.length === 0) return "Undated";
  const first = years[0];
  const last = years[years.length - 1];
  return first === last ? String(first) : `${first}-${last}`;
};

export function buildEvidenceMapPoints(): EvidenceMapPoint[] {
  const grouped = new Map<string, EvidenceMapPoint>();

  const ensure = (location: EvidenceLocation) => {
    const current = grouped.get(location.id);
    if (current) return current;
    const next: EvidenceMapPoint = {
      location,
      cases: [],
      episodes: [],
      fileCount: 0,
      dateSpan: "Undated",
      agencies: [],
      types: [],
    };
    grouped.set(location.id, next);
    return next;
  };

  for (const caseItem of cases) {
    const caseLocation = locationFor(caseItem);
    if (caseLocation && !caseItem.episodes?.length) {
      const point = ensure(caseLocation);
      point.cases = unique([...point.cases, caseItem]);
      point.fileCount += caseItem.files?.length ?? 0;
      point.agencies = unique([...point.agencies, caseItem.agency].filter(Boolean) as string[]);
      point.types = unique([...point.types, caseItem.type]);
    }

    for (const episode of caseItem.episodes ?? []) {
      const location = locationFor(caseItem, episode);
      if (!location) continue;
      const point = ensure(location);
      point.cases = unique([...point.cases, caseItem]);
      point.episodes.push({ caseItem, episode });
      point.fileCount += episode.files.length;
      point.agencies = unique([...point.agencies, caseItem.agency].filter(Boolean) as string[]);
      point.types = unique([...point.types, caseItem.type, episode.type]);
    }
  }

  for (const point of grouped.values()) {
    point.dateSpan = dateSpan(
      point.episodes.flatMap(({ caseItem, episode }) => dateValue(caseItem, episode)),
    );
    point.agencies.sort();
    point.types.sort();
  }

  return Array.from(grouped.values()).sort((a, b) =>
    a.location.label.localeCompare(b.location.label),
  );
}
