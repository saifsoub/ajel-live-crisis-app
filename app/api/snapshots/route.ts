import { NextResponse } from "next/server";

import { getSnapshots } from "@/lib/storage";

export async function GET() {
  return NextResponse.json(getSnapshots());
}
