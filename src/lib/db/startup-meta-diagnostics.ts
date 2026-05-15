import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchMetaSchemaReport, humanizeSchemaReport } from "@/lib/db/meta-schema-report";
import { logDb, logDbWarn } from "@/lib/logging/nexora-log";

/**
 * Called from instrumentation on Node startup. Non-fatal: logs diagnostics only.
 */
export async function runMetaPublishingStartupDiagnostics(): Promise<void> {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    logDbWarn(
      "Startup schema diagnostics skipped: set SUPABASE_SERVICE_ROLE_KEY to verify Meta publishing tables against migration 011.",
    );
    return;
  }

  const { data, error } = await fetchMetaSchemaReport(admin);
  if (error || !data) {
    logDbWarn("Could not load nexora_meta_schema_report RPC.", {
      hint: "Apply migration 011_meta_publish_production_consolidated.sql so the RPC exists.",
      error: error ?? "no_data",
    });
    return;
  }

  if (!data.schema_ok) {
    for (const line of humanizeSchemaReport(data)) {
      logDbWarn(line);
    }
    return;
  }

  logDb("Meta publishing schema aligned with migration 011.", {
    connectedInstagramAccounts: data.connected_instagram_accounts_count,
  });
}
