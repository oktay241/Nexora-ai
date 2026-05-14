"use client";

import { BarChart3, Flame, Layers, Sparkles, Target, UserCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { DashboardOperatorOverview } from "@/types/database";

export function DiscoveryEnginePanel({ operator }: { operator: DashboardOperatorOverview }) {
  const d = operator.discovery;

  if (!d) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 shadow-inner-glow">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-200" />
          <h3 className="font-display text-lg font-semibold">AI Discovery Engine</h3>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Kurulumda hesap analizi tamamlandığında niş, içerik formatı ve skorlar burada görünür.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 shadow-inner-glow backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-200" />
          <h3 className="font-display text-lg font-semibold">AI Discovery Engine</h3>
        </div>
        {d.account_type ? (
          <Badge variant="secondary" className="text-[10px]">
            {d.account_type}
          </Badge>
        ) : null}
      </div>

      <div className="mt-4 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Growth score
            </p>
            <div className="mt-2 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-300" />
              <span className="font-display text-2xl font-semibold">{d.growth_score}</span>
            </div>
            <Progress value={d.growth_score} className="mt-2 h-1" />
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Viral potential
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-300" />
              <span className="font-display text-2xl font-semibold">{d.viral_potential}</span>
            </div>
            <Progress value={d.viral_potential} className="mt-2 h-1" />
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-transparent p-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-violet-200/80">
            Bio analizi
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d.bio_analysis}</p>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3">
          <p className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <UserCircle className="h-3.5 w-3.5" />
            Profil yapısı
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {d.profile_structure_summary}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="text-[10px]">
            {d.niche}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {d.inferred_content_category}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            Ton: {d.tone}
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/[0.06] bg-black/25 p-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Paylaşım tarzı
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{d.posting_style}</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-black/25 p-3">
            <p className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <Target className="h-3.5 w-3.5" />
              Hedef kitle (tahmin)
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{d.target_audience}</p>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3">
          <p className="mb-2 flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <Layers className="h-3.5 w-3.5" />
            İçerik formatları
          </p>
          <div className="flex flex-wrap gap-1.5">
            {d.content_formats.map((f) => (
              <Badge key={f} variant="secondary" className="text-[10px]">
                {f}
              </Badge>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-black/25 p-3">
          <p className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <Target className="h-3.5 w-3.5" />
            Paylaşım / etkileşim paterni
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{d.engagement_pattern_hint}</p>
        </div>
      </div>
    </div>
  );
}
