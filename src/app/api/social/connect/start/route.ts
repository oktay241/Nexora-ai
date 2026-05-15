import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  buildMetaAuthorizeUrl,
  isMetaOAuthConfigured,
  META_OAUTH_STATE_COOKIE,
} from "@/lib/integrations/meta/oauth";

export async function GET(request: Request) {
  const reqUrl = new URL(request.url);
  const platform = reqUrl.searchParams.get("platform");

  if (platform !== "instagram") {
    return NextResponse.redirect(
      new URL("/dashboard/social?err=platform_not_supported", reqUrl.origin),
    );
  }

  if (!isMetaOAuthConfigured()) {
    return NextResponse.redirect(new URL("/dashboard/social?setup=1", reqUrl.origin));
  }

  const nonce = crypto.randomUUID();
  const state = `instagram:${nonce}`;
  const jar = await cookies();
  jar.set(META_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  const authorize = buildMetaAuthorizeUrl({ state });
  if (!authorize) {
    return NextResponse.redirect(new URL("/dashboard/social?setup=1", reqUrl.origin));
  }

  return NextResponse.redirect(authorize);
}
