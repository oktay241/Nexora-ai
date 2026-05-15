import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Instagram, Sparkles } from "lucide-react";

import { ConnectPlatformButtons } from "@/components/dashboard/connect-platform-buttons";
import { InstagramTestPublishButton } from "@/components/dashboard/instagram-test-publish-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadInstagramSocialDashboardMeta, getInstagramBusinessId } from "@/lib/data/social-accounts";
import { isMetaOAuthConfigured } from "@/lib/integrations/meta/oauth";
import { getUserProfile } from "@/lib/data/user";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sosyal bağlantılar",
  description: "Instagram ve Nexora AI otonom yayın.",
};

type Search = Record<string, string | string[] | undefined>;

function first(q: Search, key: string): string | undefined {
  const v = q[key];
  if (Array.isArray(v)) return v[0];
  return v;
}

function formatDt(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso),
  );
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

  const meta = await loadInstagramSocialDashboardMeta(profile.usage_mode);
  const metaReady = isMetaOAuthConfigured();
  const ig = meta.account;
  const connectedIg = Boolean(ig && getInstagramBusinessId(ig));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Sosyal bağlantılar
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Instagram hesabınızı Meta OAuth ile bağlayın; Nexora AI görsel üretir, caption yazar ve
          otonom modda yayınlar.
        </p>
      </div>

      {connected === "instagram" ? (
        <p className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          Instagram hesabınız başarıyla bağlandı.
          {ig?.username ? (
            <>
              {" "}
              Kullanıcı: <span className="font-medium">@{ig.username}</span>
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

      {connectedIg && !meta.professionalAccount ? (
        <Card className="border-amber-500/25 bg-amber-500/10">
          <CardContent className="p-4 text-sm text-amber-100">
            Instagram Professional account required for AI autopilot publishing.
          </CardContent>
        </Card>
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
                connectedIg
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                  : "border-white/15 text-muted-foreground"
              }
            >
              {connectedIg ? "Bağlı" : "Bağlı değil"}
            </Badge>
            <Badge variant="outline" className="border-white/15 text-[10px]">
              {metaReady ? "Meta OAuth hazır" : "Kurulum gerekli"}
            </Badge>
            {meta.autopilotActive ? (
              <Badge variant="success" className="text-[10px]">
                Autopilot aktif
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Kullanıcı" value={ig?.username ? `@${ig.username}` : "—"} />
            <StatTile label="Yayın durumu" value={meta.lastPublishStatus ?? "—"} />
            <StatTile label="Son yayın" value={formatDt(meta.lastPublishAt)} />
            <StatTile
              label="Hesap tipi"
              value={ig?.account_type ?? (connectedIg ? "Business" : "—")}
            />
          </div>

          {connectedIg ? (
            <InstagramTestPublishButton disabled={!meta.professionalAccount} />
          ) : (
            <ConnectPlatformButtons />
          )}

          {!connectedIg ? (
            <p className="text-[11px] text-muted-foreground">
              Bağlantı sonrası tek görsel + AI caption ile test yayını yapabilirsiniz.
            </p>
          ) : null}
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

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3 backdrop-blur-md">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-display text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
