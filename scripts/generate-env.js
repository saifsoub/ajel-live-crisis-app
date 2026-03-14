#!/usr/bin/env node
/**
 * scripts/generate-env.js
 *
 * Generates a .env.local file with cryptographically random secrets.
 * Run once before starting development:
 *
 *   node scripts/generate-env.js
 *
 * Existing values are preserved – only missing variables are added.
 */

const { randomBytes } = require("crypto");
const { existsSync, readFileSync, writeFileSync } = require("fs");
const { join } = require("path");

const TARGET = join(process.cwd(), ".env.local");
const EXAMPLE = join(process.cwd(), ".env.example");

/** Generate a URL-safe base64 random string of `bytes` random bytes. */
function randomSecret(bytes = 48) {
  return randomBytes(bytes).toString("base64url");
}

/** Parse an env file into a plain object. */
function parseEnvFile(content) {
  const result = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    result[key] = value;
  }
  return result;
}

// Load the example file as the template.
if (!existsSync(EXAMPLE)) {
  console.error("❌  .env.example not found – cannot generate .env.local");
  process.exit(1);
}

const exampleContent = readFileSync(EXAMPLE, "utf8");

// Load existing .env.local if present so we don't overwrite secrets.
const existing = existsSync(TARGET) ? parseEnvFile(readFileSync(TARGET, "utf8")) : {};

// Build the new content, replacing placeholder values with generated secrets.
const GENERATED_MARKER = "replace-with-a-long-random-secret";
const DEFAULT_PASSWORD = "ChangeThisNow!";

const lines = exampleContent.split("\n").map((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return line;

  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) return line;

  const key = trimmed.slice(0, eqIdx).trim();
  const currentValue = trimmed.slice(eqIdx + 1).trim();

  // If the user already has this key set, preserve it.
  if (existing[key] !== undefined && existing[key] !== "") {
    return `${key}=${existing[key]}`;
  }

  // Auto-generate the session secret.
  if (key === "AJEL_SESSION_SECRET" && currentValue === GENERATED_MARKER) {
    const secret = randomSecret();
    console.log(`✅  ${key} → generated (${secret.length} chars)`);
    return `${key}=${secret}`;
  }

  // Warn about insecure default password.
  if (key === "AJEL_ADMIN_PASSWORD" && currentValue === DEFAULT_PASSWORD) {
    const generated = randomSecret(16);
    console.log(`✅  ${key} → generated: ${generated}`);
    console.log("    ⚠️  Save this password – it won't be shown again.");
    return `${key}=${generated}`;
  }

  return line;
});

writeFileSync(TARGET, lines.join("\n"), "utf8");
console.log(`\n📄  Written to ${TARGET}`);
console.log("    Run  npm run dev  to start the app.\n");
