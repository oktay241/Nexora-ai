type BufferLogPayload = {
  ns: "nexora.buffer.graphql";
  level: "error" | "warn";
  operation: string;
  httpStatus: number;
  errors?: Array<{ message: string; extensions?: unknown }>;
  /** Yanıt gövdesinden kesit — token içermez; yalnızca Buffer dönüşü. */
  responseSnippet?: string;
  at: string;
};

const SNIPPET_MAX = 8000;

function guessOperationName(query: string): string {
  const trimmed = query.trim();
  const m = /^(?:query|mutation|subscription)\s+(\w+)/i.exec(trimmed);
  return m?.[1] ?? "anonymous";
}

export function bufferLogGraphqlIssue(input: {
  query: string;
  httpStatus: number;
  errors?: Array<{ message?: string; extensions?: unknown }>;
  responseText?: string;
}): void {
  const operation = guessOperationName(input.query);
  const errors = (input.errors ?? [])
    .map((e) => ({
      message: typeof e.message === "string" ? e.message : "Buffer bilinmeyen hata",
      ...(e.extensions !== undefined ? { extensions: e.extensions } : {}),
    }))
    .filter((e) => e.message.length > 0);

  const payload: BufferLogPayload = {
    ns: "nexora.buffer.graphql",
    level: errors.length ? "error" : "warn",
    operation,
    httpStatus: input.httpStatus,
    ...(errors.length ? { errors } : {}),
    ...(input.responseText && input.responseText.length
      ? { responseSnippet: input.responseText.slice(0, SNIPPET_MAX) }
      : {}),
    at: new Date().toISOString(),
  };

  console.error(JSON.stringify(payload));
}
