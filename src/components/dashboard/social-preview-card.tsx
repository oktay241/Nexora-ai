"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  Heart,
  Instagram,
  MessageCircle,
  MoreHorizontal,
  Music2,
  Play,
  Send,
  Share2,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";

import { buildAiFormatInsight } from "@/lib/dashboard/social-preview-intelligence";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SocialPreviewCardProps = {
  imageUrl: string | null;
  caption: string;
  hashtags: string[];
  hook: string;
  cta: string;
  /** Örn. planlı yayın tarihi */
  scheduledLabel?: string | null;
  algorithmTarget?: string | null;
  publishReason?: string | null;
  aiReasoning?: string | null;
  usernameInstagram: string;
  usernameTiktok: string;
  displayName: string;
  carouselSlides?: number;
  /** Kart üst başlığı */
  sectionTitle?: string;
  sectionSubtitle?: string;
  className?: string;
};

function initials(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "NX";
  if (p.length === 1) return p[0]!.slice(0, 2).toUpperCase();
  return (p[0]![0]! + p[1]![0]!).toUpperCase();
}

function pseudoEngagement(seed: string): { likes: string; comments: string; saves: string } {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const likes = 800 + (h % 42000);
  const comments = 12 + (h % 180);
  const saves = 40 + (h % 900);
  const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n));
  return { likes: fmt(likes), comments: String(comments), saves: String(saves) };
}

function HashtagRow({ tags }: { tags: string[] }) {
  const line = tags.length ? tags.join(" ") : "";
  return (
    <p className="text-[11px] leading-relaxed text-violet-200/75 line-clamp-3">{line || "—"}</p>
  );
}

export function SocialPreviewCard({
  imageUrl,
  caption,
  hashtags,
  hook,
  cta,
  scheduledLabel,
  algorithmTarget,
  publishReason,
  aiReasoning,
  usernameInstagram,
  usernameTiktok,
  displayName,
  carouselSlides = 1,
  sectionTitle = "Sosyal önizleme",
  sectionSubtitle = "AI içeriğinizin feed’de nasıl görüneceğini simüle edin.",
  className,
}: SocialPreviewCardProps) {
  const [platform, setPlatform] = useState<"instagram" | "tiktok">("instagram");
  const insight = useMemo(
    () =>
      buildAiFormatInsight({
        platform,
        algorithmBehavior: algorithmTarget,
        publishReason,
        aiReasoning,
      }),
    [platform, algorithmTarget, publishReason, aiReasoning],
  );

  const username = platform === "instagram" ? usernameInstagram : usernameTiktok;
  const engage = useMemo(() => pseudoEngagement(username + caption.slice(0, 40)), [username, caption]);
  const slides = Math.min(5, Math.max(1, carouselSlides));

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 shadow-inner-glow backdrop-blur-md sm:p-5",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-fuchsia-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-violet-600/10 blur-3xl" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-violet-500/25 bg-violet-500/10 text-violet-200">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-display text-base font-semibold tracking-tight text-foreground/95 sm:text-lg">
                {sectionTitle}
              </h3>
              <p className="text-[11px] text-muted-foreground sm:text-xs">{sectionSubtitle}</p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-black/40 p-1 backdrop-blur-sm">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 rounded-full px-3 text-[11px] font-medium transition-all duration-300",
              platform === "instagram"
                ? "bg-gradient-to-r from-pink-500/25 to-violet-500/20 text-pink-100 shadow-[0_0_20px_-4px_rgba(236,72,153,0.45)]"
                : "text-muted-foreground hover:text-foreground/90",
            )}
            onClick={() => setPlatform("instagram")}
          >
            <Instagram className="mr-1.5 h-3.5 w-3.5" />
            Instagram
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 rounded-full px-3 text-[11px] font-medium transition-all duration-300",
              platform === "tiktok"
                ? "bg-gradient-to-r from-cyan-500/25 to-violet-500/20 text-cyan-100 shadow-[0_0_20px_-4px_rgba(34,211,238,0.4)]"
                : "text-muted-foreground hover:text-foreground/90",
            )}
            onClick={() => setPlatform("tiktok")}
          >
            <Music2 className="mr-1.5 h-3.5 w-3.5" />
            TikTok
          </Button>
        </div>
      </div>

      <div className="relative mt-4 rounded-xl border border-violet-500/15 bg-gradient-to-br from-violet-950/20 via-black/40 to-black/70 p-3 sm:p-4">
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-white/[0.06] bg-black/35 px-3 py-2 backdrop-blur-md">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-200/90" />
          <p className="text-[11px] leading-relaxed text-violet-100/85 sm:text-xs">
            <span className="font-semibold text-violet-200/95">AI format seçimi: </span>
            {insight}
          </p>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={platform}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="mx-auto w-full max-w-md"
          >
            {platform === "instagram" ? (
              <motion.div
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-950/95 to-black shadow-[0_24px_60px_-20px_rgba(0,0,0,0.85)]"
              >
                <div className="flex items-center gap-3 border-b border-white/[0.06] px-3 py-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-amber-400 text-[11px] font-bold text-white shadow-inner">
                    {initials(displayName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{username}</p>
                    <p className="truncate text-[10px] text-zinc-500">{displayName}</p>
                  </div>
                  <MoreHorizontal className="h-4 w-4 shrink-0 text-zinc-500" />
                </div>

                <div className="relative aspect-square bg-zinc-900/80">
                  {imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-950/50 to-black text-xs text-muted-foreground">
                      AI görsel atanmadı
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <Badge
                    variant="outline"
                    className="absolute left-2 top-2 border-white/20 bg-black/50 text-[9px] text-white/90 backdrop-blur-sm"
                  >
                    Reels
                  </Badge>
                </div>

                <div className="border-b border-white/[0.05] bg-black/30 px-3 py-2 backdrop-blur-sm">
                  <p className="text-[11px] font-medium leading-snug text-pink-100/95 line-clamp-2">{hook}</p>
                </div>

                {slides > 1 ? (
                  <div className="flex justify-center gap-1 py-2">
                    {Array.from({ length: slides }).map((_, i) => (
                      <span
                        key={i}
                        className={cn(
                          "h-1.5 w-1.5 rounded-full transition-all duration-300",
                          i === 0 ? "w-4 bg-pink-400" : "bg-white/25",
                        )}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="h-1" />
                )}

                <div className="flex items-center justify-between px-3 py-2 text-zinc-300">
                  <div className="flex gap-4">
                    <Heart className="h-[22px] w-[22px] transition-colors hover:text-pink-400" />
                    <MessageCircle className="h-[22px] w-[22px] transition-colors hover:text-violet-300" />
                    <Send className="h-[20px] w-[20px] transition-colors hover:text-cyan-300" />
                  </div>
                  <Bookmark className="h-[20px] w-[20px] transition-colors hover:text-amber-300" />
                </div>

                <div className="space-y-1.5 px-3 pb-3 text-[12px] leading-snug text-zinc-200">
                  <p>
                    <span className="font-semibold text-white">{username}</span>{" "}
                    <span className="text-zinc-300">{caption.slice(0, 220)}</span>
                    {caption.length > 220 ? (
                      <span className="text-zinc-500"> … daha fazla</span>
                    ) : null}
                  </p>
                  <HashtagRow tags={hashtags} />
                  <p className="text-[10px] font-medium uppercase tracking-wide text-pink-300/90">
                    {cta}
                  </p>
                  {scheduledLabel ? (
                    <p className="text-[10px] text-zinc-500">{scheduledLabel}</p>
                  ) : null}
                  <p className="border-t border-white/[0.06] pt-2 text-[10px] text-zinc-500">
                    {engage.likes} beğeni · {engage.comments} yorum · {engage.saves} kaydet
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="relative mx-auto aspect-[9/16] w-[min(100%,240px)] overflow-hidden rounded-2xl border border-cyan-500/20 bg-black shadow-[0_24px_60px_-12px_rgba(34,211,238,0.25)]"
              >
                {imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-cyan-950/40 to-black text-xs text-muted-foreground">
                    AI görsel atanmadı
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/85" />

                <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-3 py-2 text-[10px] text-white/90">
                  <span className="rounded-full bg-black/45 px-2 py-0.5 backdrop-blur-md">For You</span>
                  <span className="flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 backdrop-blur-md">
                    <Music2 className="h-3 w-3" />
                    Nexora Sound
                  </span>
                </div>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/25 bg-black/40 backdrop-blur-md transition-transform hover:scale-105">
                    <Play className="ml-0.5 h-8 w-8 text-white drop-shadow-lg" fill="currentColor" />
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-3 pr-12">
                  <p className="text-lg font-bold leading-tight text-white drop-shadow-md line-clamp-4">
                    {hook}
                  </p>
                  <p className="mt-2 text-[11px] leading-relaxed text-white/85 line-clamp-2 drop-shadow">
                    {caption.slice(0, 120)}
                    {caption.length > 120 ? "…" : ""}
                  </p>
                  <HashtagRow tags={hashtags.slice(0, 8)} />
                  <p className="mt-1 text-[10px] font-semibold text-cyan-200">{cta}</p>
                  {scheduledLabel ? (
                    <p className="mt-1 text-[10px] text-white/55">{scheduledLabel}</p>
                  ) : null}
                </div>

                <div className="absolute bottom-20 right-2 flex flex-col items-center gap-4 text-white">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/35 text-[10px] font-bold backdrop-blur-md">
                    {initials(displayName)}
                  </div>
                  <Heart className="h-6 w-6 drop-shadow-md" />
                  <MessageCircle className="h-6 w-6 drop-shadow-md" />
                  <Share2 className="h-6 w-6 drop-shadow-md" />
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
