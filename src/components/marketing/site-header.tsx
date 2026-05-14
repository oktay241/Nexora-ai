"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/constants";

export function SiteHeader() {
  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-black/40 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-br from-violet-500/30 to-sky-500/20 shadow-glow">
            <Sparkles className="h-4 w-4 text-violet-200" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-sm font-semibold tracking-tight">
              {siteConfig.name}
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Tam otonom büyüme
            </span>
          </div>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#how" className="transition-colors hover:text-foreground">
            Nasıl çalışır
          </a>
          <a href="#features" className="transition-colors hover:text-foreground">
            Özellikler
          </a>
          <a href="#engine" className="transition-colors hover:text-foreground">
            Hedef ve AI ayarı
          </a>
          <a href="#pricing" className="transition-colors hover:text-foreground">
            Fiyatlandırma
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">Panel</Link>
          </Button>
          <Button size="sm" className="hidden sm:inline-flex" asChild>
            <Link href="/register">Başla</Link>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
