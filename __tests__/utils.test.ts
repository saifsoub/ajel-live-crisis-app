import { describe, it, expect } from "vitest";

import { cn, confidenceBadge, rankSeverity, scoreColor, timeAgo } from "@/lib/utils";

describe("rankSeverity", () => {
  it("maps critical → 4", () => expect(rankSeverity("critical")).toBe(4));
  it("maps high → 3", () => expect(rankSeverity("high")).toBe(3));
  it("maps medium → 2", () => expect(rankSeverity("medium")).toBe(2));
  it("maps low → 1", () => expect(rankSeverity("low")).toBe(1));
});

describe("cn", () => {
  it("joins non-falsy strings", () => expect(cn("a", "b", "c")).toBe("a b c"));
  it("filters out falsy values", () => expect(cn("a", false, null, undefined, "b")).toBe("a b"));
  it("returns empty string for all falsy", () => expect(cn(false, null)).toBe(""));
});

describe("confidenceBadge", () => {
  it("prefixes with confidence-", () => {
    expect(confidenceBadge("high")).toBe("confidence-high");
    expect(confidenceBadge("medium")).toBe("confidence-medium");
    expect(confidenceBadge("low")).toBe("confidence-low");
  });
});

describe("scoreColor", () => {
  it("returns score-critical for score >= 80", () => expect(scoreColor(80)).toBe("score-critical"));
  it("returns score-high for score >= 60", () => expect(scoreColor(60)).toBe("score-high"));
  it("returns score-medium for score >= 35", () => expect(scoreColor(35)).toBe("score-medium"));
  it("returns score-low for score < 35", () => expect(scoreColor(34)).toBe("score-low"));
  it("score 79 → score-high", () => expect(scoreColor(79)).toBe("score-high"));
  it("score 59 → score-medium", () => expect(scoreColor(59)).toBe("score-medium"));
});

describe("timeAgo", () => {
  it("returns minutes for timestamps < 1 hour ago", () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    expect(timeAgo(tenMinutesAgo)).toMatch(/^\d+m ago$/);
  });

  it("returns hours for timestamps 1-23 hours ago", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(twoHoursAgo)).toMatch(/^\d+h ago$/);
  });

  it("returns days for timestamps >= 24 hours ago", () => {
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(twoDaysAgo)).toMatch(/^\d+d ago$/);
  });
});
