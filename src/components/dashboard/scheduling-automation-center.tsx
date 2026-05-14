"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  CalendarClock,
  ChevronDown,
  Clapperboard,
  Hash,
  ImageIcon,
  Layers,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SocialPreviewCard } from "@/components/dashboard/social-preview-card";
import { ConnectedPlatformsCard } from "@/components/dashboard/connected-platforms-card";
import { PublishSyncButton } from "@/components/dashboard/publish-sync-button";
import { ScheduledPublishLinkRow } from "@/components/dashboard/scheduled-publish-link-row";
import { humanizePublishStatusTr } from "@/lib/dashboard/publish-status-ui";
import { parseCreativePackFromRow } from "@/lib/openai/creative-pack-utils";
import { cn } from "@/lib/utils";
import type { DashboardBufferSnapshot, ScheduledPostWithAi } from "@/types/database";

const personaLabel: Record<string, string> = {
  creator: "İçerik Üreticisi",
  ecommerce: "Ürün Satan Marka",
  personal_brand: "Kişisel Marka",
  business: "İşletme",
};

function labelPersona(p: string | null | undefined): string {
  if (!p) return "Persona";
  return personaLabel[p] ?? p;
}

function labelCreativeType(t: string | null | undefined): string {
  if (!t) return "İçerik";
  if (t === "scheduled_hook") return "Planlı hook";
  if (t === "creative_engine_v1") return "Creative Engine";
  return t.replace(/_/g, " ");
}

function formatScheduled(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function strategySummaryLines(
  postOperatorContext: Record<string, unknown> | null | undefined,
  userStrategy: Record<string, unknown> | null,
  postGoal: string | null,
): string[] {
  const lines: string[] = [];
  if (postOperatorContext && typeof postOperatorContext === "object") {
    const gs = postOperatorContext.growth_strategy_summary;
    if (typeof gs === "string" && gs.trim()) lines.push(gs.trim());
    const pillar = postOperatorContext.content_pillar;
    if (typeof pillar === "string" && pillar.trim()) lines.push(`İçerik sütunu: ${pillar.trim()}`);
    const pub = postOperatorContext.publishing_strategy;
    if (typeof pub === "string" && pub.trim()) {
      const t = pub.trim();
      lines.push(t.length > 220 ? `${t.slice(0, 220)}…` : t);
    }
    const rs = postOperatorContext.recommended_hook_style;
    if (typeof rs === "string" && rs.trim()) lines.push(`Önerilen hook stili: ${rs.trim()}`);
  }
  if (userStrategy && typeof userStrategy === "object") {
    const g = userStrategy.goal;
    const p = userStrategy.persona;
    const sh = userStrategy.summary_hook;
    const v = userStrategy.version;
    if (typeof g === "string" && g) lines.push(`Son strateji hedefi: ${g}`);
    if (typeof p === "string" && p) lines.push(`Strateji persona: ${labelPersona(p)}`);
    if (typeof sh === "string" && sh) lines.push(`Özet açılış: ${sh}`);
    if (typeof v === "string" && v) lines.push(`Motor sürümü: ${v}`);
  }
  if (postGoal && !lines.some((l) => l.includes(postGoal))) {
    lines.unshift(`Üretim hedefi: ${postGoal}`);
  }
  return lines;
}

function DetailBlock({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/[0.07] bg-gradient-to-br from-white/[0.04] to-transparent p-3 shadow-inner backdrop-blur-md",
        className,
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-200/75">
        {label}
      </p>
      <div className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}

function ScheduledAutomationCard({
  post,
  expanded,
  onToggle,
  userAiStrategy,
  userDisplayName,
  instagramHandle,
  tiktokHandle,
  publish,
}: {
  post: ScheduledPostWithAi;
  expanded: boolean;
  onToggle: () => void;
  userAiStrategy: Record<string, unknown> | null;
  userDisplayName: string;
  instagramHandle: string;
  tiktokHandle: string;
  publish: DashboardBufferSnapshot;
}) {
  const g = post.ai_generation;
  const pack = g
    ? parseCreativePackFromRow(g.creative_pack, g.caption, g.hashtags ?? [])
    : null;

  const caption = g?.caption?.trim() || post.body_preview?.trim() || "—";
  const hashtags = g?.hashtags?.length ? g.hashtags : pack?.hashtags ?? [];
  const opCtx = post.operator_context;
  const hookFromSnap =
    typeof opCtx?.viral_hook_primary === "string" ? opCtx.viral_hook_primary.trim() : "";
  const hook =
    hookFromSnap ||
    pack?.hooks?.[0] ||
    pack?.salesHooks?.[0] ||
    post.body_preview?.trim() ||
    "—";
  const cta =
    pack?.ctas?.[0] ??
    (pack?.ctas?.length ? pack.ctas.filter(Boolean).join(" · ") : null) ??
    "—";
  const ctaDisplay = typeof cta === "string" ? cta : String(cta ?? "—");
  const algo =
    pack?.algorithmBehaviorTarget?.trim() ||
    (typeof opCtx?.algorithm_behavior === "string" ? opCtx.algorithm_behavior.trim() : "") ||
    null;
  const publishReasonText =
    (typeof opCtx?.publish_reason === "string" && opCtx.publish_reason.trim()) ||
    pack?.publishReason?.trim() ||
    null;
  const aiReasoningText =
    (typeof opCtx?.ai_reasoning === "string" && opCtx.ai_reasoning.trim()) ||
    pack?.aiReasoning?.trim() ||
    null;
  const carouselSlidesCount = Math.min(5, Math.max(1, pack?.carouselIdeas?.length ?? 3));
  const carousel =
    pack?.carouselIdeas?.length ? pack.carouselIdeas.filter(Boolean).join("\n\n") : "—";
  const reels =
    pack?.reelsConcepts?.length ? pack.reelsConcepts.filter(Boolean).join("\n\n") : "—";
  const reelsScenario = pack?.reelsScenario?.trim() || reels;
  const shortVideo = g?.short_video_idea?.trim() || pack?.shortVideoIdea || "—";
  const contentIdea = g?.content_idea?.trim() || pack?.contentIdea || "—";
  const persona = post.persona ?? g?.persona ?? null;
  const creativeType = post.creative_type ?? g?.creative_type ?? null;

  const strategyLines = strategySummaryLines(post.operator_context, userAiStrategy, g?.goal ?? null);

  const viralReady =
    (pack?.hooks?.length ?? 0) > 0 ||
    (pack?.salesHooks?.length ?? 0) > 0 ||
    (pack?.viralIdeas?.length ?? 0) > 0;
  const captionReady = Boolean(g?.caption?.trim());

  const platformLower = post.platform.toLowerCase();
  const isIg = platformLower.includes("instagram");

  return (
    <motion.article
      layout
      className={cn(
        "group relative overflow-hidden rounded-2xl border transition-all duration-300",
        expanded
          ? "border-violet-500/35 bg-white/[0.04] shadow-[0_0_40px_-12px_rgba(139,92,246,0.45)]"
          : "border-white/[0.08] bg-white/[0.02] hover:border-violet-500/25 hover:bg-white/[0.035]",
      )}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-600/10 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="relative z-[1] flex w-full flex-col gap-3 p-4 text-left sm:p-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge
                variant="outline"
                className={cn(
                  "border text-[10px]",
                  isIg
                    ? "border-pink-500/25 bg-pink-500/10 text-pink-200"
                    : "border-cyan-500/25 bg-cyan-500/10 text-cyan-200",
                )}
              >
                {post.platform}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                {labelCreativeType(creativeType)}
              </Badge>
              {persona ? (
                <Badge variant="outline" className="border-white/15 text-[10px] text-violet-100/90">
                  {labelPersona(persona)}
                </Badge>
              ) : null}
              {viralReady ? (
                <Badge variant="success" className="gap-0.5 text-[10px]">
                  <Zap className="h-3 w-3" />
                  Viral hook hazır
                </Badge>
              ) : captionReady ? (
                <Badge variant="secondary" className="text-[10px]">
                  Caption hazır
                </Badge>
              ) : (
                <Badge variant="warning" className="text-[10px]">
                  Taslak önizleme
                </Badge>
              )}
              {post.buffer_post_id ? (
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-100"
                >
                  AI yayın · {humanizePublishStatusTr(post.publish_status ?? "scheduled")}
                </Badge>
              ) : publish.configured ? (
                <Badge variant="outline" className="border-white/15 text-[10px] text-muted-foreground">
                  Otonom yayın bekliyor
                </Badge>
              ) : null}
            </div>
            <p className="font-display text-base font-semibold tracking-tight text-foreground/95 sm:text-lg">
              {post.title}
            </p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="h-3.5 w-3.5 text-violet-300/80" />
                {formatScheduled(post.scheduled_for)}
              </span>
              <span className="text-white/15">·</span>
              <span className="capitalize">{post.status}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {post.creative_preview_url ? (
              <span className="relative h-11 w-11 overflow-hidden rounded-lg border border-white/15 shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.creative_preview_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-0.5 right-0.5 rounded bg-black/65 p-0.5">
                  <ImageIcon className="h-2.5 w-2.5 text-violet-200" />
                </span>
              </span>
            ) : null}
            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/30 text-muted-foreground backdrop-blur-sm"
            >
              <ChevronDown className="h-4 w-4" />
            </motion.span>
          </div>
        </div>

        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground/90">
          {post.body_preview?.trim() || caption.slice(0, 160)}
          {(post.body_preview?.length ?? 0) > 120 || caption.length > 160 ? "…" : ""}
        </p>
      </button>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden border-t border-white/[0.06]"
          >
            <div className="relative z-[1] space-y-4 p-4 pt-0 sm:p-5 sm:pt-0">
              <SocialPreviewCard
                imageUrl={post.creative_preview_url}
                caption={caption}
                hashtags={Array.isArray(hashtags) ? hashtags : []}
                hook={pack?.viralHookPrimary?.trim() || hook}
                cta={ctaDisplay}
                scheduledLabel={formatScheduled(post.scheduled_for)}
                algorithmTarget={algo}
                publishReason={publishReasonText}
                aiReasoning={aiReasoningText}
                usernameInstagram={instagramHandle}
                usernameTiktok={tiktokHandle}
                displayName={userDisplayName}
                carouselSlides={carouselSlidesCount}
                sectionTitle="Canlı sosyal medya önizlemesi"
                sectionSubtitle="Planlı yayın — Instagram / TikTok feed simülasyonu."
                className="ring-1 ring-white/[0.04]"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailBlock label="Otonom yayın hattı">
                  {post.buffer_post_id ? (
                    <div className="space-y-2 text-xs">
                      <p>
                        <span className="text-muted-foreground">Yayın eşlemesi:</span>{" "}
                        <span className="font-mono text-violet-100/90">{post.buffer_post_id}</span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Kanal:</span>{" "}
                        <span className="font-mono text-violet-100/90">
                          {post.buffer_channel_id ?? "—"}
                        </span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Durum:</span>{" "}
                        <span className="font-medium text-foreground/90">
                          {humanizePublishStatusTr(post.publish_status)}
                        </span>
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Kuyruk ve yayın durumu Nexora tarafından senkronize edilir; üstteki &quot;Yayın
                        durumunu yenile&quot; ile güncelleyin.
                      </p>
                    </div>
                  ) : post.source_ai_generation_id ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Bu plan henüz otonom yayın hattına bağlı değil. AI içeriğini yayına almak için
                        aşağıdan hedef kanalı seçin.
                      </p>
                      <ScheduledPublishLinkRow postId={post.id} publish={publish} />
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      AI üretim bağlantısı olmadan otonom yayın eşlemesi yapılamıyor.
                    </p>
                  )}
                </DetailBlock>
                <DetailBlock label="Caption (AI)">
                  <p className="whitespace-pre-wrap break-words text-foreground/90">{caption}</p>
                </DetailBlock>
                <DetailBlock label="Hashtag listesi">
                  <p className="break-words font-mono text-xs text-violet-100/85">
                    {hashtags.length ? hashtags.join(" ") : "—"}
                  </p>
                </DetailBlock>
                <DetailBlock label="Viral hook (öne çıkan)">
                  <p className="break-words font-medium text-foreground/90">
                    {pack?.viralHookPrimary?.trim() || hook}
                  </p>
                </DetailBlock>
                <DetailBlock label="Hashtag kümeleri" className="sm:col-span-2">
                  <ul className="space-y-2">
                    {(pack?.hashtagClusters?.length ? pack.hashtagClusters : [hashtags.join(" ")]).map(
                      (cluster, idx) => (
                        <li key={idx} className="font-mono text-xs text-violet-100/85">
                          {cluster}
                        </li>
                      ),
                    )}
                  </ul>
                </DetailBlock>
                <DetailBlock label="Yayın stratejisi" className="sm:col-span-2">
                  <p className="break-words text-foreground/90">
                    {pack?.publishingStrategy?.trim() || pack?.creativeStrategy?.trim() || "—"}
                  </p>
                </DetailBlock>
                <DetailBlock label="Hedef algoritma davranışı" className="sm:col-span-2">
                  <p className="break-words">
                    {pack?.algorithmBehaviorTarget?.trim() ||
                      (typeof opCtx?.algorithm_behavior === "string" && opCtx.algorithm_behavior.trim()) ||
                      "—"}
                  </p>
                </DetailBlock>
                <DetailBlock label="CTA önerisi">
                  <p className="break-words">{cta}</p>
                </DetailBlock>
                <DetailBlock label="İçerik tipi">
                  <span className="text-foreground/90">{labelCreativeType(creativeType)}</span>
                </DetailBlock>
                <DetailBlock label="Hedef platform">
                  <span className="text-foreground/90">{post.platform}</span>
                </DetailBlock>
                <DetailBlock label="Persona tipi">
                  <span className="text-foreground/90">{labelPersona(persona)}</span>
                </DetailBlock>
                <DetailBlock label="Paylaşım zamanı">
                  <span className="text-foreground/90">{formatScheduled(post.scheduled_for)}</span>
                </DetailBlock>
                <DetailBlock label="Creative strategy (AI)" className="sm:col-span-2">
                  <p className="break-words text-foreground/90">
                    {pack?.creativeStrategy?.trim() || "—"}
                  </p>
                </DetailBlock>
                <DetailBlock label="Paylaşım nedeni" className="sm:col-span-2">
                  <p className="break-words">
                    {(typeof opCtx?.publish_reason === "string" && opCtx.publish_reason.trim()) ||
                      pack?.publishReason?.trim() ||
                      "—"}
                  </p>
                </DetailBlock>
                <DetailBlock label="AI reasoning (operatör)" className="sm:col-span-2">
                  <p className="break-words text-foreground/88">
                    {(typeof opCtx?.ai_reasoning === "string" && opCtx.ai_reasoning.trim()) ||
                      pack?.aiReasoning?.trim() ||
                      "—"}
                  </p>
                </DetailBlock>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailBlock label="Kısa video fikri" className="sm:col-span-1">
                  <p className="flex items-start gap-2 break-words">
                    <Clapperboard className="mt-0.5 h-4 w-4 shrink-0 text-violet-300/80" />
                    <span>{shortVideo}</span>
                  </p>
                </DetailBlock>
                <DetailBlock label="Carousel / seri içerik" className="sm:col-span-1">
                  <p className="flex items-start gap-2 break-words">
                    <Layers className="mt-0.5 h-4 w-4 shrink-0 text-violet-300/80" />
                    <span>{carousel}</span>
                  </p>
                </DetailBlock>
                <DetailBlock label="Reels senaryosu" className="sm:col-span-2">
                  <p className="flex items-start gap-2 break-words">
                    <Hash className="mt-0.5 h-4 w-4 shrink-0 text-violet-300/80" />
                    <span>{reelsScenario}</span>
                  </p>
                </DetailBlock>
                <DetailBlock label="Reels konsept listesi" className="sm:col-span-2">
                  <p className="flex items-start gap-2 break-words">
                    <Hash className="mt-0.5 h-4 w-4 shrink-0 text-violet-300/80" />
                    <span>{reels}</span>
                  </p>
                </DetailBlock>
                <DetailBlock label="Gönderi fikri (özet)" className="sm:col-span-2">
                  <p className="break-words">{contentIdea}</p>
                </DetailBlock>
              </div>

              <DetailBlock label="AI strateji özeti">
                <div className="flex items-start gap-2">
                  <Bot className="mt-0.5 h-4 w-4 shrink-0 text-amber-200/90" />
                  <ul className="list-inside list-disc space-y-1.5 text-xs sm:text-sm">
                    {strategyLines.length ? (
                      strategyLines.map((line, idx) => (
                        <li key={idx} className="break-words marker:text-violet-400/80">
                          {line}
                        </li>
                      ))
                    ) : (
                      <li>
                        Strateji özeti profil kaydında yok; Creative Engine ile yeni paket ürettiğinizde
                        burada görünecek.
                      </li>
                    )}
                  </ul>
                </div>
              </DetailBlock>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
}

function EmptyAutomationHero({
  onboardingDone,
}: {
  onboardingDone: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-950/40 via-black/50 to-black/80 p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.22),transparent_55%)]" />
      <div className="pointer-events-none absolute -bottom-24 left-1/2 h-48 w-[120%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.12),transparent_65%)]" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] text-violet-100/90 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-amber-200" />
            AI Automation Center
          </div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Pipeline hazır, sıra içerikte
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Planlı yayınlar burada görünür; her kart Creative Engine çıktısıyla bağlanır. Önce bir paket
            üretin — caption, hook ve Reels fikirleri otomatik olarak bu ekrana düşer.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button asChild className="shadow-glow">
              <Link href="/dashboard/ai-content">Creative Engine&apos;e git</Link>
            </Button>
            {!onboardingDone ? (
              <Button asChild variant="outline" className="border-white/15 bg-white/[0.03]">
                <Link href="/onboarding">Kurulumu tamamla</Link>
              </Button>
            ) : null}
          </div>
        </div>
        <div className="grid w-full max-w-sm shrink-0 grid-cols-2 gap-3 sm:grid-cols-2">
          {[
            { icon: Target, label: "Kuyruk", value: "0 plan" },
            { icon: Zap, label: "Hook durumu", value: "Beklemede" },
            { icon: Clapperboard, label: "Video fikri", value: "Üretim sonrası" },
            { icon: Bot, label: "Motor", value: "Aktif" },
          ].map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="rounded-xl border border-white/[0.08] bg-black/40 p-4 backdrop-blur-md transition-colors hover:border-violet-500/20"
            >
              <Icon className="h-4 w-4 text-violet-300/80" />
              <p className="mt-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
              <p className="mt-1 font-display text-sm font-semibold text-foreground/95">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function SchedulingAutomationCenter({
  posts,
  userPersona,
  userAiStrategy,
  onboardingCompletedAt,
  userDisplayName,
  instagramHandle,
  tiktokHandle,
  buffer,
}: {
  posts: ScheduledPostWithAi[];
  userPersona: string | null;
  userAiStrategy: Record<string, unknown> | null;
  onboardingCompletedAt: string | null;
  userDisplayName: string;
  instagramHandle: string;
  tiktokHandle: string;
  buffer: DashboardBufferSnapshot;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const onboardingDone = Boolean(onboardingCompletedAt);

  const nextLabel = useMemo(() => {
    const upcoming = posts.find((p) => new Date(p.scheduled_for).getTime() > Date.now());
    return upcoming ? formatScheduled(upcoming.scheduled_for) : null;
  }, [posts]);

  return (
    <div className="space-y-8">
      <ConnectedPlatformsCard publish={buffer} />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 shadow-inner-glow backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 text-violet-200">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">Otomasyon merkezi</h2>
            <p className="mt-1 max-w-lg text-xs leading-relaxed text-muted-foreground">
              Planlar Nexora’da; otonom yayın hattı ile gerçek kuyruk ve yayın durumu eşlenir. Kartları
              genişleterek canlı sosyal önizleme ve AI yayın alanını görün.
            </p>
            {userPersona ? (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Profil persona:{" "}
                <span className="text-violet-200/90">{labelPersona(userPersona)}</span>
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:items-end">
          <PublishSyncButton />
          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            <div className="rounded-xl border border-white/[0.07] bg-black/35 px-4 py-2.5 text-center backdrop-blur-md">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Nexora kuyruk
              </p>
              <p className="font-display text-xl font-semibold text-foreground">{posts.length}</p>
            </div>
            <div className="rounded-xl border border-violet-500/15 bg-violet-500/[0.07] px-4 py-2.5 text-center backdrop-blur-md">
              <p className="text-[10px] font-medium uppercase tracking-wider text-violet-200/80">
                AI hatta
              </p>
              <p className="font-display text-xl font-semibold text-violet-50">
                {buffer.pipeline.bufferLinkedTotal}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.07] px-4 py-2.5 text-center backdrop-blur-md">
              <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-200/80">
                Sonraki slot
              </p>
              <p className="text-sm font-medium text-emerald-100/95">{nextLabel ?? "—"}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {posts.length === 0 ? (
        <EmptyAutomationHero onboardingDone={onboardingDone} />
      ) : (
        <ul className="grid list-none gap-4 md:grid-cols-2">
          {posts.map((post, i) => (
            <motion.li
              key={post.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: Math.min(i * 0.05, 0.35),
                duration: 0.4,
                ease: [0.4, 0, 0.2, 1],
              }}
            >
              <ScheduledAutomationCard
                post={post}
                expanded={openId === post.id}
                onToggle={() => setOpenId((id) => (id === post.id ? null : post.id))}
                userAiStrategy={userAiStrategy}
                userDisplayName={userDisplayName}
                instagramHandle={instagramHandle}
                tiktokHandle={tiktokHandle}
                publish={buffer}
              />
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
