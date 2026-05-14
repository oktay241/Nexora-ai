"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { MotionSection } from "@/components/motion/motion-section";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <MotionSection className="pb-20 sm:pb-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-violet-600/25 via-zinc-950 to-sky-600/20 p-10 sm:p-14">
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-xl">
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Sosyal medya operasyonunu yapay zekaya devredin
              </h2>
              <p className="mt-3 text-muted-foreground">
                Görsel ve video üretimi, Instagram ve TikTok’ta otomatik paylaşım,
                erişim ve etkileşim analizi ile sürekli optimizasyon tek üründe.
                Dakikalar içinde kuruluma başlayın; panelden yayın ve sonuçları izleyin.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="min-w-[180px] shadow-glow" asChild>
                <Link href="/register">
                  Hemen başla
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/dashboard">Paneli aç</Link>
              </Button>
            </div>
          </div>
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-30"
            animate={{ backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            style={{
              backgroundImage:
                "linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%)",
              backgroundSize: "200% 200%",
            }}
          />
        </div>
      </div>
    </MotionSection>
  );
}
