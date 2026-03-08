"use client";

import type React from "react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Login failed.");
      router.push(searchParams.get("next") || "/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to login.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="brand-mark">عاجل</div>
        <p className="eyebrow">AJEL V2</p>
        <h1>Middle East AI situation room</h1>
        <p className="subtle">Secure executive dashboard with live ingestion, saved watchlists, SQLite persistence, and AI-generated situational insights.</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            <span>Email</span>
            <input value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} placeholder="admin@ajel.local" type="email" required />
          </label>
          <label>
            <span>Password</span>
            <input value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} placeholder="••••••••" type="password" required />
          </label>
          {error && <div className="inline-error">{error}</div>}
          <button className="primary-btn" disabled={loading}>{loading ? "Signing in…" : "Enter dashboard"}</button>
        </form>

        <div className="demo-card">
          <div>Default local credentials</div>
          <strong>admin@ajel.local / ChangeThisNow!</strong>
          <span>Change them in <code>.env.local</code> before deployment.</span>
        </div>
      </section>
    </main>
  );
}
