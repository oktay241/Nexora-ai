import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const OAUTH_COOKIE = "nexora_publish_oauth";

export async function GET(request: Request) {
  const reqUrl = new URL(request.url);
  const jar = await cookies();
  const expected = jar.get(OAUTH_COOKIE)?.value;

  const oauthError = reqUrl.searchParams.get("error");
  if (oauthError) {
    jar.delete(OAUTH_COOKIE);
    return NextResponse.redirect(
      new URL(`/dashboard/connections?err=${encodeURIComponent(oauthError)}`, reqUrl.origin),
    );
  }

  const state = reqUrl.searchParams.get("state");
  if (!state || !expected || state !== expected) {
    return NextResponse.redirect(new URL("/dashboard/connections?err=state", reqUrl.origin));
  }

  jar.delete(OAUTH_COOKIE);

  const platform = state.split(":")[0] ?? "";

  const code = reqUrl.searchParams.get("code");
  const secret = process.env.NEXORA_PUBLISH_OAUTH_CLIENT_SECRET?.trim();
  const clientId = process.env.NEXORA_PUBLISH_OAUTH_CLIENT_ID?.trim();
  const redirectUri = process.env.NEXORA_PUBLISH_OAUTH_REDIRECT_URI?.trim();

  if (code && secret && clientId && redirectUri) {
    try {
      const tokenUrl =
        process.env.NEXORA_PUBLISH_OAUTH_TOKEN_URL?.trim() || "https://buffer.com/oauth2/token";
      const body = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: secret,
        redirect_uri: redirectUri,
      });
      const res = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      if (!res.ok) {
        return NextResponse.redirect(new URL("/dashboard/connections?err=token_exchange", reqUrl.origin));
      }
      // Çok kiracılı üretimde access_token burada güvenli şekilde saklanır; şimdilik yalnızca Nexora dönüşü.
    } catch {
      return NextResponse.redirect(new URL("/dashboard/connections?err=token_exchange", reqUrl.origin));
    }
  }

  return NextResponse.redirect(
    new URL(`/dashboard/connections?linked=1&platform=${encodeURIComponent(platform)}`, reqUrl.origin),
  );
}
