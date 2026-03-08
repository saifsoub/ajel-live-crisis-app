import { NextResponse } from "next/server";

import { createSession, isValidLogin } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  if (!body.email || !body.password || !isValidLogin(body.email, body.password)) {
    return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
  }
  await createSession(body.email);
  return NextResponse.json({ ok: true });
}
