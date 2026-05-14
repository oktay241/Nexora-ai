import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ConnectPlatformButtons } from "@/components/dashboard/connect-platform-buttons";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listScheduledPosts } from "@/lib/data/dashboard";
import { getUserProfile } from "@/lib/data/user";
import { loadBufferDashboardSnapshot } from "@/lib/integrations/buffer/dashboard-slice";
import { isPublishConnectConfigured } from "@/lib/social-providers/oauth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Platform bağlantıları",
  description: "Nexora AI yayın hattı — sosyal hesap bağlama ve otonom pilot.",
};

type Search = Record<string, string | string[] | undefined>;

function first(q: Search, key: string): string | undefined {
  const v = q[key];
  if (Array.isArray(v)) return v[0];
  return v;
}

export default async function ConnectionsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const profile = await getUserProfile();
  if (!profile) redirect("/login?next=/dashboard/connections");

  const q = await searchParams;
  const linked = first(q, "linked") === "1";
  const setup = first(q, "setup") === "1";
  const autopilot = first(q, "autopilot") === "1";
  const err = first(q, "err");
  const platformHint = first(q, "platform");

  const posts = await listScheduledPosts();
  const publish = await loadBufferDashboardSnapshot(posts);
  const oauthReady = isPublishConnectConfigured();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Platform bağlantıları
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Nexora AI Social Operating System — Instagram ve TikTok’u güvenli oturumla bağlayın; otonom yayın
          ve sıra optimizasyonu tek panelden yönetilir.
        </p>
      </div>

      {linked ? (
        <p className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          Bağlantı akışı tamamlandı. Kanallarınız birkaç dakika içinde burada ve genel bakışta görünür hale
          gelir.
        </p>
      ) : null}
      {setup ? (
        <p className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Tarayıcı yönlendirmesi için sunucu tarafı OAuth değişkenleri eksik
          {platformHint ? ` (${platformHint})` : ""}. Yöneticiniz{" "}
          <code className="text-xs text-amber-50/90">NEXORA_PUBLISH_OAUTH_*</code> değerlerini eklediğinde
          bağlantı buradan başlayacaktır.
        </p>
      ) : null}
      {autopilot ? (
        <p className="rounded-xl border border-violet-500/25 bg-violet-500/10 px-4 py-3 text-sm text-violet-100">
          AI Autopilot modu: hesaplar bağlandıkça kuyruk dengeleme, hook optimizasyonu ve yayın zamanı seçimi
          otomatik devreye girer.
        </p>
      ) : null}
      {err ? (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          Bağlantı kesildi veya doğrulanamadı ({err}). Tekrar deneyin veya oturumu yenileyin.
        </p>
      ) : null}

      <Card className="border-white/[0.08] bg-gradient-to-br from-violet-950/30 via-black/45 to-cyan-950/15 shadow-inner-glow">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="font-display text-lg tracking-tight">Hesap bağlama</CardTitle>
            <Badge variant="outline" className="border-white/15 text-[10px]">
              {oauthReady ? "Köprü hazır" : "Kurulum bekleniyor"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Nexora’dan çıkmadan güvenli pencerede bağlantıyı başlatın; tamamlandığında otomatik olarak bu
            ekrana dönersiniz.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <ConnectPlatformButtons />
          <p className="text-[11px] text-muted-foreground">
            Bağlı kanallar: {publish.channels.length} · Otonom hatta eşlenen planlar:{" "}
            {publish.pipeline.bufferLinkedTotal}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
