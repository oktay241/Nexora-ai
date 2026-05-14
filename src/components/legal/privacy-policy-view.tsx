"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight, Shield } from "lucide-react";

import { PRIVACY_LAST_UPDATED_ISO, privacySections } from "@/lib/legal/privacy-sections";
import { siteConfig } from "@/lib/constants";
import { cn } from "@/lib/utils";

function formatLongTr(iso: string) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "long" }).format(new Date(iso));
}

export function PrivacyPolicyView() {
  const [activeId, setActiveId] = useState(privacySections[0]?.id ?? "overview");

  const sectionIds = useMemo(() => privacySections.map((s) => s.id), []);

  useEffect(() => {
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const first = visible[0];
        if (first?.target?.id) setActiveId(first.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.1, 0.25, 0.5, 1] },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [sectionIds]);

  return (
    <main className="relative min-h-screen pt-24">
      <div className="pointer-events-none absolute inset-0 mesh-gradient opacity-90" />
      <div className="pointer-events-none absolute inset-0 noise" />

      <div className="relative mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Ana sayfa
          </Link>

          <div className="glass-strong relative overflow-hidden rounded-2xl p-6 sm:p-8">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-600/15 via-transparent to-cyan-500/10" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-500/15 text-violet-100">
                  <Shield className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-200/90">
                    Yasal
                  </p>
                  <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    Gizlilik Politikası
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {siteConfig.name} için veri işleme uygulamalarımızın şeffaf özeti. Ürünü güvenle
                    kullanmanız için tasarlandı.
                  </p>
                </div>
              </div>
              <div className="shrink-0 rounded-xl border border-white/[0.08] bg-black/35 px-4 py-3 text-right backdrop-blur-md">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Son güncelleme
                </p>
                <p className="mt-1 font-display text-sm font-semibold text-foreground">
                  {formatLongTr(PRIVACY_LAST_UPDATED_ISO)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <nav
          aria-label="Bölüm navigasyonu"
          className="mb-8 flex gap-2 overflow-x-auto pb-1 lg:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {privacySections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors",
                activeId === s.id
                  ? "border-violet-500/40 bg-violet-500/15 text-violet-50"
                  : "border-white/[0.08] bg-white/[0.03] text-muted-foreground hover:border-white/15 hover:text-foreground",
              )}
            >
              {s.tocLabel}
            </a>
          ))}
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)] lg:gap-12">
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Bu sayfada
              </p>
              <nav aria-label="İçindekiler" className="glass rounded-2xl p-3">
                <ul className="space-y-0.5">
                  {privacySections.map((s) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        className={cn(
                          "group flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition-colors",
                          activeId === s.id
                            ? "bg-violet-500/15 text-violet-50"
                            : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
                        )}
                      >
                        <ChevronRight
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100",
                            activeId === s.id ? "translate-x-0 opacity-100 text-violet-300" : "-translate-x-1",
                          )}
                        />
                        <span className="leading-snug">{s.tocLabel}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </aside>

          <article className="min-w-0">
            <div className="glass rounded-2xl p-5 sm:p-8 lg:p-10">
              <div className="space-y-12">
                {privacySections.map((section, index) => (
                  <motion.section
                    key={section.id}
                    id={section.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-8% 0px" }}
                    transition={{ duration: 0.4, delay: Math.min(index * 0.03, 0.15), ease: [0.22, 1, 0.36, 1] }}
                    className="scroll-mt-28"
                  >
                    <h2 className="font-display text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                      {section.title}
                    </h2>
                    {section.lead ? (
                      <p className="mt-3 text-sm font-medium leading-relaxed text-violet-100/90">
                        {section.lead}
                      </p>
                    ) : null}
                    <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
                      {section.paragraphs.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>
                    {section.bullets?.length ? (
                      <ul className="mt-4 list-disc space-y-2.5 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-violet-400/90">
                        {section.bullets.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    ) : null}
                  </motion.section>
                ))}
              </div>

              <footer className="mt-14 border-t border-white/[0.08] pt-8">
                <p className="text-center text-xs text-muted-foreground">
                  <span className="font-medium text-foreground/80">Last updated / Son güncelleme:</span>{" "}
                  {formatLongTr(PRIVACY_LAST_UPDATED_ISO)}
                </p>
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  Bu metin bilgilendirme amaçlıdır ve hukuki tavsiye yerine geçmez. Özel durumlar için hukuk
                  danışmanlığı alınız.
                </p>
              </footer>
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}
