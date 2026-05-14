"use client";



import { motion } from "framer-motion";

import {

  Brain,

  Hash,

  LineChart,

  Rocket,

  Share2,

  Sparkles,

} from "lucide-react";



import { MotionSection } from "@/components/motion/motion-section";

import { Badge } from "@/components/ui/badge";



const items = [

  {

    title: "Otomatik İçerik Üretimi",

    desc: "Görsel ve reklam görselleri, kısa video, gönderi açıklamaları ve hashtag setleri hesabınıza göre üretilir; tek tıkla onay veya tam otonom akış.",

    icon: Sparkles,

  },

  {

    title: "AI Destekli Paylaşım",

    desc: "Instagram ve TikTok için yayınlarınızı yapay zeka yayımlar: otomatik zamanlama ve düzenli içerik akışı ile hesabınız sürekli aktif kalır.",

    icon: Share2,

  },

  {

    title: "Performans Analizi",

    desc: "Erişim ve etkileşimi kanal bazında okur; en iyi içerikleri ve hashtag performansını net şekilde gösterir.",

    icon: LineChart,

  },

  {

    title: "Akıllı Hashtag Sistemi",

    desc: "Keşfet ve profil tıklaması için etiket setleri üretilir; hangi grubun daha iyi sonuç verdiği ölçülerek sürekli yenilenir.",

    icon: Hash,

  },

  {

    title: "Otonom Büyüme Motoru",

    desc: "Üretim, yayın ve ölçüm tek döngüde çalışır; yapay zeka sosyal medya operasyonunu sizin yerinize yürütür, siz sonucu izlersiniz.",

    icon: Rocket,

  },

  {

    title: "AI Optimizasyon Döngüsü",

    desc: "Hangi içeriğin daha iyi çalıştığını öğrenir; açıklamaları, hashtagleri ve paylaşım saatlerini veriye göre her turda iyileştirir.",

    icon: Brain,

  },

];



export function Features() {

  return (

    <MotionSection id="features" className="border-y border-white/[0.06] bg-white/[0.02] py-20 sm:py-28">

      <div className="mx-auto max-w-6xl px-4 sm:px-6">

        <div className="flex max-w-2xl flex-col gap-3">

          <Badge variant="secondary">Ürün yetenekleri</Badge>

          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">

            İçerik,{" "}

            <span className="text-gradient">otomatik paylaşım</span>, analiz ve

            optimizasyon bir arada

          </h2>

          <p className="text-muted-foreground">

            Yardımcı bir metin editörü değil; Instagram ve TikTok için uçtan uca

            otonom büyüme. Yapay zeka üretir, yayınlar, ölçer ve stratejiyi

            günceller.

          </p>

        </div>



        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {items.map((f, i) => (

            <motion.div

              key={f.title}

              initial={{ opacity: 0, y: 16 }}

              whileInView={{ opacity: 1, y: 0 }}

              viewport={{ once: true }}

              transition={{ delay: i * 0.05, duration: 0.45 }}

              className="rounded-2xl border border-white/[0.07] bg-black/40 p-5 shadow-inner-glow transition-transform hover:-translate-y-1"

            >

              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/25 to-sky-500/10">

                <f.icon className="h-5 w-5 text-violet-100" />

              </div>

              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>

              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">

                {f.desc}

              </p>

            </motion.div>

          ))}

        </div>

      </div>

    </MotionSection>

  );

}


