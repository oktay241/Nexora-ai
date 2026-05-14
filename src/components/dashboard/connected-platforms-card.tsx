import type { ReactNode } from "react";
import { Layers, RadioTower, Share2, Sparkles } from "lucide-react";

import { ConnectPlatformButtons } from "@/components/dashboard/connect-platform-buttons";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { bufferServiceToDisplayPlatform } from "@/lib/integrations/buffer/platform-map";
import { cn } from "@/lib/utils";
import type { DashboardBufferSnapshot } from "@/types/database";

/** Nexora markalı “bağlı platformlar” — arka plan köprüsü UI’da görünmez. */
export function ConnectedPlatformsCard({ publish }: { publish: DashboardBufferSnapshot }) {
  const { pipeline, channels, configured, error, organizations } = publish;

  return (
    <Card className="relative overflow-hidden border-white/[0.08] bg-gradient-to-br from-violet-950/35 via-black/40 to-cyan-950/20 shadow-[0_0_60px_-24px_rgba(139,92,246,0.55)]">
      <div className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
      <CardHeader className="relative z-[1] pb-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 font-display text-lg tracking-tight">
              <Share2 className="h-4 w-4 text-violet-300" />
              Connected platforms
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Nexora AI yayın hattı — Instagram ve TikTok’u tek panelden otonom moda hazırlayın.
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "border text-[10px]",
              configured
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                : "border-white/15 bg-white/[0.04] text-muted-foreground",
            )}
          >
            {configured ? "Yayın köprüsü hazır" : "Köprü yapılandırması eksik"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="relative z-[1] space-y-4">
        {error ? (
          <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            Yayın altyapısı: {error}
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile
            icon={<Layers className="h-4 w-4 text-violet-200" />}
            label="AI kuyruk"
            value={String(pipeline.queueLikely)}
            hint="Planlı · gönderim · onay"
          />
          <MetricTile
            icon={<RadioTower className="h-4 w-4 text-cyan-200" />}
            label="Otonom yayın bağlantısı"
            value={String(pipeline.bufferLinkedTotal)}
            hint="Nexora planı ile eşlenen gönderiler"
          />
          <MetricTile
            icon={<Sparkles className="h-4 w-4 text-emerald-200" />}
            label="Tamamlanan"
            value={String(pipeline.sent)}
            hint="Yayına alınmış"
          />
          <MetricTile
            icon={<Share2 className="h-4 w-4 text-rose-200" />}
            label="Dikkat"
            value={String(pipeline.errors)}
            hint="İnceleme önerilir"
          />
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-black/25 p-3 backdrop-blur-md">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-200/80">
            Aktif kanallar
          </p>
          {!configured ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Otonom yayın için sunucu tarafı köprü anahtarı gerekir. Kurulum tamamlanınca bu alan canlı
              kanallarınızı gösterecek.
            </p>
          ) : channels.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Henüz bağlı sosyal kanal görünmüyor. Aşağıdan güvenli bağlantıyı başlatın.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {channels.map((ch) => (
                <div
                  key={ch.id}
                  className={cn(
                    "inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1 text-[11px] backdrop-blur-sm transition-colors",
                    ch.isDisconnected || ch.isLocked
                      ? "border-white/10 bg-white/[0.03] text-muted-foreground"
                      : "border-violet-500/25 bg-violet-500/10 text-violet-50",
                  )}
                  title={ch.descriptor}
                >
                  <span className="font-medium">{bufferServiceToDisplayPlatform(ch.service)}</span>
                  <span className="truncate text-muted-foreground">@{ch.name}</span>
                </div>
              ))}
            </div>
          )}
          {organizations.length > 1 ? (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Çoklu çalışma alanı algılandı — Nexora birincil alanı kullanıyor.
            </p>
          ) : null}

          <div className="mt-4 border-t border-white/[0.06] pt-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-200/80">
              Hesap bağlama
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Nexora içinden güvenli pencere ile bağlantı başlatın; tamamlandığında burası otomatik yenilenir.
            </p>
            <div className="mt-3">
              <ConnectPlatformButtons />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricTile({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 shadow-inner">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}
