import { HeadlineItem, Severity } from "@/lib/types";
import { rankSeverity } from "@/lib/utils";

const FINANCIAL_TOPICS = ["earnings", "Fed", "inflation", "recession", "rally", "crash", "IPO", "dividend", "buyback", "merger", "acquisition", "default", "yield", "rate", "volatility"];
const CRITICAL_WORDS = ["crash", "collapse", "default", "emergency", "circuit breaker", "halt", "crisis"];
const HIGH_WORDS = ["plunge", "surge", "recession", "rate hike", "rate cut", "earnings miss", "earnings beat", "record high", "record low"];
const MEDIUM_WORDS = ["rally", "decline", "correction", "upgrade", "downgrade", "inflation", "earnings", "guidance"];
const TICKER_RE = /\$([A-Z]{1,5})\b/g;

function detectFinancialSeverity(text: string): Severity {
  const lower = text.toLowerCase();
  if (CRITICAL_WORDS.some(w => lower.includes(w))) return "critical";
  if (HIGH_WORDS.some(w => lower.includes(w))) return "high";
  if (MEDIUM_WORDS.some(w => lower.includes(w))) return "medium";
  return "low";
}

function extractTopicTags(text: string): string[] {
  const lower = text.toLowerCase();
  return FINANCIAL_TOPICS.filter(t => lower.includes(t.toLowerCase())).slice(0, 4);
}

function extractCountryTags(text: string): string[] {
  const countries = ["US", "China", "EU", "Europe", "Japan", "UK", "Germany", "India", "Brazil"];
  const lower = text.toLowerCase();
  return countries.filter(c => lower.includes(c.toLowerCase()));
}

function extractTickers(text: string): string[] {
  const matches: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = TICKER_RE.exec(text)) !== null) matches.push(m[1]);
  TICKER_RE.lastIndex = 0;
  return [...new Set(matches)].slice(0, 5);
}

function computeScore(severity: Severity, topicTags: string[], publishedAt?: string): number {
  const ageHours = publishedAt ? Math.max(0, (Date.now() - new Date(publishedAt).getTime()) / 36e5) : 8;
  const freshness = Math.max(8, 35 - ageHours * 1.7);
  const density = topicTags.length * 6;
  return Math.min(100, Math.round(rankSeverity(severity) * 12 + freshness + density));
}

function truncate(text: string, max = 280): string {
  const clean = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
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
  const topicTags = extractTopicTags(combined);
  const countryTags = extractCountryTags(combined);
  const tickers = extractTickers(combined);
  const severity = detectFinancialSeverity(combined);
  const publishedAt = input.publishedAt || new Date().toISOString();
  return {
    id: String(input.id ?? `${input.title}-${publishedAt}`),
    title: input.title,
    url: input.url,
    source: input.source ?? "Unknown",
    publishedAt,
    fetchedAt: new Date().toISOString(),
    summary: truncate(`${tickers.length > 0 ? `Tickers: ${tickers.join(", ")}. ` : ""}${input.summary ?? ""}`),
    countryTags,
    topicTags,
    severity,
    score: computeScore(severity, topicTags, publishedAt),
  };
}

export async function fetchFinancialNewsApi(apiKey?: string): Promise<HeadlineItem[]> {
  if (!apiKey) return [];
  const query = encodeURIComponent("(stock market OR earnings OR Federal Reserve OR inflation OR S&P 500 OR interest rate OR recession) lang:en");
  const url = `https://newsapi.org/v2/everything?q=${query}&language=en&pageSize=20&sortBy=publishedAt`;
  const resp = await fetch(url, {
    headers: { "X-Api-Key": apiKey, "User-Agent": "AjelV2/financial" },
    next: { revalidate: 300 },
  } as RequestInit & { next: { revalidate: number } });
  if (!resp.ok) throw new Error(`NewsAPI financial failed: ${resp.status}`);
  const data = (await resp.json()) as {
    articles?: Array<{ url?: string; title?: string; publishedAt?: string; description?: string; source?: { name?: string } }>;
  };
  return (data.articles ?? [])
    .map((a, i) => normalizeItem({ id: `newsapi-fin-${i}`, title: a.title, url: a.url, source: a.source?.name, publishedAt: a.publishedAt, summary: a.description }))
    .filter((x): x is HeadlineItem => Boolean(x));
}

export async function fetchGdeltFinancial(): Promise<HeadlineItem[]> {
  const query = encodeURIComponent('(earnings OR "Federal Reserve" OR inflation OR "stock market" OR "interest rate" OR recession OR trading) AND (stocks OR equities OR bonds OR markets OR USD)');
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=artlist&maxrecords=20&format=json&sort=datedesc`;
  const resp = await fetch(url, {
    headers: { "User-Agent": "AjelV2/financial" },
    next: { revalidate: 300 },
  } as RequestInit & { next: { revalidate: number } });
  if (!resp.ok) throw new Error(`GDELT financial failed: ${resp.status}`);
  const data = (await resp.json()) as {
    articles?: Array<{ url?: string; url_mobile?: string; title?: string; seendate?: string; domain?: string; language?: string }>;
  };
  return (data.articles ?? [])
    .filter(a => a.language === "English" || !a.language)
    .map((a, i) => normalizeItem({ id: `gdelt-fin-${i}`, title: a.title, url: a.url_mobile || a.url, source: a.domain || "GDELT", publishedAt: a.seendate }))
    .filter((x): x is HeadlineItem => Boolean(x));
}

export async function fetchYahooFinanceRSS(): Promise<HeadlineItem[]> {
  const resp = await fetch("https://finance.yahoo.com/news/rssindex", {
    headers: { "User-Agent": "AjelV2/financial", "Accept": "application/rss+xml,application/xml,text/xml" },
    next: { revalidate: 300 },
  } as RequestInit & { next: { revalidate: number } });
  if (!resp.ok) throw new Error(`Yahoo Finance RSS failed: ${resp.status}`);
  const xml = await resp.text();

  const items: HeadlineItem[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  const titleRe = /<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/;
  const linkRe = /<link>(.*?)<\/link>/;
  const descRe = /<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/;
  const pubDateRe = /<pubDate>(.*?)<\/pubDate>/;
  const guidRe = /<guid[^>]*>(.*?)<\/guid>/;

  let match: RegExpExecArray | null;
  let idx = 0;
  while ((match = itemRe.exec(xml)) !== null) {
    const chunk = match[1];
    const title = titleRe.exec(chunk)?.[1]?.trim();
    const link = linkRe.exec(chunk)?.[1]?.trim() || guidRe.exec(chunk)?.[1]?.trim();
    const desc = descRe.exec(chunk)?.[1]?.trim();
    const pubDate = pubDateRe.exec(chunk)?.[1]?.trim();
    const item = normalizeItem({ id: `yahoo-fin-${idx++}`, title, url: link, source: "Yahoo Finance", publishedAt: pubDate ? new Date(pubDate).toISOString() : undefined, summary: desc });
    if (item) items.push(item);
  }
  return items;
}
