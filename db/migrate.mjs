// Applies db/schema.sql to the database at DATABASE_URL.
//
// Used instead of requiring a local `psql` install so `npm run db:migrate`
// works the same way on any machine that already has Node + this repo's
// dependencies installed.
//
// Usage:
//   npm run db:migrate

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Client } from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local without adding a dependency on `dotenv`.
function loadEnvLocal() {
  const envPath = path.resolve(__dirname, "..", ".env.local");
  let contents;
  try {
    contents = readFileSync(envPath, "utf8");
  } catch {
    return;
  }
  for (const line of contents.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error(
    "DATABASE_URL is not set. Add it to .env.local (see .env.example) and re-run."
  );
  process.exit(1);
}

const sql = readFileSync(path.resolve(__dirname, "schema.sql"), "utf8");

const client = new Client({ connectionString });

try {
  await client.connect();
  console.log("Connected. Applying db/schema.sql ...");
  await client.query(sql);
  console.log("Schema applied successfully.");
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
