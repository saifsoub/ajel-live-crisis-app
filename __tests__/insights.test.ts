import { describe, it, expect } from "vitest";

import { buildExecutiveSummary, buildHeuristicInsights } from "@/lib/insights";
import { HeadlineItem } from "@/lib/types";

function makeItem(overrides: Partial<HeadlineItem> = {}): HeadlineItem {
  return {
    id: "test",
    title: "Test",
    url: "https://example.com",
    source: "TestSource",
    publishedAt: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    summary: "",
    countryTags: [],
    topicTags: [],
    severity: "low",
    score: 20,
    ...overrides,
  };
}

describe("buildHeuristicInsights", () => {
  it("returns at most 4 insights", () => {
    const items = [
      makeItem({ severity: "critical", countryTags: ["Israel"], topicTags: ["airstrike"], score: 90 }),
      makeItem({ severity: "high", countryTags: ["Iran"], topicTags: ["sanctions"], score: 70 }),
      makeItem({ severity: "medium", countryTags: ["Lebanon"], topicTags: ["aid"], score: 40 }),
    ];
    const insights = buildHeuristicInsights(items);
    expect(insights.length).toBeLessThanOrEqual(4);
  });

  it("always returns a 'Live heat level' insight", () => {
    const insights = buildHeuristicInsights([makeItem({ score: 50 })]);
    expect(insights.some((i) => i.title === "Live heat level")).toBe(true);
  });

  it("includes escalation insight when critical items are present", () => {
    const items = [makeItem({ severity: "critical", countryTags: ["Gaza"], topicTags: ["attack"], score: 90 })];
    const insights = buildHeuristicInsights(items);
    expect(insights.some((i) => i.title === "Immediate escalation signal")).toBe(true);
  });

  it("does not include escalation insight when no critical items", () => {
    const items = [makeItem({ severity: "low", score: 10 })];
    const insights = buildHeuristicInsights(items);
    expect(insights.some((i) => i.title === "Immediate escalation signal")).toBe(false);
  });

  it("returns valid confidence values", () => {
    const items = [makeItem({ score: 70, countryTags: ["Israel", "Iran"], topicTags: ["missile", "sanctions"] })];
    const insights = buildHeuristicInsights(items);
    for (const insight of insights) {
      expect(["high", "medium", "low"]).toContain(insight.confidence);
    }
  });

  it("returns empty array for empty input", () => {
    const insights = buildHeuristicInsights([]);
    // should still produce the live heat level insight
    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0].title).toBe("Live heat level");
  });

  it("heat level insight reflects high-volatility at score >= 65", () => {
    const items = Array.from({ length: 5 }, () => makeItem({ score: 80 }));
    const insights = buildHeuristicInsights(items);
    const heatInsight = insights.find((i) => i.title === "Live heat level");
    expect(heatInsight?.detail).toContain("high-volatility");
  });
});

describe("buildExecutiveSummary", () => {
  it("returns a non-empty string", () => {
    const summary = buildExecutiveSummary([makeItem({ severity: "critical", countryTags: ["Israel"], topicTags: ["missile"] })]);
    expect(typeof summary).toBe("string");
    expect(summary.length).toBeGreaterThan(0);
  });

  it("mentions critical item count", () => {
    const items = [
      makeItem({ severity: "critical" }),
      makeItem({ severity: "critical", url: "https://example.com/2" }),
      makeItem({ severity: "high", url: "https://example.com/3" }),
    ];
    const summary = buildExecutiveSummary(items);
    expect(summary).toContain("2 critical");
  });

  it("mentions top countries when present", () => {
    const items = [
      makeItem({ countryTags: ["Israel"], url: "https://example.com/1" }),
      makeItem({ countryTags: ["Israel"], url: "https://example.com/2" }),
      makeItem({ countryTags: ["Iran"], url: "https://example.com/3" }),
    ];
    const summary = buildExecutiveSummary(items);
    expect(summary).toContain("Israel");
  });

  it("falls back gracefully with empty items", () => {
    const summary = buildExecutiveSummary([]);
    expect(typeof summary).toBe("string");
    expect(summary.length).toBeGreaterThan(0);
  });
});
