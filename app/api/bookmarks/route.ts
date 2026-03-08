import { NextResponse } from "next/server";

import { addBookmark, deleteBookmark, getBookmarks } from "@/lib/storage";

export async function GET() {
  return NextResponse.json(getBookmarks());
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    headlineId?: string;
    title?: string;
    url?: string;
    note?: string;
    severity?: "critical" | "high" | "medium" | "low";
    source?: string;
  };

  if (!body.headlineId || !body.title || !body.url || !body.severity || !body.source) {
    return NextResponse.json({ error: "Missing bookmark fields." }, { status: 400 });
  }

  const created = addBookmark({
    headlineId: body.headlineId,
    title: body.title,
    url: body.url,
    note: body.note || "",
    severity: body.severity,
    source: body.source,
  });

  return NextResponse.json(created, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  deleteBookmark(id);
  return NextResponse.json({ ok: true });
}
