import { fetchFinancialNewsApi, fetchGdeltFinancial, fetchYahooFinanceRSS } from "@/lib/financial-sources";
import { mergeAndDeduplicate } from "@/lib/sources";
import { buildAiInsights, buildExecutiveSummary, buildHeuristicInsights } from "@/lib/insights";
import { saveFinancialSignal } from "@/lib/storage";
import { BriefResponse, HeadlineItem } from "@/lib/types";

function countSentiment(items: HeadlineItem[]): { bullish: number; bearish: number; score: number } {
  const BULLISH = ["rally", "surge", "gain", "beat", "growth", "profit", "record", "upgrade"];
  const BEARISH = ["crash", "plunge", "drop", "miss", "loss", "recession", "downgrade", "fear"];
  let b = 0, br = 0;
  for (const item of items) {
    const text = `${item.title} ${item.summary}`.toLowerCase();
    b += BULLISH.filter(w => text.includes(w)).length;
    br += BEARISH.filter(w => text.includes(w)).length;
  }
  const total = b + br || 1;
  return { bullish: b, bearish: br, score: (b - br) / total };
}

function dominantTicker(items: HeadlineItem[]): string {
  const counts = new Map<string, number>();
  const TICKER_RE = /\$([A-Z]{1,5})\b/g;
  for (const item of items) {
    let m: RegExpExecArray | null;
    while ((m = TICKER_RE.exec(`${item.title} ${item.summary}`)) !== null) {
      counts.set(m[1], (counts.get(m[1]) ?? 0) + 1);
    }
    TICKER_RE.lastIndex = 0;
  }
  if (counts.size === 0) return "SPY";
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

export async function buildFinancialBrief(): Promise<BriefResponse> {
  const newsApiKey = process.env.NEWS_API_KEY;

  const [newsApiResult, gdeltResult, yahooResult] = await Promise.allSettled([
    fetchFinancialNewsApi(newsApiKey),
    fetchGdeltFinancial(),
    fetchYahooFinanceRSS(),
  ]);

  const newsApiItems = newsApiResult.status === "fulfilled" ? newsApiResult.value : [];
  const gdeltItems = gdeltResult.status === "fulfilled" ? gdeltResult.value : [];
  const yahooItems = yahooResult.status === "fulfilled" ? yahooResult.value : [];

  const all = mergeAndDeduplicate([...newsApiItems, ...gdeltItems, ...yahooItems]).slice(0, 30);

  let insights = buildHeuristicInsights(all);
  let executiveSummary = buildExecutiveSummary(all);
  let openaiStatus: BriefResponse["sourceStatus"]["openai"] = process.env.OPENAI_API_KEY ? "enabled" : "heuristic";

  if (process.env.OPENAI_API_KEY) {
    try {
      const ai = await buildAiInsights(all);
      insights = ai.insights;
      executiveSummary = ai.summary;
    } catch {
      openaiStatus = "degraded";
    }
  }

  const { score } = countSentiment(all);
  const overallSentiment = score > 0.15 ? "bullish" : score < -0.15 ? "bearish" : "neutral";

  const metrics = {
    criticalCount: all.filter(i => i.severity === "critical").length,
    highCount: all.filter(i => i.severity === "high").length,
    totalItems: all.length,
    countriesInMotion: ["US", "Global"],
    dominantThemes: [...new Set(all.flatMap(i => i.topicTags))].slice(0, 5),
    topSources: [...new Map(all.map(i => [i.source, i.source])).values()].slice(0, 5),
    averageHeat: Math.round(all.reduce((s, i) => s + i.score, 0) / Math.max(all.length, 1)),
  };

  saveFinancialSignal({
    capturedAt: new Date().toISOString(),
    overallSentiment,
    sentimentScore: Math.round(score * 100) / 100,
    dominantTicker: dominantTicker(all),
    marketCondition: metrics.criticalCount > 3 ? "crisis" : metrics.highCount > 5 ? "volatile" : "normal",
    newsCount: all.length,
  });

  return {
    updatedAt: new Date().toISOString(),
    headlines: all,
    humanitarian: [],
    insights,
    executiveSummary,
    metrics,
    sourceStatus: {
      gdelt: gdeltResult.status === "fulfilled" ? "ok" : "degraded",
      reliefweb: "disabled",
      newsapi: newsApiKey ? (newsApiResult.status === "fulfilled" ? "ok" : "degraded") : "disabled",
      openai: openaiStatus,
    },
  };
}
