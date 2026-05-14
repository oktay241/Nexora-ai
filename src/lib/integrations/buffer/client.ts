import { bufferLogGraphqlIssue } from "./buffer-log";

const BUFFER_GRAPHQL_URL = "https://api.buffer.com";

export type BufferGraphqlError = { message: string; extensions?: unknown };

export type BufferGraphqlResult<T> = {
  data: T | null;
  errors?: BufferGraphqlError[];
};

export type BufferGraphqlEnvelope = {
  data: unknown;
  errors?: BufferGraphqlError[];
  httpStatus: number;
  responseText: string;
};

/**
 * Buffer GraphQL HTTP istemcisi (tek endpoint, Bearer token).
 * @see https://developers.buffer.com/guides/authentication.html
 */
export async function bufferGraphqlRequest<T>(
  accessToken: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<BufferGraphqlResult<T>> {
  const env = await bufferGraphqlRequestUnknown(accessToken, query, variables);
  return {
    data: (env.data ?? null) as T | null,
    errors: env.errors,
  };
}

/**
 * Ham JSON + HTTP meta — ayrıştırma ve loglama için.
 * GraphQL `errors[]` veya HTTP hata kodunda terminale yapılandırılmış log yazar (token yok).
 */
export async function bufferGraphqlRequestUnknown(
  accessToken: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<BufferGraphqlEnvelope> {
  const res = await fetch(BUFFER_GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(variables && Object.keys(variables).length ? { query, variables } : { query }),
    cache: "no-store",
  });

  const responseText = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(responseText) as Record<string, unknown>;
  } catch {
    bufferLogGraphqlIssue({
      query,
      httpStatus: res.status,
      errors: [{ message: `Buffer API geçersiz JSON (${res.status})` }],
      responseText,
    });
    return { data: null, errors: [{ message: `Buffer API geçersiz JSON yanıtı (${res.status})` }], httpStatus: res.status, responseText };
  }

  const obj = json as {
    data?: unknown;
    errors?: Array<{ message?: string; extensions?: unknown }>;
  };

  const errors = (obj.errors ?? [])
    .map((e) => ({
      message: typeof e.message === "string" ? e.message : "Buffer bilinmeyen hata",
      ...(e.extensions !== undefined ? { extensions: e.extensions } : {}),
    }))
    .filter((e) => e.message.length > 0);

  if (!res.ok) {
    bufferLogGraphqlIssue({
      query,
      httpStatus: res.status,
      errors: errors.length ? errors : [{ message: `Buffer HTTP ${res.status}` }],
      responseText,
    });
    return {
      data: obj.data ?? null,
      errors: errors.length ? errors : [{ message: `Buffer HTTP ${res.status}` }],
      httpStatus: res.status,
      responseText,
    };
  }

  if (errors.length) {
    bufferLogGraphqlIssue({ query, httpStatus: res.status, errors, responseText });
  }

  return {
    data: obj.data ?? null,
    errors: errors.length ? errors : undefined,
    httpStatus: res.status,
    responseText,
  };
}

export function createBufferClient(accessToken: string) {
  return {
    request: <T,>(q: string, vars?: Record<string, unknown>) =>
      bufferGraphqlRequest<T>(accessToken, q, vars),
    requestUnknown: (q: string, vars?: Record<string, unknown>) =>
      bufferGraphqlRequestUnknown(accessToken, q, vars),
  };
}
