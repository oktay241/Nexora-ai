"use client";

import { TrendingUp } from "lucide-react";

import { Progress } from "@/components/ui/progress";

export type ContentPerfItem = {
  id: string;
  title: string;
  reach: string;
  er: string;
  score: number;
};

export function ContentPerformance({
  items,
  title = "Son üretilen içerikler",
  subtitle = "Canlı sosyal metrikler bağlandığında erişim dolar",
}: {
  items: ContentPerfItem[];
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 shadow-inner-glow">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-emerald-300" />
        <div>
          <h3 className="font-display text-lg font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Henüz AI içerik kaydı yok.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {items.map((c) => (
            <div key={c.id} className="rounded-xl border border-white/[0.06] bg-black/30 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{c.title}</p>
                <span className="text-xs text-muted-foreground">{c.score}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                <span>Erişim {c.reach}</span>
                <span>Etkileşim {c.er}</span>
              </div>
              <Progress value={c.score} className="mt-3 h-1.5" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
