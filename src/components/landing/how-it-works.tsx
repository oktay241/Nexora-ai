"use client";

import { motion } from "framer-motion";
import { ImageIcon, Radar, Rocket, Share2 } from "lucide-react";

import { MotionSection } from "@/components/motion/motion-section";
import { StaggerChildren, StaggerItem } from "@/components/motion/stagger-children";
import { Badge } from "@/components/ui/badge";

const steps = [
  {
    step: "01",
    title: "Marka ve görsel referans",
    desc: "Logo, ürün ve örnek görselleri ekleyin. Yapay zeka tonu, kadrajı ve mesajı hesabınıza göre sabitler.",
    icon: ImageIcon,
  },
  {
    step: "02",
    title: "Hedefi netleştirin",
    desc: "Takipçi, etkileşim, dönüşüm veya görünürlük: öncelik neyse üretim ve paylaşım sıklığı buna göre ayarlanır.",
    icon: Radar,
  },
  {
    step: "03",
    title: "Otomatik içerik ve yayın",
    desc: "Görseller, kısa videolar ve metinler üretilir; Instagram ve TikTok için yapay zeka zamanlar ve yayınlar — siz sadece isterseniz onaylarsınız.",
    icon: Share2,
  },
  {
    step: "04",
    title: "Analiz ve AI optimizasyon",
    desc: "Erişim ve etkileşim okunur; en iyi içerikler ve hashtagler belirlenir. Açıklamalar ve yayın saatleri bir sonraki döngü için otomatik iyileştirilir.",
    icon: Rocket,
  },
];

export function HowItWorks() {
  return (
    <MotionSection id="how" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <Badge variant="outline" className="mb-4">
            Nasıl çalışır
          </Badge>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Dört adımda{" "}
            <span className="text-white/90">otomatik büyüme</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Hesabı bağlayıp hedefi seçiyorsunuz; sistem içerik üretir, Instagram ve
            TikTok’ta otomatik paylaşır, performansı analiz eder ve stratejiyi her hafta
            güçlendirir.
          </p>
        </div>

        <StaggerChildren className="mt-14 grid gap-6 md:grid-cols-2">
          {steps.map((s) => (
            <StaggerItem key={s.step}>
              <div className="group relative h-full overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 transition-colors hover:border-violet-500/25">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.25em] text-violet-300/90">
                      {s.step}
                    </p>
                    <h3 className="mt-3 font-display text-xl font-semibold">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {s.desc}
                    </p>
                  </div>
                  <motion.span
                    whileHover={{ rotate: 8, scale: 1.05 }}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-violet-500/20 to-sky-500/10"
                  >
                    <s.icon className="h-5 w-5 text-violet-100" />
                  </motion.span>
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </MotionSection>
  );
}
