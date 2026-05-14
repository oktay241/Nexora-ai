"use client";

import { motion } from "framer-motion";
import { Eye, Heart, Users } from "lucide-react";

type MetricCardsProps = {
  growth: number;
  viral: number;
  engagementRate: number;
  hintGrowth?: string;
  hintViral?: string;
  hintEngagement?: string;
};

export function MetricCards({
  growth,
  viral,
  engagementRate,
  hintGrowth = "Otonom döngü + içerik",
  hintViral = "Açılış + trend uyumu",
  hintEngagement = "Analitik özet",
}: MetricCardsProps) {
  const cards = [
    {
      label: "Büyüme skoru",
      value: growth,
      suffix: "",
      icon: Users,
      hint: hintGrowth,
    },
    {
      label: "Viralite skoru",
      value: viral,
      suffix: "",
      icon: Heart,
      hint: hintViral,
    },
    {
      label: "Etkileşim oranı",
      value: engagementRate,
      suffix: "%",
      icon: Eye,
      hint: hintEngagement,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.45 }}
          className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-transparent p-5 shadow-inner-glow"
        >
          <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-500/15 blur-2xl transition-opacity group-hover:opacity-100" />
          <div className="flex items-center justify-between">
            <c.icon className="h-5 w-5 text-violet-200" />
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {c.hint}
            </span>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">{c.label}</p>
          <p className="font-display text-3xl font-semibold tracking-tight">
            {c.value}
            {c.suffix}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
