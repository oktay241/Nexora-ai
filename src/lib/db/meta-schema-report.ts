import type { SupabaseClient } from "@supabase/supabase-js";

function parseSchemaCheckedAt(v: unknown): string {
  if (typeof v === "string") return v;
  if (typeof v === "number" && Number.isFinite(v)) return new Date(v).toISOString();
  return new Date().toISOString();
}

export type MetaSchemaTableReport = {
  exists: boolean;
  column_count: number;
  missing_columns: string[];
};

export type NexoraMetaSchemaReport = {
  migration_011_applied: boolean;
  schema_ok: boolean;
  tables: Record<string, MetaSchemaTableReport>;
  connected_instagram_accounts_count: number;
  checked_at: string;
};

export async function fetchMetaSchemaReport(
  admin: SupabaseClient,
): Promise<{ data: NexoraMetaSchemaReport | null; error: string | null }> {
  const { data, error } = await admin.rpc("nexora_meta_schema_report");
  if (error) {
    return { data: null, error: error.message };
  }
  if (!data || typeof data !== "object") {
    return { data: null, error: "Empty schema report." };
  }
  const raw = data as Record<string, unknown>;
  const tablesRaw = raw.tables;
  const tables: Record<string, MetaSchemaTableReport> = {};
  if (tablesRaw && typeof tablesRaw === "object" && !Array.isArray(tablesRaw)) {
    for (const [k, v] of Object.entries(tablesRaw as Record<string, unknown>)) {
      if (!v || typeof v !== "object" || Array.isArray(v)) continue;
      const t = v as Record<string, unknown>;
      const missing = t.missing_columns;
      tables[k] = {
        exists: Boolean(t.exists),
        column_count: typeof t.column_count === "number" ? t.column_count : 0,
        missing_columns: Array.isArray(missing)
          ? missing.map((x) => String(x))
          : [],
      };
    }
  }
  const report: NexoraMetaSchemaReport = {
    migration_011_applied: Boolean(raw.migration_011_applied),
    schema_ok: Boolean(raw.schema_ok),
    tables,
    connected_instagram_accounts_count:
      typeof raw.connected_instagram_accounts_count === "number"
        ? raw.connected_instagram_accounts_count
        : 0,
    checked_at: parseSchemaCheckedAt(raw.checked_at),
  };
  return { data: report, error: null };
}

export function humanizeSchemaReport(report: NexoraMetaSchemaReport): string[] {
  const lines: string[] = [];
  if (!report.schema_ok) {
    lines.push(
      "Meta publishing schema is not fully aligned: run Supabase migration 011_meta_publish_production_consolidated.sql (or full migration chain).",
    );
  }
  if (!report.migration_011_applied) {
    lines.push(
      "Migration 011 is not recorded in nexora_schema_migrations — production database may be missing the consolidated patch.",
    );
  }
  for (const [name, t] of Object.entries(report.tables)) {
    if (!t.exists) {
      lines.push(`Table missing: ${name}`);
      continue;
    }
    if (t.missing_columns.length > 0) {
      lines.push(`Table ${name} missing columns: ${t.missing_columns.join(", ")}`);
    }
  }
  if (lines.length === 0) {
    lines.push("Meta publishing schema looks aligned.");
  }
  return lines;
}
