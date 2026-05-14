/** Sunucu stdout için yapılandırılmış image pipeline logları (Vercel / Docker uyumlu). */
export function logImagePipeline(
  level: "info" | "warn" | "error",
  event: string,
  meta?: Record<string, unknown>,
): void {
  const payload = {
    ns: "nexora.image",
    level,
    event,
    ...meta,
    at: new Date().toISOString(),
  };
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}
