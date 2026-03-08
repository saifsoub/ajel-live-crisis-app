import path from "node:path";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";

import { BookmarkItem, SnapshotItem, WatchlistItem } from "@/lib/types";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "ajel.sqlite");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS watchlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    label TEXT NOT NULL,
    keyword TEXT NOT NULL,
    countries TEXT NOT NULL,
    min_severity TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    headline_id TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    note TEXT NOT NULL,
    severity TEXT NOT NULL,
    source TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    captured_at TEXT NOT NULL,
    critical_count INTEGER NOT NULL,
    high_count INTEGER NOT NULL,
    total_items INTEGER NOT NULL,
    dominant_country TEXT NOT NULL,
    dominant_theme TEXT NOT NULL
  );
`);

function parseJsonArray<T>(value: string): T[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function getWatchlists(): WatchlistItem[] {
  const rows = db.prepare(`SELECT * FROM watchlists ORDER BY id DESC LIMIT 50`).all() as Array<Record<string, unknown>>;
  return rows.map((row) => ({
    id: Number(row.id),
    label: String(row.label),
    keyword: String(row.keyword),
    countries: parseJsonArray<string>(String(row.countries)),
    minSeverity: String(row.min_severity) as WatchlistItem["minSeverity"],
    createdAt: String(row.created_at),
  }));
}

export function addWatchlist(input: Omit<WatchlistItem, "id" | "createdAt">) {
  const createdAt = new Date().toISOString();
  db.prepare(`INSERT INTO watchlists (label, keyword, countries, min_severity, created_at) VALUES (?, ?, ?, ?, ?)`)
    .run(input.label, input.keyword, JSON.stringify(input.countries), input.minSeverity, createdAt);
  return getWatchlists()[0];
}

export function deleteWatchlist(id: number) {
  db.prepare(`DELETE FROM watchlists WHERE id = ?`).run(id);
}

export function getBookmarks(): BookmarkItem[] {
  const rows = db.prepare(`SELECT * FROM bookmarks ORDER BY id DESC LIMIT 100`).all() as Array<Record<string, unknown>>;
  return rows.map((row) => ({
    id: Number(row.id),
    headlineId: String(row.headline_id),
    title: String(row.title),
    url: String(row.url),
    note: String(row.note),
    severity: String(row.severity) as BookmarkItem["severity"],
    source: String(row.source),
    createdAt: String(row.created_at),
  }));
}

export function addBookmark(input: Omit<BookmarkItem, "id" | "createdAt">) {
  const createdAt = new Date().toISOString();
  db.prepare(`INSERT INTO bookmarks (headline_id, title, url, note, severity, source, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(input.headlineId, input.title, input.url, input.note, input.severity, input.source, createdAt);
  return getBookmarks()[0];
}

export function deleteBookmark(id: number) {
  db.prepare(`DELETE FROM bookmarks WHERE id = ?`).run(id);
}

export function getSnapshots(): SnapshotItem[] {
  const rows = db.prepare(`SELECT * FROM snapshots ORDER BY id DESC LIMIT 24`).all() as Array<Record<string, unknown>>;
  return rows.map((row) => ({
    id: Number(row.id),
    capturedAt: String(row.captured_at),
    criticalCount: Number(row.critical_count),
    highCount: Number(row.high_count),
    totalItems: Number(row.total_items),
    dominantCountry: String(row.dominant_country),
    dominantTheme: String(row.dominant_theme),
  }));
}

export function saveSnapshot(input: Omit<SnapshotItem, "id">) {
  const latest = db.prepare(`SELECT captured_at FROM snapshots ORDER BY id DESC LIMIT 1`).get() as Record<string, unknown> | undefined;
  if (latest?.captured_at) {
    const last = new Date(String(latest.captured_at)).getTime();
    if (Date.now() - last < 5 * 60 * 1000) {
      return;
    }
  }
  db.prepare(`INSERT INTO snapshots (captured_at, critical_count, high_count, total_items, dominant_country, dominant_theme) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(input.capturedAt, input.criticalCount, input.highCount, input.totalItems, input.dominantCountry, input.dominantTheme);
}

export function seedDefaults() {
  const existing = db.prepare(`SELECT COUNT(*) as count FROM watchlists`).get() as Record<string, unknown>;
  if (Number(existing.count) > 0) return;
  const now = new Date().toISOString();
  const seed = db.prepare(`INSERT INTO watchlists (label, keyword, countries, min_severity, created_at) VALUES (?, ?, ?, ?, ?)`);
  seed.run("Israel / Gaza", "gaza ceasefire border evacuation", JSON.stringify(["Israel", "Gaza", "Palestine"]), "high", now);
  seed.run("Iran", "iran missile sanctions nuclear shipping", JSON.stringify(["Iran"]), "medium", now);
  seed.run("Levant spillover", "lebanon syria militia strike", JSON.stringify(["Lebanon", "Syria"]), "medium", now);
}

seedDefaults();
