import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { buildPublishConnectAuthorizeUrl } from "@/lib/social-providers/oauth";

const OAUTH_COOKIE = "nexora_publish_oauth";

export async function GET(request: Request) {
  const reqUrl = new URL(request.url);
  const platform = reqUrl.searchParams.get("platform");
  if (platform !== "instagram" && platform !== "tiktok") {
    return NextResponse.redirect(new URL("/dashboard/connections?err=invalid_platform", reqUrl.origin));
  }

  const nonce = crypto.randomUUID();
  const cookieVal = `${platform}:${nonce}`;
  const jar = await cookies();
  jar.set(OAUTH_COOKIE, cookieVal, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  const authorize = buildPublishConnectAuthorizeUrl({ platform, state: nonce });
  if (!authorize) {
    return NextResponse.redirect(
      new URL(`/dashboard/connections?setup=1&platform=${encodeURIComponent(platform)}`, reqUrl.origin),
    );
  }

  return NextResponse.redirect(authorize);
}
