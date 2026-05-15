import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { discoverInstagramBusinessAccount } from "@/lib/integrations/meta/instagram-discovery";
import { exchangeMetaLongLivedUserToken } from "@/lib/integrations/meta/long-lived-token";
import { exchangeMetaAuthorizationCode, META_OAUTH_STATE_COOKIE } from "@/lib/integrations/meta/oauth";
import { persistInstagramSocialAccount } from "@/lib/integrations/meta/save-connected-social-account";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const reqUrl = new URL(request.url);
  const jar = await cookies();
  const expectedState = jar.get(META_OAUTH_STATE_COOKIE)?.value;

  const clearState = () => jar.delete(META_OAUTH_STATE_COOKIE);

  const oauthError = reqUrl.searchParams.get("error");
  if (oauthError) {
    clearState();
    return NextResponse.redirect(
      new URL(`/dashboard/social?err=${encodeURIComponent(oauthError)}`, reqUrl.origin),
    );
  }

  const state = reqUrl.searchParams.get("state");
  if (!state || !expectedState || state !== expectedState) {
    clearState();
    return NextResponse.redirect(new URL("/dashboard/social?err=state", reqUrl.origin));
  }

  clearState();

  const code = reqUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/dashboard/social?err=missing_code", reqUrl.origin));
  }

  const tokenResult = await exchangeMetaAuthorizationCode({ code });
  if (!tokenResult.ok) {
    return NextResponse.redirect(
      new URL(
        `/dashboard/social?err=${encodeURIComponent(tokenResult.error.slice(0, 120))}`,
        reqUrl.origin,
      ),
    );
  }

  const longLived = await exchangeMetaLongLivedUserToken(tokenResult.accessToken);
  const accessToken = longLived.ok ? longLived.token.accessToken : tokenResult.accessToken;
  const tokenType = longLived.ok ? longLived.token.tokenType : (tokenResult.raw.token_type ?? "Bearer");
  const expiresIn = longLived.ok ? longLived.token.expiresIn : (tokenResult.raw.expires_in ?? 3600);

  const discovery = await discoverInstagramBusinessAccount(accessToken);
  if (discovery.error) {
    return NextResponse.redirect(
      new URL(
        `/dashboard/social?err=${encodeURIComponent(discovery.error.slice(0, 120))}`,
        reqUrl.origin,
      ),
    );
  }

  if (!discovery.account) {
    return NextResponse.redirect(
      new URL("/dashboard/social?err=no_instagram_business", reqUrl.origin),
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login?next=/dashboard/social", reqUrl.origin));
  }

  const save = await persistInstagramSocialAccount({
    supabase,
    userId: user.id,
    discovered: discovery.account,
    accessToken,
    tokenType,
    expiresIn,
  });
  if (save.error) {
    return NextResponse.redirect(
      new URL(`/dashboard/social?err=${encodeURIComponent(save.error.slice(0, 120))}`, reqUrl.origin),
    );
  }

  return NextResponse.redirect(new URL("/dashboard/social?connected=instagram", reqUrl.origin));
}
