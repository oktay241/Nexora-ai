"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 sm:pt-32 sm:pb-28">
      <div className="pointer-events-none absolute inset-0 mesh-gradient opacity-90" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-violet-600/25 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-sky-500/20 blur-[100px]" />
      <div className="pointer-events-none absolute inset-0 noise" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <Badge variant="outline" className="mb-6 border-violet-500/30 bg-violet-500/5">
            Instagram ve TikTok · AI içerik + otomatik paylaşım + optimizasyon
          </Badge>
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-6xl sm:leading-[1.05]">
            <span className="text-gradient">Yapay zeka sosyal medya operasyonunuzu yönetir</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Nexora tam otonom bir büyüme sistemidir: görsel ve reklam görselleri, kısa
            video, açıklama ve hashtag üretir; Instagram ve TikTok’ta{" "}
            <span className="text-foreground/90">otomatik paylaşım ve zamanlama</span>{" "}
            yapar; erişim ve etkileşimi analiz eder; hangi içeriğin daha iyi
            performans verdiğini öğrenerek metinleri, etiketleri ve yayın saatlerini
            sizin yerinize iyileştirir. İsterseniz onay akışı, isterseniz tam otonomi.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Button size="lg" className="min-w-[200px] shadow-glow" asChild>
              <Link href="/register">
                Ücretsiz dene
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="secondary" className="min-w-[200px]" asChild>
              <Link href="/dashboard">
                <Play className="h-4 w-4" />
                Paneli gör
              </Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto mt-16 max-w-5xl"
        >
          <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-r from-violet-500/20 via-fuchsia-500/10 to-sky-500/20 opacity-80 blur-2xl" />
          <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-b from-white/[0.08] to-transparent p-[1px] shadow-glow">
            <div className="rounded-[1.7rem] bg-zinc-950/90 p-4 sm:p-6">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div className="flex gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  app.nexora.ai / panel
                </p>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {[
                  {
                    label: "Otomatik paylaşım",
                    value: "18",
                    sub: "Instagram + TikTok · bu hafta yayın",
                  },
                  {
                    label: "AI içerik üretimi",
                    value: "32",
                    sub: "Görsel, kısa video, açıklama",
                  },
                  {
                    label: "AI optimizasyon",
                    value: "5",
                    sub: "Hashtag, metin ve saat güncellemesi",
                  },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="glass rounded-xl p-4 transition-transform duration-300 hover:-translate-y-0.5"
                  >
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className="mt-2 font-display text-2xl font-semibold tracking-tight">
                      {m.value}
                    </p>
                    <p className="mt-1 text-xs text-emerald-300/90">{m.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
