import data from "@/data/cases.json";

export type Episode = {
  episodeId: string;
  title: string;
  type: string;
  description?: string;
  location?: string;
  date?: string;
  dateRange?: string;
  status?: string;
  files: string[];
  mission?: string;
  missions?: string[];
  relatedIncidents?: string[];
};

export type Case = {
  caseId: string;
  title: string;
  type: string;
  description: string;
  year?: number;
  yearRange?: string;
  date?: string;
  location?: string;
  locations?: string[];
  agency?: string;
  episodes?: Episode[];
  files?: string[];
  totalVideos?: number;
  subIncidents?: number;
  missionTypes?: string[];
};

export const metadata = (data as any).metadata as {
  title: string;
  created: string;
  source: string;
  totalCases: number;
  totalIncidents: number;
};

export const cases: Case[] = (data as any).cases;

export const getCase = (id: string) => cases.find((c) => c.caseId === id);

export const getEpisode = (caseId: string, epId: string) => {
  const c = getCase(caseId);
  return c?.episodes?.find((e) => e.episodeId === epId);
};

export const fileKind = (path: string): "pdf" | "video" | "image" | "data" => {
  const p = path.toLowerCase();
  if (p.endsWith(".mp4") || p.endsWith(".mov")) return "video";
  if (p.endsWith(".png") || p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image";
  if (p.endsWith(".json") || p.endsWith(".md")) return "data";
  return "pdf";
};

export const fileName = (path: string) => path.split("/").pop() ?? path;

export const totalEpisodes = cases.reduce((n, c) => n + (c.episodes?.length ?? 0), 0);
export const totalFiles = cases.reduce(
  (n, c) =>
    n +
    (c.files?.length ?? 0) +
    (c.episodes?.reduce((m, e) => m + e.files.length, 0) ?? 0),
  0,
);
