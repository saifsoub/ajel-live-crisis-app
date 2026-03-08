export type Severity = "critical" | "high" | "medium" | "low";
export type Confidence = "high" | "medium" | "low";

export type HeadlineItem = {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  fetchedAt: string;
  summary: string;
  countryTags: string[];
  topicTags: string[];
  severity: Severity;
  score: number;
};

export type InsightItem = {
  title: string;
  detail: string;
  confidence: Confidence;
};

export type WatchlistItem = {
  id: number;
  label: string;
  keyword: string;
  countries: string[];
  minSeverity: Severity;
  createdAt: string;
};

export type BookmarkItem = {
  id: number;
  headlineId: string;
  title: string;
  url: string;
  note: string;
  severity: Severity;
  source: string;
  createdAt: string;
};

export type SnapshotItem = {
  id: number;
  capturedAt: string;
  criticalCount: number;
  highCount: number;
  totalItems: number;
  dominantCountry: string;
  dominantTheme: string;
};

export type BriefResponse = {
  updatedAt: string;
  headlines: HeadlineItem[];
  humanitarian: HeadlineItem[];
  insights: InsightItem[];
  executiveSummary: string;
  metrics: {
    criticalCount: number;
    highCount: number;
    totalItems: number;
    countriesInMotion: string[];
    dominantThemes: string[];
    topSources: string[];
    averageHeat: number;
  };
  sourceStatus: {
    gdelt: "ok" | "degraded";
    reliefweb: "ok" | "degraded";
    newsapi: "ok" | "disabled" | "degraded";
    openai: "enabled" | "heuristic" | "degraded";
  };
};

export type DashboardBundle = {
  brief: BriefResponse;
  watchlists: WatchlistItem[];
  bookmarks: BookmarkItem[];
  snapshots: SnapshotItem[];
};
