import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { isValidLogin } from "@/lib/auth";

describe("isValidLogin", () => {
  const ORIGINAL_EMAIL = process.env.AJEL_ADMIN_EMAIL;
  const ORIGINAL_PASSWORD = process.env.AJEL_ADMIN_PASSWORD;

  beforeEach(() => {
    process.env.AJEL_ADMIN_EMAIL = "admin@test.local";
    process.env.AJEL_ADMIN_PASSWORD = "SecurePass123!";
  });

  afterEach(() => {
    if (ORIGINAL_EMAIL !== undefined) process.env.AJEL_ADMIN_EMAIL = ORIGINAL_EMAIL;
    else delete process.env.AJEL_ADMIN_EMAIL;
    if (ORIGINAL_PASSWORD !== undefined) process.env.AJEL_ADMIN_PASSWORD = ORIGINAL_PASSWORD;
    else delete process.env.AJEL_ADMIN_PASSWORD;
  });

  it("returns true for correct email and password", () => {
    expect(isValidLogin("admin@test.local", "SecurePass123!")).toBe(true);
  });

  it("returns false for wrong password", () => {
    expect(isValidLogin("admin@test.local", "WrongPassword")).toBe(false);
  });

  it("returns false for wrong email", () => {
    expect(isValidLogin("other@test.local", "SecurePass123!")).toBe(false);
  });

  it("returns false for both wrong", () => {
    expect(isValidLogin("bad@bad.com", "bad")).toBe(false);
  });

  it("is case-sensitive for email", () => {
    expect(isValidLogin("Admin@test.local", "SecurePass123!")).toBe(false);
  });

  it("is case-sensitive for password", () => {
    expect(isValidLogin("admin@test.local", "securepass123!")).toBe(false);
  });

  it("falls back to default credentials when env vars are not set", () => {
    delete process.env.AJEL_ADMIN_EMAIL;
    delete process.env.AJEL_ADMIN_PASSWORD;
    expect(isValidLogin("admin@ajel.local", "ChangeThisNow!")).toBe(true);
  });
});
