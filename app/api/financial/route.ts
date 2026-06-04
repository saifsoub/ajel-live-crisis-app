import { NextResponse } from "next/server";
import { buildFinancialBrief } from "@/lib/financial-monitor";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export async function GET() {
  const payload = await buildFinancialBrief();
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" },
  });
}
