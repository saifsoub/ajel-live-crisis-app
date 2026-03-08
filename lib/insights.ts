import OpenAI from "openai";

import { HeadlineItem, InsightItem } from "@/lib/types";

function countBy(values: string[]) {
  const map = new Map<string, number>();
  values.forEach((value) => map.set(value, (map.get(value) ?? 0) + 1));
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

export function buildHeuristicInsights(items: HeadlineItem[]): InsightItem[] {
  const countryMentions = countBy(items.flatMap((item) => item.countryTags));
  const themeMentions = countBy(items.flatMap((item) => item.topicTags));
  const criticalItems = items.filter((item) => item.severity === "critical");
  const avgScore = Math.round(items.reduce((sum, item) => sum + item.score, 0) / Math.max(items.length, 1));

  const insights: InsightItem[] = [];

  insights.push({
    title: "Live heat level",
    detail: `Average incident heat is ${avgScore}/100, indicating a ${avgScore >= 65 ? "high-volatility" : avgScore >= 40 ? "tense" : "watchful"} cycle across the monitored feed.`,
    confidence: avgScore >= 65 ? "high" : "medium",
  });

  if (criticalItems.length > 0) {
    insights.push({
      title: "Immediate escalation signal",
      detail: `${criticalItems.length} critical items are currently leading the stream, with the strongest concentration around ${countryMentions[0]?.[0] ?? "multiple theatres"}.`,
      confidence: "high",
    });
  }

  if (themeMentions.length > 0) {
    insights.push({
      title: "Dominant narrative",
      detail: `The feed is clustering around ${themeMentions.slice(0, 3).map(([theme]) => theme).join(", ")}.`,
      confidence: "medium",
    });
  }

  if (countryMentions.length > 1) {
    insights.push({
      title: "Regional spillover watch",
      detail: `Coverage is distributed across ${countryMentions.slice(0, 4).map(([country]) => country).join(", ")}, suggesting cross-border sensitivity rather than a single isolated hotspot.`,
      confidence: "medium",
    });
  }

  return insights.slice(0, 4);
}

export function buildExecutiveSummary(items: HeadlineItem[]) {
  const topCountries = countBy(items.flatMap((item) => item.countryTags)).slice(0, 3).map(([value]) => value);
  const topThemes = countBy(items.flatMap((item) => item.topicTags)).slice(0, 3).map(([value]) => value);
  const critical = items.filter((item) => item.severity === "critical").length;
  return `The monitored Middle East feed is showing ${critical} critical items right now, with the strongest signal around ${topCountries.join(", ") || "multiple areas"}. The dominant narrative is shifting around ${topThemes.join(", ") || "mixed security and humanitarian themes"}. Leadership attention should focus on fast-moving security indicators while tracking relief and spillover signals in parallel.`;
}

export async function buildAiInsights(items: HeadlineItem[]): Promise<{ insights: InsightItem[]; summary: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { insights: buildHeuristicInsights(items), summary: buildExecutiveSummary(items) };
  }

  const client = new OpenAI({ apiKey });
  const compactItems = items.slice(0, 20).map((item) => ({
    title: item.title,
    source: item.source,
    publishedAt: item.publishedAt,
    countries: item.countryTags,
    topics: item.topicTags,
    severity: item.severity,
    score: item.score,
    summary: item.summary,
  }));

  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5-mini",
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: "You are a geopolitical intelligence analyst. Produce concise, non-speculative, dashboard-grade insights based only on the supplied feed records." }],
      },
      {
        role: "user",
        content: [{ type: "input_text", text: JSON.stringify(compactItems) }],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "ajel_v2_payload",
        strict: true,
        schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            insights: {
              type: "array",
              maxItems: 4,
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  detail: { type: "string" },
                  confidence: { type: "string", enum: ["high", "medium", "low"] }
                },
                required: ["title", "detail", "confidence"],
                additionalProperties: false
              }
            }
          },
          required: ["summary", "insights"],
          additionalProperties: false
        }
      }
    }
  });

  const payload = JSON.parse(response.output_text) as { insights: InsightItem[]; summary: string };
  return payload;
}
