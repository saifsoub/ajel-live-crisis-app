import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Simple in-memory rate limiter
// NOTE: This works in single-process environments (dev, single-node). For
// production deployments with multiple instances, replace with a distributed
// store such as Upstash Redis (@upstash/ratelimit).
// ---------------------------------------------------------------------------

/** Sliding-window counter per IP address. */
const ipCounters = new Map<string, { count: number; resetAt: number }>();

/**
 * Returns true if the request should be blocked (rate limit exceeded).
 * @param ip     - Client IP address.
 * @param limit  - Max requests allowed within the window.
 * @param window - Window duration in milliseconds.
 */
function isRateLimited(ip: string, limit: number, window: number): boolean {
  const now = Date.now();
  const entry = ipCounters.get(ip);

  if (!entry || now >= entry.resetAt) {
    ipCounters.set(ip, { count: 1, resetAt: now + window });
    return false;
  }

  entry.count += 1;
  if (entry.count > limit) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

const LOGIN_RATE_LIMIT = 10;           // max requests
const LOGIN_RATE_WINDOW = 60 * 1000;  // per minute

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ── Rate-limit the login endpoint ─────────────────────────────────────────
  if (pathname === "/api/auth/login" && request.method === "POST") {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    if (isRateLimited(ip, LOGIN_RATE_LIMIT, LOGIN_RATE_WINDOW)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }
  }

  // ── Protect dashboard routes ───────────────────────────────────────────────
  const protectedPaths = ["/dashboard"];
  const isProtected = protectedPaths.some((prefix) => pathname.startsWith(prefix));
  if (!isProtected) return NextResponse.next();

  const hasSession = Boolean(request.cookies.get("ajel_session")?.value);
  if (hasSession) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/auth/login"],
};

