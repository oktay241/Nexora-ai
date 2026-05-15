/** Production log prefixes for observability (Vercel / server logs). */

export type NexoraLogChannel = "META" | "DB" | "PUBLISH";

function format(
  channel: NexoraLogChannel,
  level: "info" | "warn" | "error",
  message: string,
  extra?: Record<string, unknown>,
): string {
  const prefix = `[NEXORA_${channel}]`;
  const base = `${prefix} ${message}`;
  if (extra && Object.keys(extra).length > 0) {
    return `${base} ${JSON.stringify(extra)}`;
  }
  return base;
}

export function logMeta(message: string, extra?: Record<string, unknown>): void {
  console.info(format("META", "info", message, extra));
}

export function logMetaWarn(message: string, extra?: Record<string, unknown>): void {
  console.warn(format("META", "warn", message, extra));
}

export function logMetaError(message: string, extra?: Record<string, unknown>): void {
  console.error(format("META", "error", message, extra));
}

export function logDb(message: string, extra?: Record<string, unknown>): void {
  console.info(format("DB", "info", message, extra));
}

export function logDbWarn(message: string, extra?: Record<string, unknown>): void {
  console.warn(format("DB", "warn", message, extra));
}

export function logDbError(message: string, extra?: Record<string, unknown>): void {
  console.error(format("DB", "error", message, extra));
}

export function logPublish(message: string, extra?: Record<string, unknown>): void {
  console.info(format("PUBLISH", "info", message, extra));
}

export function logPublishWarn(message: string, extra?: Record<string, unknown>): void {
  console.warn(format("PUBLISH", "warn", message, extra));
}

export function logPublishError(message: string, extra?: Record<string, unknown>): void {
  console.error(format("PUBLISH", "error", message, extra));
}
