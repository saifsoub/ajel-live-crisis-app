"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";

import { BookmarkItem, DashboardBundle, HeadlineItem, Severity, SnapshotItem, WatchlistItem } from "@/lib/types";
import { cn, confidenceBadge, scoreColor, timeAgo } from "@/lib/utils";

const severityOptions: Array<{ value: "all" | Severity; label: string }> = [
  { value: "all", label: "All severities" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function DashboardClient({ initialData }: { initialData: DashboardBundle }) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<"all" | Severity>("all");
  const [countryFilter, setCountryFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [bookmarkNote, setBookmarkNote] = useState<Record<string, string>>({});
  const [watchForm, setWatchForm] = useState({ label: "", keyword: "", countries: "", minSeverity: "medium" as Severity });

  async function refresh() {
    setLoading(true);
    try {
      const [liveRes, watchRes, bookmarksRes, snapshotsRes] = await Promise.all([
        fetch("/api/live", { cache: "no-store" }),
        fetch("/api/watchlists", { cache: "no-store" }),
        fetch("/api/bookmarks", { cache: "no-store" }),
        fetch("/api/snapshots", { cache: "no-store" }),
      ]);
      const [brief, watchlists, bookmarks, snapshots] = await Promise.all([liveRes.json(), watchRes.json(), bookmarksRes.json(), snapshotsRes.json()]);
      setData({ brief, watchlists, bookmarks, snapshots });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setInterval(refresh, 60000);
    return () => clearInterval(timer);
  }, []);

  const countries = useMemo(
    () => ["All", ...new Set(data.brief.headlines.flatMap((item: HeadlineItem) => item.countryTags).filter(Boolean))],
    [data.brief.headlines],
  );

  const filteredHeadlines = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.brief.headlines.filter((item: HeadlineItem) => {
      const matchesSeverity = severityFilter === "all" || item.severity === severityFilter;
      const matchesCountry = countryFilter === "All" || item.countryTags.includes(countryFilter);
      const haystack = `${item.title} ${item.summary} ${item.countryTags.join(" ")} ${item.topicTags.join(" ")}`.toLowerCase();
      const matchesSearch = !q || haystack.includes(q);
      return matchesSeverity && matchesCountry && matchesSearch;
    });
  }, [data.brief.headlines, severityFilter, countryFilter, search]);

  const watchMatches = useMemo(() => {
    return data.watchlists.map((watch: WatchlistItem) => {
      const items = filteredHeadlines.filter((item: HeadlineItem) => {
        const keywordOk = `${item.title} ${item.summary}`.toLowerCase().includes(watch.keyword.toLowerCase());
        const countryOk = watch.countries.length === 0 || watch.countries.some((country: string) => item.countryTags.includes(country));
        const severityOk = severityRank(item.severity) >= severityRank(watch.minSeverity);
        return keywordOk && countryOk && severityOk;
      });
      return { watch, items };
    });
  }, [data.watchlists, filteredHeadlines]);

  const spotlight = filteredHeadlines[0];

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  async function addWatchlist() {
    await fetch("/api/watchlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: watchForm.label,
        keyword: watchForm.keyword,
        countries: watchForm.countries.split(",").map((item) => item.trim()).filter(Boolean),
        minSeverity: watchForm.minSeverity,
      }),
    });
    setWatchForm({ label: "", keyword: "", countries: "", minSeverity: "medium" });
    await refresh();
  }

  async function removeWatchlist(id: number) {
    await fetch(`/api/watchlists?id=${id}`, { method: "DELETE" });
    await refresh();
  }

  async function addBookmark(item: HeadlineItem) {
    await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        headlineId: item.id,
        title: item.title,
        url: item.url,
        note: bookmarkNote[item.id] || "",
        severity: item.severity,
        source: item.source,
      }),
    });
    setBookmarkNote((current: Record<string, string>) => ({ ...current, [item.id]: "" }));
    await refresh();
  }

  async function removeBookmark(id: number) {
    await fetch(`/api/bookmarks?id=${id}`, { method: "DELETE" });
    await refresh();
  }

  return (
    <main className="app-shell">
      <aside className="sidebar panel">
        <div>
          <div className="brand-mark sm">عاجل</div>
          <p className="eyebrow">AJEL V2</p>
          <h2 className="sidebar-title">Executive situation room</h2>
          <p className="subtle">Live data, AI synthesis, saved watchlists, historical snapshots, and analyst bookmarking.</p>
        </div>

        <div className="sidebar-block">
          <div className="panel-topline">System status</div>
          <ul className="source-list">
            <li><span>Updated</span><strong>{timeAgo(data.brief.updatedAt)}</strong></li>
            <li><span>GDELT</span><strong>{data.brief.sourceStatus.gdelt}</strong></li>
            <li><span>ReliefWeb</span><strong>{data.brief.sourceStatus.reliefweb}</strong></li>
            <li><span>NewsAPI</span><strong>{data.brief.sourceStatus.newsapi}</strong></li>
            <li><span>OpenAI</span><strong>{data.brief.sourceStatus.openai}</strong></li>
          </ul>
        </div>

        <div className="sidebar-block">
          <div className="panel-topline">Analyst actions</div>
          <button className="secondary-btn" onClick={refresh} disabled={loading}>{loading ? "Refreshing…" : "Refresh now"}</button>
          <button className="secondary-btn ghost" onClick={logout}>Sign out</button>
        </div>
      </aside>

      <section className="main-area">
        <section className="hero panel">
          <div>
            <p className="eyebrow">LIVE REGION MONITOR</p>
            <h1>What is happening right now in the Middle East</h1>
            <p className="subtle">Ajel V2 adds login, SQLite persistence, saved watchlists, bookmarks, and incident snapshots on top of the live feed and AI insights.</p>
          </div>
          <div className="hero-side">
            <div className="status-pill live">● LIVE</div>
            <div className="status-stack">
              <span>{data.brief.metrics.totalItems} monitored items</span>
              <span>{data.brief.metrics.averageHeat}/100 average heat</span>
            </div>
          </div>
        </section>

        <section className="grid metrics-grid">
          <MetricCard label="Critical alerts" value={String(data.brief.metrics.criticalCount)} helper="Highest urgency items in the live cycle" />
          <MetricCard label="High alerts" value={String(data.brief.metrics.highCount)} helper="Fast-moving items with likely policy relevance" />
          <MetricCard label="Countries in motion" value={String(data.brief.metrics.countriesInMotion.length)} helper={data.brief.metrics.countriesInMotion.join(" • ") || "Mixed"} />
          <MetricCard label="Top sources" value={String(data.brief.metrics.topSources.length)} helper={data.brief.metrics.topSources.join(" • ") || "Mixed"} />
        </section>

        <section className="grid two-col">
          <div className="panel spotlight">
            <div className="panel-topline">Executive summary</div>
            <p className="summary-big">{data.brief.executiveSummary}</p>
            {spotlight ? (
              <div className="spotlight-card">
                <div className="feed-top">
                  <span className={`severity severity-${spotlight.severity}`}>{spotlight.severity.toUpperCase()}</span>
                  <span className={cn("score-pill", scoreColor(spotlight.score))}>{spotlight.score}/100</span>
                </div>
                <h2>{spotlight.title}</h2>
                <p className="subtle">{spotlight.summary}</p>
                <div className="chip-row">
                  {spotlight.countryTags.map((tag) => <span className="chip" key={tag}>{tag}</span>)}
                  {spotlight.topicTags.map((tag) => <span className="chip alt" key={tag}>{tag}</span>)}
                </div>
              </div>
            ) : null}
          </div>

          <div className="panel">
            <div className="panel-topline">AI readout</div>
            <div className="insight-list">
              {data.brief.insights.map((insight) => (
                <article key={insight.title} className="insight-item">
                  <div>
                    <h3>{insight.title}</h3>
                    <p>{insight.detail}</p>
                  </div>
                  <span className={cn("confidence", confidenceBadge(insight.confidence))}>{insight.confidence}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid tri-col">
          <div className="panel col-span-2">
            <div className="section-head">
              <div>
                <div className="panel-topline">Live stream</div>
                <h2 className="section-title">Operational feed</h2>
              </div>
              <div className="filters">
                <input className="search-input" placeholder="Search title, country, theme…" value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} />
                <select value={severityFilter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSeverityFilter(e.target.value as typeof severityFilter)}>
                  {severityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <select value={countryFilter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCountryFilter(e.target.value)}>
                  {countries.map((country) => <option key={country} value={country}>{country}</option>)}
                </select>
              </div>
            </div>
            <div className="feed-list">
              {filteredHeadlines.map((item) => (
                <FeedCard
                  key={item.id}
                  item={item}
                  note={bookmarkNote[item.id] || ""}
                  onNoteChange={(value) => setBookmarkNote((current: Record<string, string>) => ({ ...current, [item.id]: value }))}
                  onBookmark={() => addBookmark(item)}
                />
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-topline">Humanitarian stream</div>
            <div className="feed-list compact">
              {data.brief.humanitarian.map((item) => (
                <article className="feed-card compact" key={item.id}>
                  <div className="feed-top">
                    <span className={`severity severity-${item.severity}`}>{item.severity}</span>
                    <span className="subtle">{timeAgo(item.publishedAt)}</span>
                  </div>
                  <a className="feed-title" href={item.url} target="_blank" rel="noreferrer">{item.title}</a>
                  <div className="chip-row">
                    {item.countryTags.map((tag) => <span className="chip" key={tag}>{tag}</span>)}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="grid tri-col">
          <div className="panel">
            <div className="panel-topline">Watchlists</div>
            <div className="watch-form">
              <input placeholder="Label" value={watchForm.label} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWatchForm((current: typeof watchForm) => ({ ...current, label: e.target.value }))} />
              <input placeholder="Keyword phrase" value={watchForm.keyword} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWatchForm((current: typeof watchForm) => ({ ...current, keyword: e.target.value }))} />
              <input placeholder="Countries comma-separated" value={watchForm.countries} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWatchForm((current: typeof watchForm) => ({ ...current, countries: e.target.value }))} />
              <select value={watchForm.minSeverity} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setWatchForm((current: typeof watchForm) => ({ ...current, minSeverity: e.target.value as Severity }))}>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <button className="primary-btn" onClick={addWatchlist} disabled={!watchForm.label || !watchForm.keyword}>Add watchlist</button>
            </div>
            <div className="watch-list">
              {watchMatches.map(({ watch, items }) => (
                <div className="watch-card" key={watch.id}>
                  <div className="watch-head">
                    <div>
                      <strong>{watch.label}</strong>
                      <p className="subtle">{watch.keyword}</p>
                    </div>
                    <button className="icon-btn" onClick={() => removeWatchlist(watch.id)}>×</button>
                  </div>
                  <div className="chip-row">
                    {watch.countries.map((country) => <span className="chip" key={country}>{country}</span>)}
                    <span className="chip alt">min {watch.minSeverity}</span>
                    <span className="chip alt">{items.length} hits</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-topline">Bookmarks</div>
            <div className="feed-list compact">
              {data.bookmarks.map((item: BookmarkItem) => (
                <BookmarkCard key={item.id} item={item} onDelete={() => removeBookmark(item.id)} />
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-topline">Snapshots</div>
            <div className="snapshot-list">
              {data.snapshots.map((snapshot: SnapshotItem) => (
                <SnapshotCard key={snapshot.id} item={snapshot} />
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function severityRank(value: Severity) {
  return { critical: 4, high: 3, medium: 2, low: 1 }[value];
}

function MetricCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="panel metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-helper">{helper}</div>
    </div>
  );
}

function FeedCard({ item, note, onNoteChange, onBookmark }: { item: HeadlineItem; note: string; onNoteChange: (value: string) => void; onBookmark: () => void }) {
  return (
    <article className="feed-card">
      <div className="feed-top">
        <span className={`severity severity-${item.severity}`}>{item.severity}</span>
        <span className={cn("score-pill", scoreColor(item.score))}>{item.score}/100</span>
        <span className="subtle">{item.source}</span>
        <span className="subtle">{timeAgo(item.publishedAt)}</span>
      </div>
      <a href={item.url} target="_blank" rel="noreferrer" className="feed-title">{item.title}</a>
      <p className="feed-summary">{item.summary || "No summary available."}</p>
      <div className="chip-row">
        {item.countryTags.map((tag) => <span key={tag} className="chip">{tag}</span>)}
        {item.topicTags.map((tag) => <span key={tag} className="chip alt">{tag}</span>)}
      </div>
      <div className="bookmark-row">
        <input placeholder="Bookmark note" value={note} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onNoteChange(e.target.value)} />
        <button className="secondary-btn" onClick={onBookmark}>Save</button>
      </div>
    </article>
  );
}

function BookmarkCard({ item, onDelete }: { item: BookmarkItem; onDelete: () => void }) {
  return (
    <article className="feed-card compact">
      <div className="watch-head">
        <span className={`severity severity-${item.severity}`}>{item.severity}</span>
        <button className="icon-btn" onClick={onDelete}>×</button>
      </div>
      <a className="feed-title" href={item.url} target="_blank" rel="noreferrer">{item.title}</a>
      {item.note ? <p className="feed-summary">{item.note}</p> : null}
      <div className="subtle">{item.source} • {timeAgo(item.createdAt)}</div>
    </article>
  );
}

function SnapshotCard({ item }: { item: SnapshotItem }) {
  return (
    <div className="snapshot-card">
      <strong>{timeAgo(item.capturedAt)}</strong>
      <div className="snapshot-grid">
        <span>Critical</span><strong>{item.criticalCount}</strong>
        <span>High</span><strong>{item.highCount}</strong>
        <span>Total</span><strong>{item.totalItems}</strong>
        <span>Country</span><strong>{item.dominantCountry}</strong>
        <span>Theme</span><strong>{item.dominantTheme}</strong>
      </div>
    </div>
  );
}
