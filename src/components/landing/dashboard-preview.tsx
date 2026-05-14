"use client";



import { motion } from "framer-motion";

import {

  LineChart,

  RefreshCw,

  Share2,

  Sparkles,

  TrendingUp,

} from "lucide-react";



import { MotionSection } from "@/components/motion/motion-section";

import { Badge } from "@/components/ui/badge";



const cards = [

  {

    title: "Otomatik İçerik Üretimi",

    icon: Sparkles,

    body: "Görsel, reklam görseli ve kısa video taslakları; açıklama ve hashtag üretimi tek akışta. Markanıza uygun, yayına hazır paketler.",

  },

  {

    title: "AI Destekli Paylaşım",

    icon: Share2,

    body: "Instagram ve TikTok gönderilerinizi yapay zeka yayımlar. Otomatik zamanlama ve düzenli akış ile hesap sürekliliği sizden bağımsız yürür.",

  },

  {

    title: "Performans Analizi",

    icon: LineChart,

    body: "Erişim, etkileşim ve en iyi içerikleri tek ekranda görün; hashtag bazlı performansı karşılaştırın, neyin işe yaradığını tartışmadan bilin.",

  },

  {

    title: "AI Optimizasyon Döngüsü",

    icon: RefreshCw,

    body: "Hangi içeriğin öne çıktığını öğrenir; açıklama, hashtag ve paylaşım saatlerini her turda veriye göre sıkılaştırır.",

  },

];



export function DashboardPreview() {

  return (

    <MotionSection className="relative border-y border-white/[0.06] bg-black/30 py-20 sm:py-24">

      <div className="pointer-events-none absolute inset-0 bg-hero-glow opacity-60" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">

        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">

          <div className="max-w-xl space-y-3">

            <Badge variant="secondary">Panel önizlemesi</Badge>

            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">

              Tek panelde{" "}

              <span className="text-gradient">otonom Instagram ve TikTok operasyonu</span>

            </h2>

            <p className="text-muted-foreground">

              Üretim hattı, otomatik yayın sırası ve performans raporları aynı yerde.

              Yapay zeka sadece öneri vermez: içeriği üretir, paylaşır, ölçer ve bir

              sonraki haftayı buna göre optimize eder.

            </p>

          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-muted-foreground">

            <TrendingUp className="h-4 w-4 text-emerald-400" />

            Örnek verilerle gösterim

          </div>

        </div>



        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          {cards.map((c, i) => (

            <motion.div

              key={c.title}

              initial={{ opacity: 0, y: 20 }}

              whileInView={{ opacity: 1, y: 0 }}

              viewport={{ once: true }}

              transition={{ delay: i * 0.08, duration: 0.5 }}

              whileHover={{ y: -4 }}

              className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-transparent p-6 shadow-inner-glow"

            >

              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">

                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />

                <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-sky-500/15 blur-3xl" />

              </div>

              <c.icon className="relative h-8 w-8 text-violet-300" />

              <h3 className="relative mt-4 font-display text-lg font-semibold">

                {c.title}

              </h3>

              <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">

                {c.body}

              </p>

              <div className="relative mt-6 flex items-center gap-2 text-xs text-violet-200/90">

                <Sparkles className="h-3.5 w-3.5" />

                Üret · yayınla · ölç · optimize et

              </div>

            </motion.div>

          ))}

        </div>

      </div>

    </MotionSection>

  );

}


