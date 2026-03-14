import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { fetchGdeltHeadlines, fetchReliefWebReports, fetchNewsApiHeadlines } from "@/lib/sources";

// ---------------------------------------------------------------------------
// fetchGdeltHeadlines
// ---------------------------------------------------------------------------

describe("fetchGdeltHeadlines", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns HeadlineItems when GDELT responds with articles", async () => {
    const mockArticles = [
      {
        url: "https://example.com/1",
        url_mobile: "https://m.example.com/1",
        title: "Israel launches airstrike on Gaza",
        seendate: "20240101T120000Z",
        domain: "example.com",
        sourcecountry: "Israel",
        language: "en",
      },
      {
        url: "https://example.com/2",
        title: "Iran missile threat escalates",
        seendate: "20240101T110000Z",
        domain: "news.example.com",
        sourcecountry: "Iran",
        language: "en",
      },
    ];

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ articles: mockArticles }),
    });

    const items = await fetchGdeltHeadlines();
    expect(items.length).toBe(2);
    expect(items[0].title).toBe("Israel launches airstrike on Gaza");
    expect(items[0].url).toBe("https://m.example.com/1");
    expect(items[0].source).toBe("example.com");
    expect(["critical", "high", "medium", "low"]).toContain(items[0].severity);
    expect(typeof items[0].score).toBe("number");
  });

  it("throws when GDELT responds with a non-ok status", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 503,
    });

    await expect(fetchGdeltHeadlines()).rejects.toThrow("GDELT request failed: 503");
  });

  it("returns empty array when articles field is missing", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const items = await fetchGdeltHeadlines();
    expect(items).toEqual([]);
  });

  it("filters out articles without title or url", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        articles: [
          { url: "https://example.com/1" }, // missing title
          { title: "Some headline" }, // missing url
          { url: "https://example.com/3", title: "Valid headline" },
        ],
      }),
    });

    const items = await fetchGdeltHeadlines();
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Valid headline");
  });
});

// ---------------------------------------------------------------------------
// fetchReliefWebReports
// ---------------------------------------------------------------------------

describe("fetchReliefWebReports", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns HeadlineItems for valid ReliefWeb data", async () => {
    const mockData = {
      data: [
        {
          id: "123",
          href: "https://reliefweb.int/report/123",
          fields: {
            title: "Humanitarian Crisis in Gaza Worsens",
            date: { created: "2024-01-01T12:00:00Z" },
            source: [{ shortname: "OCHA" }],
            "body-html": "<p>Situation report...</p>",
            country: [{ name: "Occupied Palestinian Territory" }],
          },
        },
      ],
    };

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    const items = await fetchReliefWebReports("ajel-test");
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Humanitarian Crisis in Gaza Worsens");
    expect(items[0].source).toBe("OCHA");
    expect(items[0].url).toBe("https://reliefweb.int/report/123");
  });

  it("throws when ReliefWeb responds with a non-ok status", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 429,
    });

    await expect(fetchReliefWebReports("ajel-test")).rejects.toThrow("ReliefWeb request failed: 429");
  });

  it("returns empty array when data field is missing", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const items = await fetchReliefWebReports("ajel-test");
    expect(items).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// fetchNewsApiHeadlines
// ---------------------------------------------------------------------------

describe("fetchNewsApiHeadlines", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns empty array when no API key is provided", async () => {
    const items = await fetchNewsApiHeadlines(undefined);
    expect(items).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns HeadlineItems for valid NewsAPI data", async () => {
    const mockArticles = {
      articles: [
        {
          url: "https://news.example.com/1",
          title: "Iran nuclear talks stall",
          publishedAt: "2024-01-01T10:00:00Z",
          description: "Negotiations have broken down.",
          source: { name: "Reuters" },
        },
      ],
    };

    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockArticles,
    });

    const items = await fetchNewsApiHeadlines("test-api-key");
    expect(items).toHaveLength(1);
    expect(items[0].source).toBe("Reuters");
    expect(items[0].summary).toBe("Negotiations have broken down.");
  });

  it("throws when NewsAPI responds with a non-ok status", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    await expect(fetchNewsApiHeadlines("bad-key")).rejects.toThrow("NewsAPI request failed: 401");
  });
});
