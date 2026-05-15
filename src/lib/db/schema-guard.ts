/**
 * Meta / Instagram publishing — schema introspection helpers (see migration 011).
 * Runtime checks use `nexora_meta_schema_report` RPC (service_role).
 */

export {
  fetchMetaSchemaReport,
  humanizeSchemaReport,
  type MetaSchemaTableReport,
  type NexoraMetaSchemaReport,
} from "@/lib/db/meta-schema-report";
