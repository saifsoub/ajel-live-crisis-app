import { buildAiInsights, buildExecutiveSummary, buildHeuristicInsights } from "@/lib/insights";
import { fetchGdeltHeadlines, fetchNewsApiHeadlines, fetchReliefWebReports, mergeAndDeduplicate } from "@/lib/sources";
import { saveSnapshot } from "@/lib/storage";
import { BriefResponse, HeadlineItem } from "@/lib/types";

function safeTop(values: string[], max = 5): string[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, max).map(([value]) => value);
}

function averageHeat(items: HeadlineItem[]) {
  return Math.round(items.reduce((sum, item) => sum + item.score, 0) / Math.max(items.length, 1));
}

export async function buildBrief(): Promise<BriefResponse> {
  const appName = process.env.RELIEFWEB_APPNAME || "ajel-v2.local";
  const [gdeltResult, reliefResult, newsapiResult] = await Promise.allSettled([
    fetchGdeltHeadlines(),
    fetchReliefWebReports(appName),
    fetchNewsApiHeadlines(process.env.NEWS_API_KEY),
  ]);

  const gdelt = gdeltResult.status === "fulfilled" ? gdeltResult.value : [];
  const humanitarian = reliefResult.status === "fulfilled" ? reliefResult.value : [];
  const newsapi = newsapiResult.status === "fulfilled" ? newsapiResult.value : [];

  const headlines = mergeAndDeduplicate([...gdelt, ...newsapi]).slice(0, 30);
  const humanitarianTop = mergeAndDeduplicate(humanitarian).slice(0, 10);
  const all = [...headlines, ...humanitarianTop];

  let insights = buildHeuristicInsights(all);
  let executiveSummary = buildExecutiveSummary(all);
  let openaiStatus: BriefResponse["sourceStatus"]["openai"] = process.env.OPENAI_API_KEY ? "enabled" : "heuristic";

  if (process.env.OPENAI_API_KEY) {
    try {
      const ai = await buildAiInsights(all);
      insights = ai.insights;
      executiveSummary = ai.summary;
      openaiStatus = "enabled";
    } catch {
      openaiStatus = "degraded";
    }
  }

  const metrics = {
    criticalCount: all.filter((item) => item.severity === "critical").length,
    highCount: all.filter((item) => item.severity === "high").length,
    totalItems: all.length,
    countriesInMotion: safeTop(all.flatMap((item) => item.countryTags)),
    dominantThemes: safeTop(all.flatMap((item) => item.topicTags)),
    topSources: safeTop(all.map((item) => item.source)),
    averageHeat: averageHeat(all),
  };

  saveSnapshot({
    capturedAt: new Date().toISOString(),
    criticalCount: metrics.criticalCount,
    highCount: metrics.highCount,
    totalItems: metrics.totalItems,
    dominantCountry: metrics.countriesInMotion[0] || "Mixed",
    dominantTheme: metrics.dominantThemes[0] || "Mixed",
  });

  return {
    updatedAt: new Date().toISOString(),
    headlines,
    humanitarian: humanitarianTop,
    insights,
    executiveSummary,
    metrics,
    sourceStatus: {
      gdelt: gdeltResult.status === "fulfilled" ? "ok" : "degraded",
      reliefweb: reliefResult.status === "fulfilled" ? "ok" : "degraded",
      newsapi: process.env.NEWS_API_KEY ? (newsapiResult.status === "fulfilled" ? "ok" : "degraded") : "disabled",
      openai: openaiStatus,
    },
  };
}
