"use client";

import { Clock, Orbit, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { GrowthStrategyPayload } from "@/lib/operator/discovery-types";

export function GrowthStrategyCard({ growth }: { growth: GrowthStrategyPayload | null }) {
  if (!growth) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 shadow-inner-glow">
        <div className="flex items-center gap-2">
          <Orbit className="h-5 w-5 text-sky-300" />
          <h3 className="font-display text-lg font-semibold">AI Strategy Layer</h3>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Analyze → Learn → Generate → Optimize döngüsü kurulum sonrası burada listelenir.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 shadow-inner-glow backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Orbit className="h-5 w-5 text-sky-300" />
        <h3 className="font-display text-lg font-semibold">AI Strategy Layer</h3>
      </div>

      <p className="mt-4 rounded-xl border border-sky-500/15 bg-sky-500/5 p-3 text-sm leading-relaxed text-sky-50/95">
        {growth.strategy_summary}
      </p>

      <div className="mt-4 space-y-3">
        <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Önerilen paylaşım sıklığı
          </p>
          <p className="mt-1 text-sm text-foreground/90">{growth.posting_frequency}</p>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Hook stili
          </p>
          <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
            <Zap className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            {growth.recommended_hook_style}
          </p>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Viral hook stratejisi
          </p>
          <div className="flex flex-wrap gap-1.5">
            {growth.viral_hook_strategy.map((h) => (
              <Badge key={h} variant="outline" className="text-[10px]">
                {h}
              </Badge>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Platform & viral yapı
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{growth.platform_strategy}</p>
          <p className="mt-2 text-xs text-muted-foreground/90">{growth.viral_content_structure}</p>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3">
          <p className="mb-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            En iyi paylaşım zamanları
          </p>
          <ul className="list-inside list-disc space-y-1 text-xs text-violet-100/85">
            {growth.best_posting_times.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-200/90">
            Etkileşim optimizasyonu
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{growth.engagement_optimization}</p>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            İçerik sütunları
          </p>
          <div className="flex flex-wrap gap-1.5">
            {growth.content_pillars.map((p) => (
              <Badge key={p} variant="secondary" className="text-[10px]">
                {p}
              </Badge>
            ))}
          </div>
        </div>

        <p className="rounded-xl border border-white/[0.06] bg-black/25 p-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">Döngü: </span>
          {growth.operator_loop_summary}
        </p>
      </div>
    </div>
  );
}
