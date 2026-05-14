"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ImageIcon, Sparkles } from "lucide-react";

import { generateNewCreativePack, type CreativePackGenState } from "@/actions/creative-visual";
import { Button } from "@/components/ui/button";

export function AiCreativeGallery({ previews }: { previews: Array<{ id: string; url: string }> }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(generateNewCreativePack, undefined as CreativePackGenState | undefined);

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state?.ok, router]);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 shadow-inner-glow backdrop-blur-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-100">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-lg font-semibold tracking-tight">AI Creative Visuals</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Niş ve marka tonuna uygun sosyal görseller — pipeline ile üretilir, burada önizlenir.
            </p>
          </div>
        </div>
        <form action={formAction}>
          <Button type="submit" disabled={pending} className="shadow-glow" variant="secondary">
            <ImageIcon className="h-4 w-4" />
            {pending ? "Üretiliyor…" : "Generate New Creative"}
          </Button>
        </form>
      </div>

      {state?.error ? (
        <p className="mt-3 rounded-lg border border-red-500/25 bg-red-950/30 px-3 py-2 text-sm leading-relaxed text-red-200" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-950/25 px-3 py-2 text-sm text-emerald-200/95">
          Creative paket ve AI görsel kaydedildi; önizleme birkaç saniye içinde yenilenecek.
        </p>
      ) : null}

      {previews.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Henüz AI görseli yok. Yukarıdan yeni creative üretin — Tam Otonom Growth Engine görsel katmanını
          doldurur.
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-4">
          {previews.map((p, i) => (
            <motion.li
              key={p.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04, duration: 0.35 }}
              className="group relative aspect-square overflow-hidden rounded-xl border border-white/[0.08] bg-black/40 shadow-inner"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt="AI creative"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />
              <span className="absolute bottom-2 left-2 flex items-center gap-1 text-[10px] font-medium text-white/90">
                <ImageIcon className="h-3 w-3" />
                AI
              </span>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
