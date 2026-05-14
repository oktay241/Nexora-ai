"use client";



import { motion } from "framer-motion";

import Link from "next/link";

import { Check } from "lucide-react";



import { MotionSection } from "@/components/motion/motion-section";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";



const tiers = [

  {

    name: "Başlangıç",

    price: "₺0",

    period: "önizleme",

    desc: "Paneli ve örnek veriyi gezin; üretim ve otomatik paylaşımı risk almadan tanıyın.",

    features: [

      "Sosyal medya hesabı: 1 (Instagram veya TikTok, önizleme modu)",

      "Günlük içerik limiti: — (ayda 20’ye kadar taslak önizleme)",

      "Otomatik paylaşım: kapalı (yalnızca taslak ve manuel inceleme)",

      "Analytics seviyesi: temel — örnek pano, canlı metrik yok",

      "AI optimizasyon seviyesi: — (statik öneri listesi)",

    ],

    cta: "Ücretsiz başla",

    href: "/register",

    featured: false,

  },

  {

    name: "Yükseliş",

    price: "₺2.499",

    period: "/ ay",

    desc: "Gerçek hesaplarda üretim, otomatik yayın ve gelişmiş analitik ile haftalık optimizasyon.",

    features: [

      "Sosyal medya hesabı: 2 (Instagram + TikTok veya iki ayrı hesap)",

      "Günlük içerik limiti: ortalama 4 taslak / gün (ayda 120 üretim kotası)",

      "Otomatik paylaşım: açık — ayda 40 yayın (Instagram ve TikTok, kota ile)",

      "Analytics seviyesi: gelişmiş — erişim, etkileşim, içerik ve hashtag kırılımı",

      "AI optimizasyon seviyesi: gelişmiş — haftalık metin, hashtag ve saat güncellemesi",

    ],

    cta: "Yükselişe geç",

    href: "/register",

    featured: true,

  },

  {

    name: "Ölçek",

    price: "Özel",

    period: "",

    desc: "Ajans ve çok hesaplı ekipler; kota, otomatik paylaşım ve raporlama birlikte planlanır.",

    features: [

      "Sosyal medya hesabı: 10+ (üst sınır ve fiyat teklifle)",

      "Günlük içerik limiti: özel kota (ör. ajans hacmine göre)",

      "Otomatik paylaşım: açık — sınırsız plan (SLA ve kota anlaşması ile)",

      "Analytics seviyesi: kurumsal — çoklu hesap, export ve özel raporlar",

      "AI optimizasyon seviyesi: kurumsal — özel kural seti ve model ince ayarı",

    ],

    cta: "Teklif al",

    href: "#pricing",

    featured: false,

  },

];



export function Pricing() {

  return (

    <MotionSection id="pricing" className="py-20 sm:py-28">

      <div className="mx-auto max-w-6xl px-4 sm:px-6">

        <div className="mx-auto max-w-2xl text-center">

          <Badge variant="secondary" className="mb-4">

            Fiyatlandırma

          </Badge>

          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">

            Hesap kotası, günlük üretim,{" "}

            <span className="text-gradient">otomatik paylaşım</span> ve analitik net

          </h2>

          <p className="mt-4 text-muted-foreground">

            Aşağıdaki rakamlar örnek paketlerdir; canlı üründe hesap başı kota netleşir.

            Şimdilik arayüzü ücretsiz gezebilirsiniz.

          </p>

        </div>



        <div className="mt-14 grid gap-6 lg:grid-cols-3">

          {tiers.map((t, i) => (

            <motion.div

              key={t.name}

              initial={{ opacity: 0, y: 20 }}

              whileInView={{ opacity: 1, y: 0 }}

              viewport={{ once: true }}

              transition={{ delay: i * 0.08 }}

              className={`relative flex flex-col rounded-2xl border p-6 sm:p-8 ${

                t.featured

                  ? "border-violet-500/40 bg-gradient-to-b from-violet-500/10 to-transparent shadow-glow"

                  : "border-white/[0.08] bg-white/[0.02]"

              }`}

            >

              {t.featured && (

                <span className="absolute -top-3 left-6 rounded-full border border-violet-400/40 bg-violet-500/20 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-100">

                  En çok tercih edilen

                </span>

              )}

              <h3 className="font-display text-xl font-semibold">{t.name}</h3>

              <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>

              <div className="mt-6 flex items-baseline gap-1">

                <span className="font-display text-4xl font-semibold tracking-tight">

                  {t.price}

                </span>

                {t.period && (

                  <span className="text-sm text-muted-foreground">{t.period}</span>

                )}

              </div>

              <ul className="mt-8 flex-1 space-y-3 text-sm text-muted-foreground">

                {t.features.map((f) => (

                  <li key={f} className="flex gap-2">

                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />

                    {f}

                  </li>

                ))}

              </ul>

              <Button

                className="mt-8 w-full"

                variant={t.featured ? "default" : "secondary"}

                asChild

              >

                <Link href={t.href}>{t.cta}</Link>

              </Button>

            </motion.div>

          ))}

        </div>

      </div>

    </MotionSection>

  );

}


