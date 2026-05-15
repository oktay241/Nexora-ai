import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { discoverInstagramBusinessAccount } from "@/lib/integrations/meta/instagram-discovery";
import { exchangeMetaLongLivedUserToken } from "@/lib/integrations/meta/long-lived-token";
import { exchangeMetaAuthorizationCode, META_OAUTH_STATE_COOKIE } from "@/lib/integrations/meta/oauth";
import { verifyInstagramPostConnect } from "@/lib/integrations/meta/post-connect-verification";
import { persistInstagramSocialAccount } from "@/lib/integrations/meta/save-connected-social-account";
import { logMetaError } from "@/lib/logging/nexora-log";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function redirectSocial(
  origin: string,
  query: Record<string, string>,
): NextResponse {
  const u = new URL("/dashboard/social", origin);
  for (const [k, v] of Object.entries(query)) {
    if (v) u.searchParams.set(k, v);
  }
  return NextResponse.redirect(u);
}

export async function GET(request: Request) {
  const reqUrl = new URL(request.url);

  try {
    const jar = await cookies();
    const expectedState = jar.get(META_OAUTH_STATE_COOKIE)?.value;

    const clearState = () => jar.delete(META_OAUTH_STATE_COOKIE);

    const oauthError = reqUrl.searchParams.get("error");
    if (oauthError) {
      clearState();
      return redirectSocial(reqUrl.origin, {
        err: oauthError.slice(0, 200),
        code: "oauth_denied",
      });
    }

    const state = reqUrl.searchParams.get("state");
    if (!state || !expectedState || state !== expectedState) {
      clearState();
      return redirectSocial(reqUrl.origin, { err: "state", code: "oauth_state" });
    }

    clearState();

    const code = reqUrl.searchParams.get("code");
    if (!code) {
      return redirectSocial(reqUrl.origin, { err: "missing_code", code: "oauth_code" });
    }

    const tokenResult = await exchangeMetaAuthorizationCode({ code });
    if (!tokenResult.ok) {
      return redirectSocial(reqUrl.origin, {
        err: tokenResult.error.slice(0, 200),
        code: "token_exchange",
      });
    }

    const longLived = await exchangeMetaLongLivedUserToken(tokenResult.accessToken);
    const accessToken = longLived.ok ? longLived.token.accessToken : tokenResult.accessToken;
    const tokenType = longLived.ok
      ? longLived.token.tokenType
      : (tokenResult.raw.token_type ?? "Bearer");
    const expiresIn = longLived.ok
      ? longLived.token.expiresIn
      : (tokenResult.raw.expires_in ?? 3600);

    const discovery = await discoverInstagramBusinessAccount(accessToken);
    if (discovery.error) {
      return redirectSocial(reqUrl.origin, {
        err: discovery.error.slice(0, 200),
        code: "discovery",
      });
    }

    if (!discovery.account) {
      return redirectSocial(reqUrl.origin, {
        err: "no_instagram_business",
        code: "no_ig_business",
      });
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

    if (!save.ok) {
      return redirectSocial(reqUrl.origin, {
        err: save.message.slice(0, 200),
        code: save.code,
      });
    }

    await verifyInstagramPostConnect({
      accessToken,
      instagramBusinessId: discovery.account.instagramBusinessId,
      metaPageId: discovery.account.metaPageId,
      accountType: discovery.account.accountType,
    });

    return redirectSocial(reqUrl.origin, { connected: "instagram" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "callback_failed";
    logMetaError("oauth_callback_unhandled", { message });
    return redirectSocial(reqUrl.origin, {
      err: message.slice(0, 200),
      code: "internal",
    });
  }
}
