import { NextResponse } from "next/server";

import { addWatchlist, deleteWatchlist, getWatchlists } from "@/lib/storage";

export async function GET() {
  return NextResponse.json(getWatchlists());
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    label?: string;
    keyword?: string;
    countries?: string[];
    minSeverity?: "critical" | "high" | "medium" | "low";
  };

  if (!body.label || !body.keyword || !body.minSeverity) {
    return NextResponse.json({ error: "Missing watchlist fields." }, { status: 400 });
  }

  const created = addWatchlist({
    label: body.label,
    keyword: body.keyword,
    countries: body.countries ?? [],
    minSeverity: body.minSeverity,
  });

  return NextResponse.json(created, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  deleteWatchlist(id);
  return NextResponse.json({ ok: true });
}
