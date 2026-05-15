import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { saveInstagramConnectedAccount } from "@/lib/integrations/meta/save-connected-account";
import {
  exchangeMetaAuthorizationCode,
  fetchMetaUserProfile,
  META_OAUTH_STATE_COOKIE,
} from "@/lib/integrations/meta/oauth";
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

  const profile = await fetchMetaUserProfile(tokenResult.accessToken);
  if (profile.error) {
    return NextResponse.redirect(
      new URL(
        `/dashboard/social?err=${encodeURIComponent(profile.error.slice(0, 120))}`,
        reqUrl.origin,
      ),
    );
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login?next=/dashboard/social", reqUrl.origin));
  }

  const save = await saveInstagramConnectedAccount({
    supabase,
    userId: user.id,
    instagram: profile.instagram,
    metaUserName: profile.me?.name ?? null,
  });
  if (save.error) {
    return NextResponse.redirect(
      new URL(`/dashboard/social?err=${encodeURIComponent(save.error.slice(0, 120))}`, reqUrl.origin),
    );
  }

  return NextResponse.redirect(new URL("/dashboard/social?connected=instagram", reqUrl.origin));
}
