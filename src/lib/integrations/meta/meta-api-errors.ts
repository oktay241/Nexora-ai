export type MetaApiErrorKind =
  | "oauth"
  | "invalid_token"
  | "permission"
  | "rate_limit"
  | "unknown";

export type NormalizedMetaApiError = {
  kind: MetaApiErrorKind;
  message: string;
  code: number | null;
  type: string | null;
  raw: string;
};

type MetaGraphErrorBody = {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};

export function parseMetaGraphErrorBody(raw: string): MetaGraphErrorBody | null {
  try {
    return JSON.parse(raw) as MetaGraphErrorBody;
  } catch {
    return null;
  }
}

export function normalizeMetaApiError(input: {
  httpStatus: number;
  body: string;
}): NormalizedMetaApiError {
  const parsed = parseMetaGraphErrorBody(input.body);
  const err = parsed?.error;
  const message = err?.message?.trim() || input.body.slice(0, 500) || `Meta API HTTP ${input.httpStatus}`;
  const type = err?.type?.trim() ?? null;
  const code = typeof err?.code === "number" ? err.code : null;

  let kind: MetaApiErrorKind = "unknown";
  const lowerType = (type ?? "").toLowerCase();
  const lowerMsg = message.toLowerCase();

  if (lowerType.includes("oauthexception") || code === 190 || code === 102) {
    kind = code === 190 || lowerMsg.includes("expired") || lowerMsg.includes("invalid token")
      ? "invalid_token"
      : "oauth";
  } else if (
    code === 10 ||
    code === 200 ||
    code === 294 ||
    lowerMsg.includes("permission") ||
    lowerMsg.includes("does not have")
  ) {
    kind = "permission";
  } else if (
    code === 4 ||
    code === 17 ||
    code === 32 ||
    code === 613 ||
    lowerMsg.includes("rate limit") ||
    lowerMsg.includes("too many")
  ) {
    kind = "rate_limit";
  }

  return { kind, message, code, type, raw: input.body.slice(0, 2000) };
}

export function metaErrorUserMessage(err: NormalizedMetaApiError): string {
  switch (err.kind) {
    case "invalid_token":
      return "Instagram bağlantısı süresi doldu veya geçersiz. Lütfen hesabı yeniden bağlayın.";
    case "oauth":
      return "Meta kimlik doğrulama hatası. Hesabı yeniden bağlamayı deneyin.";
    case "permission":
      return "Instagram yayın izni eksik. Uygulama izinlerini ve Professional hesabı kontrol edin.";
    case "rate_limit":
      return "Meta API hız sınırına ulaşıldı. Bir süre sonra tekrar deneyin.";
    default:
      return err.message;
  }
}
