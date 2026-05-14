"use client";

import { motion } from "framer-motion";
import { Activity, CalendarClock, Cpu, Radio, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { DashboardOperatorOverview } from "@/types/database";

function formatShort(iso: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function OperationCenterStrip({ operator }: { operator: DashboardOperatorOverview }) {
  const modeLabel =
    operator.usageMode === "full_auto"
      ? "Tam otonom"
      : operator.usageMode === "approval_required"
        ? "Onaylı mod"
        : "Mod seçilmedi";

  const ap = operator.aiAutopilot;

  return (
    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/25 via-black/40 to-black/70 p-5 shadow-inner-glow backdrop-blur-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-400/30 bg-violet-500/15 text-violet-100">
            <Cpu className="h-5 w-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg font-semibold tracking-tight">AI Operation Center</h2>
              <Badge variant="outline" className="border-white/15 text-[10px]">
                {modeLabel}
              </Badge>
              <Badge variant="success" className="gap-1 text-[10px]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Canlı döngü
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Analyze → Learn → Generate → Publish → Measure → Optimize
            </p>
            {operator.growth?.strategy_summary ? (
              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-violet-100/85">
                {operator.growth.strategy_summary}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge
                variant={ap.accountLinked ? "success" : "outline"}
                className="border-white/12 text-[10px]"
              >
                {ap.accountLinked ? "AI hesap bağlı" : "Hesap bekleniyor"}
              </Badge>
              <Badge
                variant={ap.publishingActive ? "success" : "outline"}
                className="border-white/12 text-[10px]"
              >
                {ap.publishingActive ? "AI yayın aktif" : "Yayın beklemede"}
              </Badge>
              <Badge
                variant={ap.nextAutonomousAt ? "secondary" : "outline"}
                className="border-white/12 text-[10px]"
              >
                {ap.nextAutonomousAt
                  ? `Sonraki otonom: ${formatShort(ap.nextAutonomousAt)}`
                  : "Sonraki otonom slot"}
              </Badge>
              <Badge
                variant={ap.growthLoopActive ? "success" : "outline"}
                className="border-white/12 text-[10px]"
              >
                {ap.growthLoopActive ? "AI büyüme döngüsü" : "Büyüme döngüsü hazır"}
              </Badge>
              <Badge
                variant={ap.queueOptimizationActive ? "success" : "outline"}
                className="border-white/12 text-[10px]"
              >
                {ap.queueOptimizationActive ? "Kuyruk optimizasyonu" : "Kuyruk izlemede"}
              </Badge>
            </div>

            {operator.cognitionFeed?.length ? (
              <ul className="mt-3 space-y-2 rounded-xl border border-cyan-500/15 bg-cyan-950/10 p-3">
                {operator.cognitionFeed.map((line) => (
                  <li key={line.id} className="flex gap-2 text-[11px] leading-relaxed text-cyan-50/90">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-300/90" />
                    <span>{line.text}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            {operator.liveSignals ? (
              <div className="mt-3 grid gap-2 rounded-xl border border-white/[0.06] bg-black/30 p-3 text-[11px] leading-relaxed text-muted-foreground sm:grid-cols-2">
                <p>
                  <span className="font-medium text-violet-200/90">Optimize: </span>
                  {operator.liveSignals.optimizing}
                </p>
                <p>
                  <span className="font-medium text-emerald-200/90">Test: </span>
                  {operator.liveSignals.testing}
                </p>
                <p className="sm:col-span-2">
                  <span className="font-medium text-amber-200/90">Hook sinyali: </span>
                  {operator.liveSignals.hookSignal}
                </p>
                <p className="sm:col-span-2 border-t border-white/[0.06] pt-2 text-violet-100/80">
                  <span className="font-medium text-foreground/85">Seçim gerekçesi: </span>
                  {operator.liveSignals.rationale}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {operator.nextScheduled ? (
          <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-black/35 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5 text-violet-300" />
              Sıradaki paylaşım
            </div>
            <p className="mt-1 font-display text-sm font-semibold text-foreground">
              {operator.nextScheduled.title}
            </p>
            <p className="text-xs text-muted-foreground">
              {operator.nextScheduled.platform} · {formatShort(operator.nextScheduled.at)}
            </p>
            <p className="mt-2 border-t border-white/[0.06] pt-2 text-xs leading-relaxed text-violet-100/85">
              {operator.nextScheduled.why}
            </p>
          </div>
        ) : null}
      </div>

      <ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {operator.loopActivities.map((a, i) => (
          <motion.li
            key={a.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.35 }}
            className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.03] p-3"
          >
            {a.pulse ? (
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent" />
            ) : null}
            <div className="relative flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-violet-200/90">
              {a.pulse ? <Radio className="h-3 w-3 text-emerald-300" /> : <Activity className="h-3 w-3" />}
              {a.title}
            </div>
            <p className="relative mt-1.5 text-[11px] leading-snug text-muted-foreground">{a.detail}</p>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
