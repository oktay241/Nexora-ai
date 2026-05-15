import { NextResponse } from "next/server";

import { getNexoraSchemaDebugSecret } from "@/lib/env";
import { fetchMetaSchemaReport } from "@/lib/db/meta-schema-report";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * Ops-only: set NEXORA_SCHEMA_DEBUG_SECRET and send header `x-nexora-schema-debug`.
 * Returns tables, missing columns, migration status, Instagram account row count.
 */
export async function GET(request: Request) {
  const secret = getNexoraSchemaDebugSecret();
  const header = request.headers.get("x-nexora-schema-debug");
  if (!secret || header !== secret) {
    return new NextResponse(null, { status: 404 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured on this deployment." },
      { status: 503 },
    );
  }

  const { data, error } = await fetchMetaSchemaReport(admin);
  if (error || !data) {
    return NextResponse.json(
      {
        error: error ?? "schema_report_failed",
        hint:
          "Run supabase/migrations/011_meta_publish_production_consolidated.sql on the database.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    migrationStatus: {
      migration011Applied: data.migration_011_applied,
      schemaOk: data.schema_ok,
    },
    tables: data.tables,
    connectedInstagramAccountsCount: data.connected_instagram_accounts_count,
    checkedAt: data.checked_at,
  });
}
