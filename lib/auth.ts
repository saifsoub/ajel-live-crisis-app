import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "ajel_session";
const ONE_DAY = 60 * 60 * 24;

function getSecret() {
  return process.env.AJEL_SESSION_SECRET || "ajel-dev-secret-change-me";
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

function encode(payload: Record<string, string>) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(token?: string | null): Record<string, string> | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  if (sign(body) !== signature) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Record<string, string>;
  } catch {
    return null;
  }
}

export async function createSession(email: string) {
  const store = await cookies();
  const expires = new Date(Date.now() + ONE_DAY * 1000).toISOString();
  const token = encode({ email, expires });
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_DAY,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

export async function getSession() {
  const store = await cookies();
  const session = decode(store.get(COOKIE_NAME)?.value);
  if (!session?.expires) return null;
  if (new Date(session.expires).getTime() < Date.now()) return null;
  return session;
}

export function isValidLogin(email: string, password: string) {
  const targetEmail = process.env.AJEL_ADMIN_EMAIL || "admin@ajel.local";
  const targetPassword = process.env.AJEL_ADMIN_PASSWORD || "ChangeThisNow!";
  return email === targetEmail && password === targetPassword;
}
