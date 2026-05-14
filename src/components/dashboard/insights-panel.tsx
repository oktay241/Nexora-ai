"use client";

import { Lightbulb } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export type InsightItem = {
  id: string;
  title: string;
  impact: "Yüksek" | "Orta" | "Düşük";
  summary: string;
};

export function InsightsPanel({
  insights,
  title = "AI optimizasyon",
  subtitle = "Son üretimden özet",
}: {
  insights: InsightItem[];
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 shadow-inner-glow">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-amber-200" />
        <div>
          <h3 className="font-display text-lg font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <ul className="mt-4 space-y-3">
        {insights.map((i) => (
          <li
            key={i.id}
            className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-amber-500/5 to-transparent p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{i.title}</p>
              <Badge
                variant={i.impact === "Yüksek" ? "default" : "secondary"}
                className="text-[10px]"
              >
                {i.impact}
              </Badge>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{i.summary}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
