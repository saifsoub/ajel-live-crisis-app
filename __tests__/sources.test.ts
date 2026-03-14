import { describe, it, expect } from "vitest";

import { mergeAndDeduplicate } from "@/lib/sources";
import { HeadlineItem } from "@/lib/types";

function makeItem(overrides: Partial<HeadlineItem> = {}): HeadlineItem {
  return {
    id: "test-1",
    title: "Test headline",
    url: "https://example.com/test-1",
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

describe("mergeAndDeduplicate", () => {
  it("returns empty array for empty input", () => {
    expect(mergeAndDeduplicate([])).toEqual([]);
  });

  it("deduplicates by URL", () => {
    const items = [
      makeItem({ id: "a", url: "https://example.com/1" }),
      makeItem({ id: "b", url: "https://example.com/1" }), // duplicate URL
      makeItem({ id: "c", url: "https://example.com/2" }),
    ];
    const result = mergeAndDeduplicate(items);
    expect(result).toHaveLength(2);
    const urls = result.map((i) => i.url);
    expect(urls).toContain("https://example.com/1");
    expect(urls).toContain("https://example.com/2");
  });

  it("keeps the first occurrence when deduplicating", () => {
    const items = [
      makeItem({ id: "first", url: "https://example.com/1", severity: "critical" }),
      makeItem({ id: "second", url: "https://example.com/1", severity: "low" }),
    ];
    const result = mergeAndDeduplicate(items);
    expect(result[0].id).toBe("first");
  });

  it("sorts by severity descending (critical before low)", () => {
    const items = [
      makeItem({ id: "low", url: "https://example.com/a", severity: "low", score: 10 }),
      makeItem({ id: "critical", url: "https://example.com/b", severity: "critical", score: 80 }),
      makeItem({ id: "medium", url: "https://example.com/c", severity: "medium", score: 40 }),
    ];
    const result = mergeAndDeduplicate(items);
    expect(result[0].severity).toBe("critical");
    expect(result[result.length - 1].severity).toBe("low");
  });

  it("sorts by score within the same severity tier", () => {
    const now = new Date().toISOString();
    const items = [
      makeItem({ id: "a", url: "https://example.com/a", severity: "high", score: 50, publishedAt: now }),
      makeItem({ id: "b", url: "https://example.com/b", severity: "high", score: 70, publishedAt: now }),
      makeItem({ id: "c", url: "https://example.com/c", severity: "high", score: 60, publishedAt: now }),
    ];
    const result = mergeAndDeduplicate(items);
    expect(result.map((i) => i.score)).toEqual([70, 60, 50]);
  });

  it("preserves items with distinct URLs", () => {
    const items = [
      makeItem({ id: "1", url: "https://a.com" }),
      makeItem({ id: "2", url: "https://b.com" }),
      makeItem({ id: "3", url: "https://c.com" }),
    ];
    expect(mergeAndDeduplicate(items)).toHaveLength(3);
  });
});
