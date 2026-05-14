/**
 * Sunucu tarafında kullanılacak ortam değişkenleri.
 * OPENAI_API_KEY yalnızca Server Actions / Route Handlers içinde okunmalıdır.
 */
export function getPublicSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Eksik ortam: NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlı olmalıdır.",
    );
  }
  return { url, anonKey };
}

export function getOpenAIApiKey(): string | null {
  const key = process.env.OPENAI_API_KEY;
  return key && key.length > 0 ? key : null;
}

export function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

/** OpenAI Images API — varsayılan gpt-image-1 (base64 yanıt). dall-e-3 desteklenmez. */
export function getOpenAIImageModel(): string {
  const raw = (process.env.OPENAI_IMAGE_MODEL ?? "").trim();
  if (!raw || raw === "dall-e-3") {
    if (raw === "dall-e-3") {
      console.warn(
        JSON.stringify({
          ns: "nexora.image",
          level: "warn",
          event: "deprecated_image_model",
          message: "OPENAI_IMAGE_MODEL=dall-e-3 removed; using gpt-image-1",
          at: new Date().toISOString(),
        }),
      );
    }
    return "gpt-image-1";
  }
  return raw;
}

/** gpt-image-* için kalite (hd yalnızca dall-e-3 içindi; kullanma). */
export function getOpenAIImageQuality(): "low" | "medium" | "high" | "auto" {
  const q = (process.env.OPENAI_IMAGE_QUALITY ?? "").trim().toLowerCase();
  if (q === "low" || q === "medium" || q === "high" || q === "auto") return q;
  return "high";
}

/** Buffer GraphQL API — yalnızca sunucu tarafı (Server Actions / Route Handlers). */
export function getBufferAccessToken(): string | null {
  const t = process.env.BUFFER_ACCESS_TOKEN?.trim();
  return t && t.length > 0 ? t : null;
}
