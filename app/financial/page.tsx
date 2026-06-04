"use client";

import { useCallback, useEffect, useState } from "react";
import type { BriefResponse } from "@/lib/types";

const REFRESH_MS = 300_000;

function sentimentClass(s?: string) {
  if (s === "bullish") return "text-emerald-400";
  if (s === "bearish") return "text-red-400";
  return "text-yellow-400";
}

function severityClass(s: string) {
  if (s === "critical") return "bg-red-500/20 text-red-400 border border-red-500/30";
  if (s === "high") return "bg-orange-500/20 text-orange-400 border border-orange-500/30";
  if (s === "medium") return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
  return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
}

function statusDot(s: string) {
  if (s === "ok" || s === "enabled") return "bg-emerald-500";
  if (s === "degraded") return "bg-yellow-500";
  return "bg-gray-500";
}

export default function FinancialMonitorPage() {
  const [data, setData] = useState<BriefResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(REFRESH_MS);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/financial", { cache: "no-store" });
      if (resp.ok) {
        setData((await resp.json()) as BriefResponse);
        setLastFetched(new Date());
        setCountdown(REFRESH_MS);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
    const interval = setInterval(() => void loadData(), REFRESH_MS);
    const tick = setInterval(() => setCountdown(c => Math.max(0, c - 1000)), 1000);
    return () => { clearInterval(interval); clearInterval(tick); };
  }, [loadData]);

  const min = Math.floor(countdown / 60000);
  const sec = Math.floor((countdown % 60000) / 1000);

  if (loading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 text-gray-400">
        <div className="text-center">
          <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-sm">Loading financial intelligence…</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const bullishCount = data.headlines.filter(h => {
    const BULL = ["rally", "surge", "gain", "beat", "record", "growth", "profit", "upgrade"];
    return BULL.some(w => h.title.toLowerCase().includes(w));
  }).length;

  const bearishCount = data.headlines.filter(h => {
    const BEAR = ["crash", "plunge", "drop", "miss", "loss", "recession", "downgrade", "fear"];
    return BEAR.some(w => h.title.toLowerCase().includes(w));
  }).length;

  const sentiment = bullishCount > bearishCount ? "bullish" : bearishCount > bullishCount ? "bearish" : "neutral";

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Financial Monitor</span>
          </div>
          <h1 className="text-xl font-bold">Market Sentiment Feed</h1>
          <p className="mt-1 text-sm text-gray-400">
            {data.metrics.totalItems} financial articles · avg heat {data.metrics.averageHeat}/100
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>Next refresh: {min}:{String(sec).padStart(2, "0")}</span>
          {lastFetched && <span>Updated {lastFetched.toLocaleTimeString()}</span>}
          <button onClick={() => void loadData()} className="rounded border border-gray-700 px-3 py-1.5 hover:text-gray-200">Refresh</button>
        </div>
      </div>

      {/* Sentiment Overview */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <div className="text-xs text-gray-500 mb-1">Overall Sentiment</div>
          <div className={`text-lg font-bold capitalize ${sentimentClass(sentiment)}`}>{sentiment}</div>
          <div className="text-xs text-gray-500">{bullishCount}↑ vs {bearishCount}↓</div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <div className="text-xs text-gray-500 mb-1">Critical Signals</div>
          <div className="text-lg font-bold text-red-400">{data.metrics.criticalCount}</div>
          <div className="text-xs text-gray-500">{data.metrics.highCount} high severity</div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <div className="text-xs text-gray-500 mb-1">Top Themes</div>
          <div className="text-sm font-medium text-gray-200">{data.metrics.dominantThemes.slice(0, 2).join(", ") || "Mixed"}</div>
          <div className="text-xs text-gray-500">{data.metrics.dominantThemes.length} themes</div>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <div className="text-xs text-gray-500 mb-1">Heat Score</div>
          <div className="text-lg font-bold">{data.metrics.averageHeat}<span className="text-xs text-gray-500">/100</span></div>
          <div className="text-xs text-gray-500">{data.metrics.totalItems} articles</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Executive Summary */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <h2 className="mb-2 text-sm font-semibold text-gray-300">Executive Summary</h2>
            <p className="text-sm text-gray-400 leading-relaxed">{data.executiveSummary}</p>
          </div>

          {/* News Headlines */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-gray-400">Financial Headlines ({data.headlines.length})</h2>
            <div className="space-y-2">
              {data.headlines.slice(0, 20).map(item => (
                <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 rounded-xl border border-gray-800 bg-gray-900 p-3 hover:border-gray-700 transition">
                  <span className={`mt-0.5 flex-shrink-0 rounded px-1.5 py-0.5 text-xs capitalize ${severityClass(item.severity)}`}>{item.severity}</span>
                  <div className="min-w-0">
                    <div className="text-sm leading-snug text-gray-200">{item.title}</div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                      <span>{item.source}</span>
                      {item.topicTags.slice(0, 3).map(t => <span key={t} className="rounded bg-gray-800 px-1.5 py-0.5">{t}</span>)}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* AI Insights */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-gray-400">Insights</h2>
            <div className="space-y-3">
              {data.insights.map((ins, i) => (
                <div key={i} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-200">{ins.title}</span>
                    <span className={`text-xs ${ins.confidence === "high" ? "text-emerald-400" : ins.confidence === "medium" ? "text-yellow-400" : "text-gray-500"}`}>{ins.confidence}</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{ins.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Source Status */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <h2 className="mb-3 text-xs font-semibold text-gray-400">Data Connectors</h2>
            <div className="space-y-2">
              {Object.entries(data.sourceStatus).map(([key, status]) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${statusDot(status)}`} />
                    <span className="capitalize text-gray-400">{key}</span>
                  </div>
                  <span className={`capitalize ${status === "ok" || status === "enabled" ? "text-emerald-400" : status === "disabled" ? "text-gray-500" : "text-yellow-400"}`}>{status}</span>
                </div>
              ))}
            </div>
            {lastFetched && <div className="mt-3 pt-2 border-t border-gray-800 text-xs text-gray-600">Last updated: {lastFetched.toLocaleTimeString()}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
