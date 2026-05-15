/**
 * Static check: backfill UPDATEs on social tables must live only inside dollar-quoted
 * execute bodies ($sql$, etc.), not in the outer migration text (PostgreSQL would plan them).
 */
const fs = require("fs");
const path = require("path");

const file = path.join(
  __dirname,
  "..",
  "supabase",
  "migrations",
  "011_meta_publish_production_consolidated.sql",
);
let sql = fs.readFileSync(file, "utf8");

sql = sql.replace(/\/\*[\s\S]*?\*\//g, "");
sql = sql.replace(/--.*$/gm, "");

function stripDollarTag(s, tag) {
  const re = new RegExp("\\$" + tag + "\\$[\\s\\S]*?\\$" + tag + "\\$", "g");
  return s.replace(re, "");
}

for (const tag of ["sql", "fn", "tr", "cnt"]) {
  sql = stripDollarTag(sql, tag);
}

if (/update\s+public\.connected_social_accounts/i.test(sql)) {
  console.error(
    "[verify-011] FAIL: UPDATE public.connected_social_accounts appears outside guarded execute bodies.",
  );
  process.exit(1);
}

if (/update\s+public\.scheduled_posts/i.test(sql)) {
  console.error(
    "[verify-011] FAIL: UPDATE public.scheduled_posts appears outside guarded execute bodies.",
  );
  process.exit(1);
}

console.log("[verify-011] OK: no unguarded UPDATE on connected_social_accounts / scheduled_posts.");
