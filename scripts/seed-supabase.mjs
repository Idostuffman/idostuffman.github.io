#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

const env = { ...process.env };
const envFile = path.join(root, ".env.local");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
if (!env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("! Using the anon key: this only works if you have loosened the write policy. The service_role key is easier.");
}

const data = JSON.parse(readFileSync(path.join(root, "content/site.json"), "utf8"));

const res = await fetch(`${url}/rest/v1/site_content`, {
  method: "POST",
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "content-type": "application/json",
    Prefer: "resolution=merge-duplicates",
  },
  body: JSON.stringify({ id: "main", data, updated_at: new Date().toISOString() }),
});

if (!res.ok) {
  console.error("Seed failed:", res.status, await res.text());
  process.exit(1);
}
console.log("Seeded site_content.main from content/site.json");
