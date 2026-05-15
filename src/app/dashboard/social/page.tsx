import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Instagram, Sparkles } from "lucide-react";

import { ConnectPlatformButtons } from "@/components/dashboard/connect-platform-buttons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listConnectedAccounts } from "@/lib/data/dashboard";
import { isMetaOAuthConfigured } from "@/lib/integrations/meta/oauth";
import { getUserProfile } from "@/lib/data/user";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sosyal bağlantılar",
  description: "Instagram ve diğer platformları Nexora AI ile bağlayın.",
};

type Search = Record<string, string | string[] | undefined>;

function first(q: Search, key: string): string | undefined {
  const v = q[key];
  if (Array.isArray(v)) return v[0];
  return v;
}

export default async function SocialConnectionsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const profile = await getUserProfile();
  if (!profile) redirect("/login?next=/dashboard/social");

  const q = await searchParams;
  const connected = first(q, "connected");
  const setup = first(q, "setup") === "1";
  const err = first(q, "err");

  const accounts = await listConnectedAccounts();
  const instagram = accounts.find((a) => a.platform === "instagram");
  const metaReady = isMetaOAuthConfigured();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Sosyal bağlantılar
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Instagram hesabınızı Meta OAuth ile güvenli şekilde bağlayın.
        </p>
      </div>

      {connected === "instagram" ? (
        <p className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          Instagram hesabınız başarıyla bağlandı.
          {instagram?.handle ? (
            <>
              {" "}
              Kullanıcı: <span className="font-medium">@{instagram.handle}</span>
            </>
          ) : null}
        </p>
      ) : null}

      {setup ? (
        <p className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Meta OAuth yapılandırması eksik. <code className="text-xs">META_APP_ID</code>,{" "}
          <code className="text-xs">META_APP_SECRET</code> ve{" "}
          <code className="text-xs">NEXORA_PUBLISH_OAUTH_REDIRECT_URI</code> tanımlayın.
        </p>
      ) : null}

      {err ? (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          Bağlantı tamamlanamadı ({err}). Tekrar deneyin.
        </p>
      ) : null}

      <Card className="border-white/[0.08] bg-gradient-to-br from-pink-950/25 via-black/45 to-violet-950/20 shadow-inner-glow">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="flex items-center gap-2 font-display text-lg tracking-tight">
              <Instagram className="h-5 w-5 text-pink-300" />
              Instagram
            </CardTitle>
            <Badge
              variant="outline"
              className={
                instagram?.status === "connected"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                  : "border-white/15 text-muted-foreground"
              }
            >
              {instagram?.status === "connected" ? "Bağlı" : "Bağlı değil"}
            </Badge>
            <Badge variant="outline" className="border-white/15 text-[10px]">
              {metaReady ? "Meta OAuth hazır" : "Kurulum gerekli"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {instagram?.handle ? (
            <p className="text-sm text-muted-foreground">
              Bağlı hesap: <span className="font-medium text-foreground">@{instagram.handle}</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Meta üzerinden Instagram Business / Creator hesabınızı bağlayın.
            </p>
          )}
          <ConnectPlatformButtons />
        </CardContent>
      </Card>

      <Card className="border-white/[0.08] bg-white/[0.02]">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-violet-300" />
            <p className="text-sm text-muted-foreground">Genel bakış ve AI operasyon merkezi</p>
          </div>
          <Button asChild variant="outline" size="sm" className="border-white/10">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}