"use client";

import { useState } from "react";

// ─── Data / Config ────────────────────────────────────────────────────────────

const PRODUCT = {
  name: "AJEL V2",
  nameAr: "عاجل",
  tagline: "AI-Powered Geopolitical Intelligence Dashboard",
  audience: "Executives · Analysts · Policymakers",
  focus: "Middle East Crisis Monitoring",
  version: "0.2.0",
  status: "Production-Ready Core",
  stack: "Next.js 15 · React 19 · TypeScript · SQLite · OpenAI",
};

type StatusKind =
  | "implemented"
  | "conditional"
  | "experimental"
  | "planned"
  | "stub";

const STATUS_META: Record<StatusKind, { label: string; color: string; bg: string }> = {
  implemented:  { label: "Implemented",  color: "#6cc98f", bg: "rgba(108,201,143,0.12)" },
  conditional:  { label: "Conditional",  color: "#ffd05d", bg: "rgba(255,208,93,0.12)"  },
  experimental: { label: "Experimental", color: "#eb5815", bg: "rgba(235,88,21,0.12)"   },
  planned:      { label: "Planned",       color: "#93a7c3", bg: "rgba(147,167,195,0.10)" },
  stub:         { label: "Stub / WIP",    color: "#ff995d", bg: "rgba(255,153,93,0.12)"  },
};

const MODULES = [
  {
    id: "aggregator",
    icon: "📡",
    name: "Live Data Aggregator",
    status: "implemented" as StatusKind,
    tech: "GDELT · ReliefWeb · NewsAPI (optional)",
    summary:
      "Fetches headlines from three complementary sources. GDELT covers news events globally; ReliefWeb surfaces UN humanitarian data; NewsAPI adds optional commercial depth. All three are merged, deduplicated by URL, and enriched with metadata.",
    business:
      "Gives analysts a consolidated, multi-source feed without manually monitoring each outlet — reducing cognitive load and response latency.",
    details: [
      "GDELT revalidates every 180 s",
      "ReliefWeb revalidates every 300 s",
      "NewsAPI revalidates every 300 s (if key present)",
      "Promise.allSettled ensures one failed source never kills the feed",
    ],
  },
  {
    id: "scoring",
    icon: "⚡",
    name: "Severity Scoring Engine",
    status: "implemented" as StatusKind,
    tech: "Heuristic keyword engine · Heat score 0–100",
    summary:
      "Scores every headline on a 4-level severity scale (critical → low) using keyword pattern matching. Extracts country tags and topic tags, then computes a heat score that balances severity, freshness, and tag density.",
    business:
      "Allows analysts to instantly triage hundreds of headlines and focus on the most operationally significant events.",
    details: [
      "Keywords: airstrike, missile, ceasefire, hostage, sanctions, border, protest …",
      "Countries extracted from title & summary text",
      "Heat score = severity weight × freshness × tag density (0–100)",
      "No ML model required — deterministic and transparent",
    ],
  },
  {
    id: "ai-insights",
    icon: "🧠",
    name: "AI Insights Synthesis",
    status: "conditional" as StatusKind,
    tech: "OpenAI gpt-4o-mini · Structured JSON schema · Heuristic fallback",
    summary:
      "When OPENAI_API_KEY is present, generates an executive summary and 4 structured insights per briefing cycle using the OpenAI responses API with a strict JSON schema. Falls back to heuristic rules if the API is unavailable or fails.",
    business:
      "Provides decision-ready intelligence bullets without requiring an analyst to manually synthesize dozens of articles.",
    details: [
      "Model: gpt-4o-mini (configurable)",
      "Output: { summary, insights[4] } — structured, not prose-only",
      "Heuristic fallback always available (no hard OpenAI dependency)",
      "Confidence scores included per insight",
    ],
  },
  {
    id: "watchlists",
    icon: "👁️",
    name: "Watchlist Manager",
    status: "implemented" as StatusKind,
    tech: "SQLite · REST API · Client-side CRUD",
    summary:
      "Analysts create named watchlists with keyword, country, and minimum-severity filters. Three seed watchlists (Gaza Strip, Iran Nuclear, Levant Region) are auto-created on first run.",
    business:
      "Enables each analyst to maintain persistent, named surveillance profiles without rebuilding queries on every visit.",
    details: [
      "Stored in SQLite (watchlists table)",
      "Fields: label, keyword, countries[], minSeverity",
      "Seed: Gaza Strip / Iran Nuclear / Levant Region",
      "Full CRUD via /api/watchlists",
    ],
  },
  {
    id: "bookmarks",
    icon: "🔖",
    name: "Bookmark System",
    status: "implemented" as StatusKind,
    tech: "SQLite · REST API · Analyst notes",
    summary:
      "Analysts can bookmark any headline and attach a personal note. Bookmarks persist across sessions and are retrieved on every dashboard load.",
    business:
      "Creates an auditable trail of key decisions and signals — essential for after-action reviews and compliance.",
    details: [
      "Stores: url, title, severity, analyst note",
      "Full CRUD via /api/bookmarks",
      "Notes editable inline in the UI",
    ],
  },
  {
    id: "snapshots",
    icon: "📸",
    name: "Snapshot History",
    status: "implemented" as StatusKind,
    tech: "SQLite · Auto-capture (5-min throttle) · Timeline view",
    summary:
      "Every 5+ minutes the system automatically captures a metrics snapshot: critical count, high count, active countries, and dominant themes. These are visualised as a mini trend chart in the dashboard.",
    business:
      "Provides a lightweight operational history without requiring a separate time-series database — useful for daily/weekly situation briefings.",
    details: [
      "Throttle: only one snapshot per 5 minutes",
      "Stores: critical/high counts, countries[], themes[]",
      "Retrieved via /api/snapshots",
    ],
  },
  {
    id: "auth",
    icon: "🔐",
    name: "Authentication & Session",
    status: "implemented" as StatusKind,
    tech: "HMAC-SHA256 signed cookies · Next.js middleware",
    summary:
      "Single-admin authentication using environment-variable credentials and HMAC-SHA256 signed session cookies. Middleware protects the /dashboard route. Sessions expire after 24 hours.",
    business:
      "Keeps the intelligence feed private with minimal infrastructure overhead — no external auth provider required.",
    details: [
      "Credentials: AJEL_USER / AJEL_PASS env vars",
      "Cookie: ajel_session (HMAC-SHA256, 24-hour TTL)",
      "Middleware protects /dashboard route only",
      "Single user — no RBAC yet",
    ],
  },
  {
    id: "creative-studio",
    icon: "🎨",
    name: "Creative Studio",
    status: "experimental" as StatusKind,
    tech: "Next.js page · Status: experimental, not wired to core pipeline",
    summary:
      "A separate page at /creative-studio. Large file (~23 KB) exists in the repo but is not referenced in the main navigation or core data flows. Likely a content/report generation experiment.",
    business:
      "Potential future value for producing polished intelligence reports or visualisations, but not yet production-ready.",
    details: [
      "Route: /creative-studio (auth not enforced by middleware)",
      "Not linked from dashboard navigation",
      "Status: exploratory",
    ],
  },
  {
    id: "telegram",
    icon: "✈️",
    name: "Telegram Integration",
    status: "stub" as StatusKind,
    tech: "API route stub at /api/telegram",
    summary:
      "A Telegram route file exists but has not been detailed in the codebase exploration. Likely a planned push-notification channel for real-time alert delivery to analyst Telegram groups.",
    business:
      "Would significantly extend reach by pushing critical alerts directly to analysts' phones without requiring them to have the dashboard open.",
    details: [
      "Route: /api/telegram (stub)",
      "Not wired to the main briefing pipeline",
      "Status: planned / work-in-progress",
    ],
  },
];

const READINESS_ROWS = [
  { feature: "Multi-source news ingestion",         state: "implemented"  as StatusKind },
  { feature: "Heuristic severity scoring",          state: "implemented"  as StatusKind },
  { feature: "Heat score calculation",              state: "implemented"  as StatusKind },
  { feature: "Executive AI summary (OpenAI)",       state: "conditional"  as StatusKind },
  { feature: "Structured AI insights (4 bullets)",  state: "conditional"  as StatusKind },
  { feature: "Heuristic insight fallback",          state: "implemented"  as StatusKind },
  { feature: "Watchlist CRUD",                      state: "implemented"  as StatusKind },
  { feature: "Analyst bookmarks with notes",        state: "implemented"  as StatusKind },
  { feature: "Auto-snapshots (5-min throttle)",     state: "implemented"  as StatusKind },
  { feature: "Trend chart / snapshot history",      state: "implemented"  as StatusKind },
  { feature: "Session auth (signed cookie)",        state: "implemented"  as StatusKind },
  { feature: "Route-level middleware protection",   state: "implemented"  as StatusKind },
  { feature: "Real-time push (WebSockets/SSE)",     state: "planned"      as StatusKind },
  { feature: "Multi-user / role management",        state: "planned"      as StatusKind },
  { feature: "Date range & source filtering",       state: "planned"      as StatusKind },
  { feature: "CSV / JSON export",                   state: "planned"      as StatusKind },
  { feature: "Telegram push alerts",                state: "stub"         as StatusKind },
  { feature: "Creative Studio",                     state: "experimental" as StatusKind },
  { feature: "Mobile-responsive layout",            state: "experimental" as StatusKind },
  { feature: "API rate limiting",                   state: "planned"      as StatusKind },
];

const ROADMAP = [
  {
    phase: "Phase 1",
    label: "Stability & Depth",
    items: [
      "Add WebSocket / SSE real-time updates (replace 60 s poll)",
      "Rate-limit API routes",
      "Add date range + source filters",
      "Mobile-responsive layout improvements",
    ],
  },
  {
    phase: "Phase 2",
    label: "Multi-User & Collaboration",
    items: [
      "Multi-user support with role-based access (analyst / admin)",
      "Team-shared watchlists and bookmarks",
      "Audit log for analyst actions",
    ],
  },
  {
    phase: "Phase 3",
    label: "Output & Integrations",
    items: [
      "Wire Telegram push alerts for critical-severity events",
      "CSV / PDF export of briefs and snapshots",
      "Webhook delivery to Slack / Teams",
    ],
  },
  {
    phase: "Phase 4",
    label: "Intelligence Upgrade",
    items: [
      "Source credibility scoring",
      "Entity-level tracking (person, org, location)",
      "Trend forecasting via time-series analysis",
      "Custom AI model fine-tuning on MENA news",
    ],
  },
];

const SOURCES = [
  {
    name: "GDELT",
    type: "News event database",
    scope: "Global · MENA-focused queries",
    revalidate: "180 s",
    key: "No",
    status: "implemented" as StatusKind,
  },
  {
    name: "ReliefWeb",
    type: "UN humanitarian reports",
    scope: "Middle East countries",
    revalidate: "300 s",
    key: "No",
    status: "implemented" as StatusKind,
  },
  {
    name: "NewsAPI",
    type: "Commercial news aggregator",
    scope: "MENA query",
    revalidate: "300 s",
    key: "NEWS_API_KEY required",
    status: "conditional" as StatusKind,
  },
  {
    name: "OpenAI",
    type: "AI synthesis",
    scope: "Executive summary + insights",
    revalidate: "Per request",
    key: "OPENAI_API_KEY required",
    status: "conditional" as StatusKind,
  },
];

const ARCH_LAYERS = [
  {
    label: "Frontend",
    color: "#25c2b8",
    items: [
      "app/showcase/page.tsx — this page",
      "app/dashboard/page.tsx — SSR shell (auth-gated)",
      "app/login/page.tsx — public auth form",
      "app/creative-studio/page.tsx — experimental",
      "components/dashboard-client.tsx — React 19 client",
      "components/showcase-client.tsx — this component",
    ],
  },
  {
    label: "API Routes",
    color: "#eb5815",
    items: [
      "GET  /api/live — build live brief",
      "GET/POST/DELETE  /api/watchlists",
      "GET/POST/DELETE  /api/bookmarks",
      "GET  /api/snapshots",
      "POST /api/auth/login · logout",
      "POST /api/telegram (stub)",
    ],
  },
  {
    label: "Business Logic",
    color: "#ffd05d",
    items: [
      "lib/live.ts — brief orchestrator",
      "lib/sources.ts — GDELT, ReliefWeb, NewsAPI fetchers",
      "lib/insights.ts — AI + heuristic synthesis",
      "lib/scoring.ts → embedded in sources/live",
      "lib/auth.ts — HMAC-SHA256 session signing",
      "lib/storage.ts — SQLite CRUD",
    ],
  },
  {
    label: "Data Layer",
    color: "#6cc98f",
    items: [
      "SQLite 3 via Node.js built-in node:sqlite",
      "WAL mode enabled",
      "Tables: watchlists · bookmarks · snapshots",
      "data/ajel.sqlite (auto-created)",
      "No ORM — prepared statements",
    ],
  },
  {
    label: "Infrastructure",
    color: "#93a7c3",
    items: [
      "Next.js 15 App Router · React 19 · TypeScript 5.8",
      "Middleware: /dashboard route protection",
      "No external DB required (SQLite embedded)",
      "Deployment: any Node.js host (Vercel, Railway, etc.)",
      "Config via .env (no secrets in code)",
    ],
  },
];

const NAV_ITEMS = [
  { id: "overview",      icon: "🏠", label: "Overview" },
  { id: "modules",       icon: "🧩", label: "Modules" },
  { id: "architecture",  icon: "🏗️", label: "Architecture" },
  { id: "readiness",     icon: "✅", label: "Readiness" },
  { id: "roadmap",       icon: "🗺️", label: "Roadmap" },
];

// ─── Small utilities ──────────────────────────────────────────────────────────

function StatusBadge({ state }: { state: StatusKind }) {
  const m = STATUS_META[state];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: "0.72rem",
        fontWeight: 700,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        color: m.color,
        background: m.bg,
        border: `1px solid ${m.color}33`,
      }}
    >
      {m.label}
    </span>
  );
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function OverviewSection() {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Hero */}
      <div className="panel" style={{ padding: "32px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div
            className="brand-mark"
            style={{ width: 72, height: 72, fontSize: "1.5rem", flexShrink: 0 }}
          >
            عاجل
          </div>
          <div style={{ flex: 1 }}>
            <p className="eyebrow" style={{ margin: 0 }}>
              Product Showcase · Honest Evaluation
            </p>
            <h1
              style={{
                margin: "8px 0 6px",
                fontSize: "clamp(1.8rem, 5vw, 3rem)",
                lineHeight: 1.1,
              }}
            >
              AJEL V2
            </h1>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "1rem" }}>
              {PRODUCT.tagline}
            </p>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <StatusBadge state="implemented" />
            <p
              style={{
                margin: "6px 0 0",
                color: "var(--muted)",
                fontSize: "0.82rem",
              }}
            >
              v{PRODUCT.version}
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: 24,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 14,
          }}
        >
          {[
            { label: "Product Type", value: "AI Intelligence Dashboard" },
            { label: "Focus Region", value: "Middle East (MENA)" },
            { label: "Audience", value: "Executives · Analysts" },
            { label: "Framework", value: "Next.js 15 · React 19" },
            { label: "Database", value: "SQLite (embedded)" },
            { label: "AI Layer", value: "OpenAI (optional)" },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--panel-border)",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "var(--muted)",
                  fontSize: "0.72rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                {label}
              </p>
              <p style={{ margin: "4px 0 0", fontWeight: 700, fontSize: "0.9rem" }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* What it does */}
      <div className="panel">
        <p className="panel-topline">What This Repo Actually Does</p>
        <p style={{ margin: "0 0 18px", lineHeight: 1.7, color: "#d7e6ff", fontSize: "1.05rem" }}>
          AJEL V2 is a <strong>production-oriented Middle East crisis monitoring system</strong>.
          It aggregates live headlines from GDELT, ReliefWeb, and optionally NewsAPI; scores every item
          for severity using a heuristic engine; optionally synthesises an executive brief via OpenAI;
          and presents everything in a secured, data-rich dashboard built for analysts who need
          situational awareness fast.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 14,
          }}
        >
          {[
            {
              icon: "📡",
              title: "Live, Multi-Source Feed",
              body:
                "Merges GDELT events, ReliefWeb humanitarian reports, and optional NewsAPI coverage into a single deduplicated stream — updated every 60 seconds.",
            },
            {
              icon: "⚡",
              title: "Intelligent Triage",
              body:
                "Keyword-based severity scoring (critical/high/medium/low) and a 0–100 heat score let analysts instantly surface the most operationally significant items.",
            },
            {
              icon: "🧠",
              title: "AI-Powered Briefings",
              body:
                "With an OpenAI key, the system generates a structured executive summary and four insight bullets per cycle. Without it, deterministic heuristic insights take over.",
            },
            {
              icon: "🔖",
              title: "Persistent Analyst Tools",
              body:
                "Watchlists, bookmarks (with notes), and auto-captured metric snapshots are stored in embedded SQLite — no external database required.",
            },
          ].map(({ icon, title, body }) => (
            <div
              key={title}
              style={{
                padding: "16px",
                borderRadius: 16,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--panel-border)",
              }}
            >
              <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>{icon}</div>
              <h3 style={{ margin: "0 0 6px", fontSize: "0.95rem" }}>{title}</h3>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.85rem", lineHeight: 1.55 }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Data flow */}
      <div className="panel">
        <p className="panel-topline">System Data Flow</p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            marginTop: 8,
          }}
        >
          {[
            { label: "GDELT\nReliefWeb\nNewsAPI", color: "#25c2b8" },
            { arrow: true },
            { label: "Aggregation\n& Dedup", color: "#eb5815" },
            { arrow: true },
            { label: "Severity\nScoring", color: "#ffd05d" },
            { arrow: true },
            { label: "AI Synthesis\n(optional)", color: "#93a7c3" },
            { arrow: true },
            { label: "Dashboard\nUI", color: "#6cc98f" },
            { arrow: true },
            { label: "SQLite\nPersistence", color: "#9d7fea" },
          ].map((step, i) =>
            "arrow" in step ? (
              <span key={i} style={{ color: "var(--muted)", fontSize: "1.2rem" }}>
                →
              </span>
            ) : (
              <div
                key={i}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: `${step.color}18`,
                  border: `1px solid ${step.color}40`,
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: step.color,
                  whiteSpace: "pre",
                  lineHeight: 1.4,
                  textAlign: "center",
                }}
              >
                {step.label}
              </div>
            )
          )}
        </div>
        <p style={{ margin: "14px 0 0", color: "var(--muted)", fontSize: "0.83rem" }}>
          All data flows through Next.js API routes and server-side lib functions. The dashboard
          client polls <code>/api/live</code> every 60 seconds. Watchlists, bookmarks, and snapshots
          are read/written via their respective REST endpoints backed by SQLite.
        </p>
      </div>

      {/* Source truth table */}
      <div className="panel">
        <p className="panel-topline">External Data Sources</p>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.85rem",
            }}
          >
            <thead>
              <tr style={{ color: "var(--muted)", textAlign: "left" }}>
                {["Source", "Type", "Scope", "Revalidate", "API Key", "Status"].map((h) => (
                  <th key={h} style={{ padding: "8px 12px", borderBottom: "1px solid var(--panel-border)", fontWeight: 600 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SOURCES.map((s) => (
                <tr key={s.name} style={{ borderBottom: "1px solid rgba(126,160,196,0.08)" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 700 }}>{s.name}</td>
                  <td style={{ padding: "10px 12px", color: "var(--muted)" }}>{s.type}</td>
                  <td style={{ padding: "10px 12px", color: "var(--muted)" }}>{s.scope}</td>
                  <td style={{ padding: "10px 12px", color: "var(--muted)" }}>{s.revalidate}</td>
                  <td style={{ padding: "10px 12px", color: "var(--muted)", fontSize: "0.78rem" }}>{s.key}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <StatusBadge state={s.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ModulesSection() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div className="panel">
        <p className="panel-topline">Modules Explorer</p>
        <p style={{ margin: "0 0 18px", color: "var(--muted)", fontSize: "0.88rem" }}>
          Click any module to inspect its technical details, business purpose, and implementation status.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
            gap: 14,
          }}
        >
          {MODULES.map((m) => {
            const isOpen = active === m.id;
            return (
              <div
                key={m.id}
                onClick={() => setActive(isOpen ? null : m.id)}
                style={{
                  borderRadius: 16,
                  border: `1px solid ${isOpen ? STATUS_META[m.status].color + "55" : "var(--panel-border)"}`,
                  background: isOpen
                    ? STATUS_META[m.status].bg
                    : "rgba(255,255,255,0.03)",
                  padding: "16px",
                  cursor: "pointer",
                  transition: "border-color 0.2s, background 0.2s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <span style={{ fontSize: "1.4rem" }}>{m.icon}</span>
                  <StatusBadge state={m.status} />
                </div>
                <h3 style={{ margin: "0 0 6px", fontSize: "0.95rem" }}>{m.name}</h3>
                <p
                  style={{
                    margin: 0,
                    color: "var(--muted)",
                    fontSize: "0.78rem",
                    fontFamily: "monospace",
                  }}
                >
                  {m.tech}
                </p>

                {isOpen && (
                  <div style={{ marginTop: 14 }}>
                    <p
                      style={{
                        margin: "0 0 10px",
                        fontSize: "0.84rem",
                        lineHeight: 1.6,
                        color: "#d7e6ff",
                      }}
                    >
                      {m.summary}
                    </p>
                    <p
                      style={{
                        margin: "0 0 8px",
                        color: "var(--teal)",
                        fontSize: "0.72rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        fontWeight: 700,
                      }}
                    >
                      Business Value
                    </p>
                    <p
                      style={{
                        margin: "0 0 12px",
                        fontSize: "0.84rem",
                        lineHeight: 1.55,
                        color: "var(--muted)",
                      }}
                    >
                      {m.business}
                    </p>
                    <p
                      style={{
                        margin: "0 0 8px",
                        color: "var(--teal)",
                        fontSize: "0.72rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        fontWeight: 700,
                      }}
                    >
                      Technical Details
                    </p>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: 18,
                        display: "grid",
                        gap: 4,
                      }}
                    >
                      {m.details.map((d) => (
                        <li
                          key={d}
                          style={{ color: "var(--muted)", fontSize: "0.82rem", lineHeight: 1.5 }}
                        >
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {!isOpen && (
                  <p
                    style={{
                      margin: "8px 0 0",
                      color: "var(--muted)",
                      fontSize: "0.78rem",
                      opacity: 0.7,
                    }}
                  >
                    Click to inspect ↓
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="panel">
        <p className="panel-topline">Status Legend</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {(Object.entries(STATUS_META) as [StatusKind, typeof STATUS_META[StatusKind]][]).map(
            ([key, m]) => (
              <div
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  borderRadius: 10,
                  background: m.bg,
                  border: `1px solid ${m.color}33`,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: m.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: m.color }}>
                  {m.label}
                </span>
              </div>
            )
          )}
        </div>
        <div style={{ marginTop: 16, display: "grid", gap: 6, color: "var(--muted)", fontSize: "0.83rem" }}>
          <p style={{ margin: 0 }}>
            <strong style={{ color: STATUS_META.implemented.color }}>Implemented</strong> — fully
            wired in both the API and the dashboard UI.
          </p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: STATUS_META.conditional.color }}>Conditional</strong> — works
            when an environment variable (API key) is present; gracefully degrades otherwise.
          </p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: STATUS_META.experimental.color }}>Experimental</strong> — code
            exists but is not wired into the primary product flow.
          </p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: STATUS_META.stub.color }}>Stub / WIP</strong> — route or file
            exists as a placeholder; logic not yet implemented.
          </p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: STATUS_META.planned.color }}>Planned</strong> — not yet in the
            codebase; identified as a logical next step.
          </p>
        </div>
      </div>
    </div>
  );
}

function ArchitectureSection() {
  const [openLayer, setOpenLayer] = useState<string | null>("Frontend");

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div className="panel">
        <p className="panel-topline">Stack Overview</p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginBottom: 20,
          }}
        >
          {[
            { label: "Framework",  value: "Next.js 15",       color: "#25c2b8" },
            { label: "UI Library", value: "React 19",          color: "#61dafb" },
            { label: "Language",   value: "TypeScript 5.8",    color: "#3178c6" },
            { label: "Database",   value: "SQLite (embedded)", color: "#6cc98f" },
            { label: "AI",         value: "OpenAI SDK 5",      color: "#eb5815" },
            { label: "Auth",       value: "HMAC-SHA256 Cookie", color: "#ffd05d" },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                padding: "14px",
                borderRadius: 14,
                border: `1px solid ${color}30`,
                background: `${color}10`,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "0.7rem",
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                {label}
              </p>
              <p style={{ margin: "4px 0 0", fontWeight: 700, color, fontSize: "0.88rem" }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <p className="panel-topline">Codebase Layers</p>
        <p style={{ margin: "0 0 16px", color: "var(--muted)", fontSize: "0.85rem" }}>
          Click any layer to see its files and responsibilities.
        </p>
        <div style={{ display: "grid", gap: 10 }}>
          {ARCH_LAYERS.map((layer) => {
            const isOpen = openLayer === layer.label;
            return (
              <div
                key={layer.label}
                style={{
                  borderRadius: 14,
                  border: `1px solid ${isOpen ? layer.color + "55" : "var(--panel-border)"}`,
                  background: isOpen ? `${layer.color}0e` : "rgba(255,255,255,0.02)",
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={() => setOpenLayer(isOpen ? null : layer.label)}
                  style={{
                    width: "100%",
                    background: "none",
                    border: "none",
                    padding: "14px 16px",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    color: "var(--text)",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "0.92rem",
                      color: isOpen ? layer.color : "var(--text)",
                    }}
                  >
                    {layer.label}
                  </span>
                  <span
                    style={{
                      color: "var(--muted)",
                      fontSize: "0.8rem",
                      transform: isOpen ? "rotate(180deg)" : "none",
                      transition: "transform 0.2s",
                    }}
                  >
                    ▼
                  </span>
                </button>
                {isOpen && (
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 0,
                      listStyle: "none",
                      borderTop: `1px solid ${layer.color}30`,
                      padding: "10px 16px 14px",
                      display: "grid",
                      gap: 6,
                    }}
                  >
                    {layer.items.map((item) => (
                      <li
                        key={item}
                        style={{
                          fontSize: "0.82rem",
                          color: "var(--muted)",
                          fontFamily: "monospace",
                          lineHeight: 1.5,
                        }}
                      >
                        <span style={{ color: layer.color, marginRight: 6 }}>›</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel">
        <p className="panel-topline">Rendering & Data Strategy</p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 14,
          }}
        >
          {[
            {
              title: "Server Components (SSR)",
              color: "#25c2b8",
              points: [
                "app/dashboard/page.tsx — fetches initial data server-side",
                "app/showcase/page.tsx — static server render",
                "Reduces client-side JS bundle",
              ],
            },
            {
              title: "Client Components",
              color: "#eb5815",
              points: [
                "components/dashboard-client.tsx — 'use client'",
                "Handles state: filters, watchlists, bookmarks",
                "Polls /api/live every 60 seconds",
              ],
            },
            {
              title: "API Routes (Node.js)",
              color: "#ffd05d",
              points: [
                "All run in Node.js runtime (not Edge)",
                "Direct SQLite access via storage.ts",
                "External fetches via sources.ts",
              ],
            },
            {
              title: "Caching & Revalidation",
              color: "#6cc98f",
              points: [
                "GDELT: fetch cache 180 s",
                "ReliefWeb: fetch cache 300 s",
                "SQLite reads: no cache (always fresh)",
              ],
            },
          ].map(({ title, color, points }) => (
            <div
              key={title}
              style={{
                padding: "14px 16px",
                borderRadius: 14,
                background: `${color}0c`,
                border: `1px solid ${color}30`,
              }}
            >
              <p
                style={{
                  margin: "0 0 10px",
                  fontWeight: 700,
                  color,
                  fontSize: "0.88rem",
                }}
              >
                {title}
              </p>
              <ul style={{ margin: 0, paddingLeft: 16, display: "grid", gap: 4 }}>
                {points.map((p) => (
                  <li
                    key={p}
                    style={{ color: "var(--muted)", fontSize: "0.8rem", lineHeight: 1.5 }}
                  >
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReadinessSection() {
  const groups: StatusKind[] = ["implemented", "conditional", "experimental", "stub", "planned"];

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div className="panel">
        <p className="panel-topline">Implementation Truth Table</p>
        <p style={{ margin: "0 0 18px", color: "var(--muted)", fontSize: "0.85rem" }}>
          Every significant feature assessed against its actual state in the codebase. No feature is
          presented as complete unless it is fully wired end-to-end.
        </p>

        {groups.map((group) => {
          const rows = READINESS_ROWS.filter((r) => r.state === group);
          if (!rows.length) return null;
          const m = STATUS_META[group];
          return (
            <div key={group} style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: m.color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: m.color,
                  }}
                >
                  {m.label}
                </span>
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                {rows.map(({ feature }) => (
                  <div
                    key={feature}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 14px",
                      borderRadius: 12,
                      background: m.bg,
                      border: `1px solid ${m.color}22`,
                      gap: 12,
                    }}
                  >
                    <span style={{ fontSize: "0.85rem" }}>{feature}</span>
                    <StatusBadge state={group} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary counts */}
      <div className="panel">
        <p className="panel-topline">Readiness Summary</p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
          }}
        >
          {groups.map((g) => {
            const count = READINESS_ROWS.filter((r) => r.state === g).length;
            const m = STATUS_META[g];
            return (
              <div
                key={g}
                style={{
                  padding: "16px",
                  borderRadius: 14,
                  background: m.bg,
                  border: `1px solid ${m.color}33`,
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "2rem",
                    fontWeight: 800,
                    color: m.color,
                  }}
                >
                  {count}
                </p>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "0.72rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: m.color,
                  }}
                >
                  {m.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RoadmapSection() {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Strategic value */}
      <div className="panel">
        <p className="panel-topline">Strategic Value</p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 14,
          }}
        >
          {[
            {
              icon: "⚡",
              title: "Speed Advantage",
              body:
                "Aggregates and scores hundreds of headlines in seconds — dramatically faster than manual monitoring of multiple news outlets.",
            },
            {
              icon: "🎯",
              title: "Analyst Leverage",
              body:
                "Watchlists, bookmarks, and auto-snapshots mean analysts spend less time organizing and more time interpreting.",
            },
            {
              icon: "🔌",
              title: "Low Infrastructure Overhead",
              body:
                "Embedded SQLite and optional API keys mean the system runs on any Node.js host with zero external services required for the core product.",
            },
            {
              icon: "🧠",
              title: "AI-Augmented, Not AI-Dependent",
              body:
                "The heuristic fallback ensures the product is fully usable without an OpenAI key — AI enhances rather than gates the experience.",
            },
            {
              icon: "📡",
              title: "Multi-Source Resilience",
              body:
                "Promise.allSettled ensures a failed data source degrades gracefully rather than breaking the entire feed.",
            },
            {
              icon: "🚀",
              title: "Deploy-Ready Core",
              body:
                "The authentication, data fetching, persistence, and dashboard layers are production-quality and deployable to Vercel, Railway, or any Node.js host today.",
            },
          ].map(({ icon, title, body }) => (
            <div
              key={title}
              style={{
                padding: "16px",
                borderRadius: 16,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--panel-border)",
              }}
            >
              <div style={{ fontSize: "1.4rem", marginBottom: 8 }}>{icon}</div>
              <h3 style={{ margin: "0 0 6px", fontSize: "0.9rem" }}>{title}</h3>
              <p
                style={{
                  margin: 0,
                  color: "var(--muted)",
                  fontSize: "0.82rem",
                  lineHeight: 1.55,
                }}
              >
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Monetization */}
      <div className="panel">
        <p className="panel-topline">Monetisation Angles</p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 12,
          }}
        >
          {[
            {
              label: "SaaS — Per-Seat",
              color: "#25c2b8",
              desc: "Multi-user dashboard with per-analyst subscriptions for NGOs, news organisations, embassies, and think tanks.",
            },
            {
              label: "Managed Intelligence API",
              color: "#eb5815",
              desc: "Expose the scored, structured headline stream as a paid API for developers building geopolitical risk tools.",
            },
            {
              label: "White-Label / Enterprise",
              color: "#ffd05d",
              desc: "License the platform to government agencies or security firms monitoring specific regions.",
            },
            {
              label: "Report Generation",
              color: "#6cc98f",
              desc: "Use the Creative Studio module to produce AI-authored daily/weekly situation reports as a premium output tier.",
            },
          ].map(({ label, color, desc }) => (
            <div
              key={label}
              style={{
                padding: "14px 16px",
                borderRadius: 14,
                background: `${color}0c`,
                border: `1px solid ${color}30`,
              }}
            >
              <p style={{ margin: "0 0 6px", fontWeight: 700, color, fontSize: "0.88rem" }}>
                {label}
              </p>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.82rem", lineHeight: 1.5 }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Roadmap */}
      <div className="panel">
        <p className="panel-topline">Recommended Roadmap</p>
        <div style={{ display: "grid", gap: 14 }}>
          {ROADMAP.map((phase, i) => (
            <div
              key={phase.phase}
              style={{
                display: "grid",
                gridTemplateColumns: "140px 1fr",
                gap: 16,
                padding: "16px",
                borderRadius: 14,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--panel-border)",
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.7rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--muted)",
                  }}
                >
                  {phase.phase}
                </p>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    color: ["#25c2b8", "#eb5815", "#ffd05d", "#6cc98f"][i % 4],
                  }}
                >
                  {phase.label}
                </p>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 5 }}>
                {phase.items.map((item) => (
                  <li
                    key={item}
                    style={{ color: "var(--muted)", fontSize: "0.83rem", lineHeight: 1.5 }}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div
        className="panel"
        style={{
          background: "linear-gradient(135deg, rgba(235,88,21,0.12), rgba(37,194,184,0.1))",
          textAlign: "center",
          padding: "32px 24px",
        }}
      >
        <p className="eyebrow">Ready to Explore?</p>
        <h2 style={{ margin: "10px 0 14px", fontSize: "1.8rem" }}>
          The core product is deploy-ready.
        </h2>
        <p
          style={{
            margin: "0 0 24px",
            color: "var(--muted)",
            maxWidth: 520,
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: 1.6,
          }}
        >
          Auth, live data aggregation, severity scoring, analyst tools, and the dashboard UI are all
          fully implemented. Add your API keys and deploy.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a
            href="/login"
            className="primary-btn"
            style={{ padding: "12px 24px", fontWeight: 700, borderRadius: 14, fontSize: "0.92rem" }}
          >
            Open Dashboard →
          </a>
          <a
            href="https://github.com/saifsoub/ajel-live-crisis-app"
            target="_blank"
            rel="noopener noreferrer"
            className="secondary-btn"
            style={{ padding: "12px 24px", fontWeight: 600, borderRadius: 14, fontSize: "0.92rem" }}
          >
            View on GitHub
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Main Shell ───────────────────────────────────────────────────────────────

export function ShowcaseClient() {
  const [section, setSection] = useState("overview");

  const SECTION_COMPONENTS: Record<string, React.ReactNode> = {
    overview:     <OverviewSection />,
    modules:      <ModulesSection />,
    architecture: <ArchitectureSection />,
    readiness:    <ReadinessSection />,
    roadmap:      <RoadmapSection />,
  };

  const activeNav = NAV_ITEMS.find((n) => n.id === section)!;

  return (
    <div
      style={{
        width: "min(1480px, calc(100% - 28px))",
        margin: "0 auto",
        paddingTop: 24,
        paddingBottom: 60,
        display: "grid",
        gridTemplateColumns: "260px 1fr",
        gap: 20,
        alignItems: "start",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          position: "sticky",
          top: 24,
          display: "grid",
          gap: 14,
        }}
      >
        {/* Brand */}
        <div
          className="panel"
          style={{ padding: "20px", display: "flex", alignItems: "center", gap: 14 }}
        >
          <div
            className="brand-mark sm"
            style={{ flexShrink: 0 }}
          >
            عاجل
          </div>
          <div>
            <p
              style={{
                margin: 0,
                fontWeight: 800,
                fontSize: "1.05rem",
                lineHeight: 1.2,
              }}
            >
              AJEL V2
            </p>
            <p
              style={{
                margin: "3px 0 0",
                fontSize: "0.72rem",
                color: "var(--muted)",
              }}
            >
              Product Showcase
            </p>
          </div>
        </div>

        {/* Nav */}
        <div className="panel" style={{ padding: "10px" }}>
          {NAV_ITEMS.map((item) => {
            const isActive = item.id === section;
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                style={{
                  width: "100%",
                  background: isActive ? "rgba(235,88,21,0.14)" : "none",
                  border: isActive ? "1px solid rgba(235,88,21,0.28)" : "1px solid transparent",
                  borderRadius: 12,
                  padding: "10px 14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  color: isActive ? "var(--text)" : "var(--muted)",
                  fontWeight: isActive ? 700 : 400,
                  fontSize: "0.88rem",
                  textAlign: "left",
                  marginBottom: 2,
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                <span style={{ fontSize: "1rem" }}>{item.icon}</span>
                {item.label}
                {isActive && (
                  <span
                    style={{ marginLeft: "auto", color: "var(--accent)", fontSize: "0.75rem" }}
                  >
                    ←
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick stats */}
        <div className="panel" style={{ padding: "16px" }}>
          <p
            style={{
              margin: "0 0 12px",
              color: "var(--teal)",
              fontSize: "0.72rem",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontWeight: 700,
            }}
          >
            At a Glance
          </p>
          {[
            { label: "Data Sources",   value: "3" },
            { label: "API Routes",     value: "7" },
            { label: "Core Modules",   value: `${MODULES.length}` },
            { label: "Features Live",  value: `${READINESS_ROWS.filter((r) => r.state === "implemented").length}` },
            { label: "Needs API Key",  value: "2 (optional)" },
            { label: "External DB",    value: "None" },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "6px 0",
                borderBottom: "1px solid rgba(126,160,196,0.08)",
              }}
            >
              <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{label}</span>
              <span style={{ fontSize: "0.82rem", fontWeight: 700 }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Back link */}
        <a
          href="/login"
          style={{
            display: "block",
            textAlign: "center",
            padding: "11px",
            borderRadius: 14,
            background: "rgba(235,88,21,0.1)",
            border: "1px solid rgba(235,88,21,0.22)",
            color: "var(--text)",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          Open Dashboard →
        </a>
      </aside>

      {/* Main content */}
      <main>
        {/* Section header */}
        <div
          className="panel"
          style={{
            padding: "16px 20px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: "1.3rem" }}>{activeNav.icon}</span>
          <div>
            <p className="eyebrow" style={{ margin: 0 }}>
              AJEL V2 · Product Showcase
            </p>
            <h2 style={{ margin: "2px 0 0", fontSize: "1.25rem" }}>{activeNav.label}</h2>
          </div>
        </div>

        {SECTION_COMPONENTS[section]}
      </main>

      {/* Responsive override — single column below 960px */}
      <style>{`
        @media (max-width: 960px) {
          div[style*="grid-template-columns: 260px"] {
            grid-template-columns: 1fr !important;
          }
          aside[style*="position: sticky"] {
            position: static !important;
          }
        }
      `}</style>
    </div>
  );
}
