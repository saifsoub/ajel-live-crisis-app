import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";

const APP_VERSION = "0.2.0";

export const metadata = {
  title: "عاجل | AJEL — AI-Powered Middle East Situation Room",
  description:
    "AJEL V2 is a real-time AI intelligence dashboard that monitors breaking geopolitical events, humanitarian crises, and conflict escalations across the Middle East.",
};

export default async function HomePage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="landing-root">

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="landing-nav">
        <div className="landing-brand">
          <span className="brand-ar">عاجل</span>
          <span className="brand-en">AJEL V2</span>
        </div>
        <div className="landing-nav-links">
          <Link href="/showcase" className="nav-link">Product</Link>
          <Link href="/login" className="primary-btn nav-cta">Enter Dashboard →</Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-eyebrow">
          <span className="live-dot" />
          LIVE INTELLIGENCE PLATFORM
        </div>
        <h1 className="hero-headline">
          The AI Situation Room<br />for the Middle East
        </h1>
        <p className="hero-sub">
          Real-time aggregation of breaking events, humanitarian crises, and conflict
          escalations — synthesised by AI into executive-ready intelligence briefs.
        </p>
        <div className="hero-cta-row">
          <Link href="/login" className="cta-primary">Enter Dashboard</Link>
          <Link href="/showcase" className="cta-secondary">See how it works →</Link>
        </div>
        <div className="hero-badges">
          <span className="badge">Next.js 15</span>
          <span className="badge">React 19</span>
          <span className="badge">OpenAI</span>
          <span className="badge">GDELT · ReliefWeb</span>
          <span className="badge">SQLite</span>
        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────────────────────────── */}
      <section className="stats-bar">
        <div className="stat-item">
          <span className="stat-number">3</span>
          <span className="stat-label">Live data sources</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-number">60s</span>
          <span className="stat-label">Refresh interval</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-number">4</span>
          <span className="stat-label">Severity levels</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-number">AI</span>
          <span className="stat-label">Powered insights</span>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section className="features-section">
        <p className="section-eyebrow">CAPABILITIES</p>
        <h2 className="section-heading">Everything an analyst needs</h2>
        <div className="features-grid">

          <div className="feature-card feature-card--accent">
            <div className="feature-icon">📡</div>
            <h3>Multi-Source Aggregation</h3>
            <p>
              Ingests from GDELT, ReliefWeb, and NewsAPI simultaneously.
              If one source is unavailable, the others keep the feed running without interruption.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Severity Scoring Engine</h3>
            <p>
              Every headline scored critical → low using keyword pattern matching
              and a 0–100 heat score balancing severity, freshness, and tag density.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🧠</div>
            <h3>AI-Generated Insights</h3>
            <p>
              GPT-4o-mini synthesises each briefing cycle into an executive summary
              and four structured intelligence bullets. Heuristic fallback always available.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">👁️</div>
            <h3>Watchlist Surveillance</h3>
            <p>
              Create named watchlists with keyword, country, and minimum-severity filters.
              Persistent SQLite storage across sessions.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔖</div>
            <h3>Analyst Bookmarks</h3>
            <p>
              Bookmark any headline with personal notes. Creates an auditable trail
              for after-action reviews and compliance.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📸</div>
            <h3>Snapshot History</h3>
            <p>
              Auto-captured metrics snapshots every 5 minutes — critical counts,
              active countries, dominant themes — without a separate time-series DB.
            </p>
          </div>

        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section className="how-section">
        <p className="section-eyebrow">ARCHITECTURE</p>
        <h2 className="section-heading">How AJEL works</h2>
        <div className="how-steps">
          <div className="how-step">
            <div className="step-num">01</div>
            <div className="step-body">
              <h4>Ingest</h4>
              <p>GDELT, ReliefWeb, and NewsAPI are queried in parallel every 60–300 seconds. Results are merged and deduplicated by URL.</p>
            </div>
          </div>
          <div className="how-arrow">→</div>
          <div className="how-step">
            <div className="step-num">02</div>
            <div className="step-body">
              <h4>Score</h4>
              <p>Each headline is scored for severity (critical / high / medium / low) and a 0–100 heat score is computed deterministically.</p>
            </div>
          </div>
          <div className="how-arrow">→</div>
          <div className="how-step">
            <div className="step-num">03</div>
            <div className="step-body">
              <h4>Synthesise</h4>
              <p>OpenAI gpt-4o-mini generates an executive summary and four structured insights from the top headlines.</p>
            </div>
          </div>
          <div className="how-arrow">→</div>
          <div className="how-step">
            <div className="step-num">04</div>
            <div className="step-body">
              <h4>Deliver</h4>
              <p>The analyst-facing dashboard presents the brief with filtering, watchlists, bookmarks, and snapshot history.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────────────── */}
      <section className="cta-banner">
        <div className="cta-banner-inner">
          <h2>Ready to monitor the region?</h2>
          <p>Log in with your credentials and get live situational awareness in seconds.</p>
          <Link href="/login" className="cta-primary cta-primary--lg">Enter Dashboard →</Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <span className="brand-ar" style={{ fontSize: "1.4rem" }}>عاجل</span>
        <span className="footer-copy">AJEL V2 · Middle East AI Situation Room · v{APP_VERSION}</span>
        <div className="footer-links">
          <Link href="/showcase" className="nav-link">Product Overview</Link>
          <Link href="/login" className="nav-link">Sign In</Link>
        </div>
      </footer>

    </div>
  );
}
