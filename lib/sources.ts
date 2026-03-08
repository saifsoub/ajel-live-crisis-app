import { HeadlineItem, Severity } from "@/lib/types";
import { rankSeverity } from "@/lib/utils";

const MIDDLE_EAST_COUNTRIES = [
  "Iran", "Iraq", "Israel", "Palestine", "Gaza", "Lebanon", "Syria", "Jordan", "Yemen", "Egypt",
  "Saudi Arabia", "United Arab Emirates", "UAE", "Qatar", "Bahrain", "Kuwait", "Oman", "Turkey", "Red Sea"
];

const TOPIC_KEYWORDS = [
  "strike", "missile", "attack", "ceasefire", "border", "aid", "evacuation", "sanctions", "protest", "hostage",
  "truce", "airstrike", "incursion", "naval", "militia", "talks", "humanitarian", "oil", "gas", "shipping", "drone", "nuclear"
];

const CRITICAL_WORDS = ["airstrike", "missile", "attack", "killed", "explosion", "assault", "incursion", "drone", "rocket"];
const HIGH_WORDS = ["ceasefire", "sanctions", "protest", "hostage", "militia", "troops", "raid", "warning", "intercept"];
const MEDIUM_WORDS = ["aid", "talks", "shipping", "oil", "gas", "evacuation", "statement", "disruption"];

function detectSeverity(text: string): Severity {
  const normalized = text.toLowerCase();
  if (CRITICAL_WORDS.some((word) => normalized.includes(word))) return "critical";
  if (HIGH_WORDS.some((word) => normalized.includes(word))) return "high";
  if (MEDIUM_WORDS.some((word) => normalized.includes(word))) return "medium";
  return "low";
}

function detectCountryTags(text: string): string[] {
  const normalized = text.toLowerCase();
  return [...new Set(MIDDLE_EAST_COUNTRIES.filter((country) => normalized.includes(country.toLowerCase())))];
}

function detectTopicTags(text: string): string[] {
  const normalized = text.toLowerCase();
  return [...new Set(TOPIC_KEYWORDS.filter((topic) => normalized.includes(topic.toLowerCase())))].slice(0, 4);
}

function truncate(text: string, max = 240): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

function computeScore(severity: Severity, countryTags: string[], topicTags: string[], publishedAt?: string) {
  const ageHours = publishedAt ? Math.max(0, (Date.now() - new Date(publishedAt).getTime()) / 36e5) : 8;
  const freshness = Math.max(8, 35 - ageHours * 1.7);
  const density = countryTags.length * 5 + topicTags.length * 4;
  return Math.min(100, Math.round(rankSeverity(severity) * 12 + freshness + density));
}

function normalizeItem(input: {
  id?: string | number;
  title?: string;
  url?: string;
  source?: string;
  publishedAt?: string;
  summary?: string;
}): HeadlineItem | null {
  if (!input.title || !input.url) return null;
  const combined = `${input.title} ${input.summary ?? ""}`;
  const countryTags = detectCountryTags(combined);
  const topicTags = detectTopicTags(combined);
  const severity = detectSeverity(combined);
  const publishedAt = input.publishedAt || new Date().toISOString();
  return {
    id: String(input.id ?? `${input.title}-${publishedAt}`),
    title: input.title,
    url: input.url,
    source: input.source ?? "Unknown",
    publishedAt,
    fetchedAt: new Date().toISOString(),
    summary: truncate(input.summary ?? ""),
    countryTags,
    topicTags,
    severity,
    score: computeScore(severity, countryTags, topicTags, publishedAt),
  };
}

export async function fetchGdeltHeadlines(): Promise<HeadlineItem[]> {
  const query = encodeURIComponent('(Israel OR Gaza OR Palestine OR Iran OR Lebanon OR Syria OR Yemen OR Iraq OR Jordan OR "Red Sea") AND (attack OR ceasefire OR strike OR protest OR border OR sanctions OR aid OR hostage OR shipping OR missile OR drone)');
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=artlist&maxrecords=30&format=json&sort=datedesc`;

  const gdeltOptions = { next: { revalidate: 180 }, headers: { "User-Agent": "AjelV2/1.0" } } as RequestInit & { next: { revalidate: number } };
  const response = await fetch(url, gdeltOptions);

  if (!response.ok) throw new Error(`GDELT request failed: ${response.status}`);

  const data = (await response.json()) as {
    articles?: Array<{
      url?: string;
      url_mobile?: string;
      title?: string;
      seendate?: string;
      domain?: string;
      sourcecountry?: string;
      language?: string;
    }>;
  };

  return (data.articles ?? [])
    .map((article, index) =>
      normalizeItem({
        id: `gdelt-${index}-${article.url}`,
        title: article.title,
        url: article.url_mobile || article.url,
        source: article.domain || article.sourcecountry || "GDELT",
        publishedAt: article.seendate,
        summary: `${article.language ? `Language: ${article.language}. ` : ""}${article.sourcecountry ? `Source country: ${article.sourcecountry}.` : ""}`,
      }),
    )
    .filter((item): item is HeadlineItem => Boolean(item));
}

export async function fetchReliefWebReports(appName: string): Promise<HeadlineItem[]> {
  const url = `https://api.reliefweb.int/v2/reports?appname=${encodeURIComponent(appName)}&limit=12&profile=full&sort[]=date:desc`;
  const body = {
    filter: {
      operator: "OR",
      conditions: [
        { field: "country.name", value: ["Occupied Palestinian Territory"] },
        { field: "country.name", value: ["Israel"] },
        { field: "country.name", value: ["Lebanon"] },
        { field: "country.name", value: ["Syria"] },
        { field: "country.name", value: ["Yemen"] },
        { field: "country.name", value: ["Iran"] },
        { field: "country.name", value: ["Iraq"] }
      ]
    },
    fields: {
      include: ["title", "body-html", "source", "date", "file", "country"]
    }
  };

  const reliefOptions = {
    method: "POST",
    next: { revalidate: 300 },
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "AjelV2/1.0",
    },
    body: JSON.stringify(body),
  } as RequestInit & { next: { revalidate: number } };
  const response = await fetch(url, reliefOptions);

  if (!response.ok) throw new Error(`ReliefWeb request failed: ${response.status}`);

  const data = (await response.json()) as {
    data?: Array<{
      id: string | number;
      fields?: {
        title?: string;
        date?: { created?: string; original?: string };
        source?: Array<{ shortname?: string; name?: string }>;
        "body-html"?: string;
        file?: Array<{ url?: string }>;
        country?: Array<{ name?: string }>;
      };
      href?: string;
    }>;
  };

  return (data.data ?? [])
    .map((entry) => {
      const fields = entry.fields;
      return normalizeItem({
        id: `relief-${entry.id}`,
        title: fields?.title,
        url: entry.href || fields?.file?.[0]?.url,
        source: fields?.source?.[0]?.shortname || fields?.source?.[0]?.name || "ReliefWeb",
        publishedAt: fields?.date?.created || fields?.date?.original,
        summary: `${(fields?.country ?? []).map((c) => c.name).filter(Boolean).join(", ")} ${(fields?.["body-html"] ?? "").replace(/<[^>]+>/g, " ")}`,
      });
    })
    .filter((item): item is HeadlineItem => Boolean(item));
}

export async function fetchNewsApiHeadlines(apiKey?: string): Promise<HeadlineItem[]> {
  if (!apiKey) return [];
  const query = encodeURIComponent('(Israel OR Gaza OR Palestine OR Iran OR Lebanon OR Syria OR Yemen OR Iraq OR Jordan OR "Red Sea")');
  const url = `https://newsapi.org/v2/everything?q=${query}&language=en&pageSize=20&sortBy=publishedAt`;
  const newsApiOptions = { next: { revalidate: 300 }, headers: { "X-Api-Key": apiKey, "User-Agent": "AjelV2/1.0" } } as RequestInit & { next: { revalidate: number } };
  const response = await fetch(url, newsApiOptions);
  if (!response.ok) throw new Error(`NewsAPI request failed: ${response.status}`);
  const data = (await response.json()) as {
    articles?: Array<{
      url?: string;
      title?: string;
      publishedAt?: string;
      description?: string;
      source?: { name?: string };
    }>;
  };
  return (data.articles ?? [])
    .map((article, index) => normalizeItem({
      id: `newsapi-${index}-${article.url}`,
      title: article.title,
      url: article.url,
      source: article.source?.name || "NewsAPI",
      publishedAt: article.publishedAt,
      summary: article.description,
    }))
    .filter((item): item is HeadlineItem => Boolean(item));
}

export function mergeAndDeduplicate(items: HeadlineItem[]): HeadlineItem[] {
  const map = new Map<string, HeadlineItem>();
  for (const item of items) {
    if (!map.has(item.url)) map.set(item.url, item);
  }
  return [...map.values()].sort((a, b) => {
    const bySeverity = rankSeverity(b.severity) - rankSeverity(a.severity);
    if (bySeverity !== 0) return bySeverity;
    const byScore = b.score - a.score;
    if (byScore !== 0) return byScore;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}
