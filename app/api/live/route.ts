import { NextResponse } from "next/server";

import { buildBrief } from "@/lib/live";

export const dynamic = "force-dynamic";
export const revalidate = 180;

export async function GET() {
  const payload = await buildBrief();
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "s-maxage=180, stale-while-revalidate=60" },
  });
}
