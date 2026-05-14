"use client";

import { motion } from "framer-motion";

import { MotionSection } from "@/components/motion/motion-section";
import { Badge } from "@/components/ui/badge";

const goals = [
  "Takipçi artır",
  "Etkileşim yükselt",
  "Dönüşüme odaklan",
  "Görünürlük genişlet",
  "Marka güçlendir",
];

export function GoalEngine() {
  return (
    <MotionSection id="engine" className="relative overflow-hidden py-20 sm:py-28">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/15 blur-[100px]" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Badge variant="outline" className="mb-4 border-sky-500/30">
              Hedefe göre otonom ayar
            </Badge>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Hedef değişince{" "}
              <span className="text-gradient">içerik, paylaşım ve optimizasyon</span>{" "}
              uyumlanır
            </h2>
            <p className="mt-4 text-muted-foreground">
              Takipçi mi, etkileşim mi, satış mı: seçtiğiniz önceliğe göre üretilen
              formatlar, yayın sıklığı ve analiz raporları değişir. Tek hesapta bile
              kanal bazında Instagram ve TikTok ayrı ayrı yönetilir.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                Hedef → içerik karışımı ve kota → otomatik paylaşım saatleri → ölçüm
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                Her kanal için ayrı yayın ve performans görünümü
              </li>
              <li className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-400" />
                Hashtag ve açıklama setleri performansa göre haftalık yenilenir
              </li>
            </ul>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-violet-500/20 to-sky-500/15 blur-2xl" />
            <div className="relative rounded-2xl border border-white/10 bg-zinc-950/80 p-6 shadow-glow backdrop-blur-xl">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Örnek hedef seçimi
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {goals.map((g, i) => (
                  <motion.span
                    key={g}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-foreground shadow-inner-glow"
                  >
                    {g}
                  </motion.span>
                ))}
              </div>
              <div className="mt-8 rounded-xl border border-white/10 bg-gradient-to-br from-violet-500/10 to-transparent p-4">
                <p className="text-xs text-muted-foreground">Örnek çıktı</p>
                <p className="mt-2 text-sm leading-relaxed text-violet-100/90">
                  Bu hafta 8 gönderi + 4 kısa video; Instagram’da 6, TikTok’ta 4 otomatik
                  yayın; Cuma 19:00 ve Pazar 11:00 öncelikli slotlar; 12 hashtag grubu
                  yeni veriye göre güncellendi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MotionSection>
  );
}
