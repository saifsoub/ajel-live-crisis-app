import { Confidence, Severity } from "@/lib/types";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.max(1, Math.round(diffMs / 60000));
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay}d ago`;
}

export function rankSeverity(value: Severity) {
  return { critical: 4, high: 3, medium: 2, low: 1 }[value];
}

export function confidenceBadge(value: Confidence) {
  return `confidence-${value}`;
}

export function scoreColor(score: number) {
  if (score >= 80) return "score-critical";
  if (score >= 60) return "score-high";
  if (score >= 35) return "score-medium";
  return "score-low";
}
