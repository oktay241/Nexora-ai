import type { DiscoveryProfile, GrowthStrategyPayload } from "@/lib/operator/discovery-types";
import { mergeDiscoveryProfile } from "@/lib/openai/discovery-engine";
import { mergeGrowthStrategy } from "@/lib/openai/growth-strategy-engine";
import { parseCreativePack } from "@/lib/openai/creative-pack-utils";
import type {
  AiGenerationRow,
  DashboardBufferSnapshot,
  DashboardOperatorOverview,
  ScheduledPostRow,
} from "@/types/database";

function parseDiscovery(raw: unknown): DiscoveryProfile | null {
  return mergeDiscoveryProfile(raw);
}

function parseGrowth(raw: unknown): GrowthStrategyPayload | null {
  return mergeGrowthStrategy(raw);
}

function formatShortTr(iso: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function buildOperatorOverview(input: {
  user: {
    usage_mode?: string | null;
    discovery_profile?: unknown;
    growth_strategy?: unknown;
  };
  latestGen: AiGenerationRow | null;
  nextPost: ScheduledPostRow | null;
  /** Yayın altyapısı özeti (UI’da markasız kullanılır). */
  publish: DashboardBufferSnapshot;
}): DashboardOperatorOverview {
  const discovery = parseDiscovery(input.user.discovery_profile);
  const growth = parseGrowth(input.user.growth_strategy);
  const usageMode = input.user.usage_mode ?? null;
  const publish = input.publish;

  const pack = input.latestGen ? parseCreativePack(input.latestGen.creative_pack) : null;
  const hookTest = pack?.hooks?.[0] ?? growth?.next_experiment_hook ?? "Hook kuyruğu hazırlanıyor";

  const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}…` : s);

  const usableChannels = publish.channels.filter((c) => !c.isDisconnected && !c.isLocked);
  const accountLinked = Boolean(publish.configured && usableChannels.length > 0);
  const publishingActive = Boolean(
    publish.pipeline.bufferLinkedTotal > 0 ||
      publish.pipeline.queueLikely > 0 ||
      publish.pipeline.sent > 0,
  );
  const growthLoopActive = Boolean(input.latestGen || growth || discovery);
  const queueOptimizationActive = Boolean(publish.configured && publish.pipeline.queueLikely > 0);

  let nextAutonomousAt: string | null = null;
  let nextAutonomousTitle: string | null = null;
  if (input.nextPost) {
    nextAutonomousAt = input.nextPost.scheduled_for;
    nextAutonomousTitle = input.nextPost.title;
  }

  const liveSignals: DashboardOperatorOverview["liveSignals"] = (() => {
    if (!pack && !growth) return null;
    const testing =
      growth?.viral_hook_strategy?.[0] ?? growth?.next_experiment_hook ?? "Çok varyantlı hook testi";
    let optimizing =
      clip(
        pack?.algorithmBehaviorTarget?.trim() ||
          growth?.engagement_optimization?.trim() ||
          "Watch time, kaydet ve profil ziyareti sinyalleri üzerinde optimizasyon.",
        160,
      );
    if (queueOptimizationActive) {
      optimizing = `${optimizing} AI şu an kuyruk yoğunluğunu dengeleyerek tutma (retention) sinyalini güçlendiriyor.`;
    } else if (accountLinked && publish.pipeline.sent > 0) {
      optimizing = `${optimizing} Son performansa göre bir sonraki içerik varyantını seçiyor.`;
    }
    const hookSignal =
      pack?.viralHookPrimary?.trim() ||
      pack?.hooks?.[0]?.trim() ||
      growth?.recommended_hook_style?.trim() ||
      "Aktif hook sinyali toplanıyor.";
    let rationale =
      clip(
        pack?.aiReasoning?.trim() ||
          pack?.publishReason?.trim() ||
          growth?.why_this_direction?.trim() ||
          "Niş ve hedefle uyumlu içerik seçimi.",
        260,
      );
    if (input.nextPost && nextAutonomousAt) {
      rationale = `${rationale} Sıradaki otonom yayın ${formatShortTr(nextAutonomousAt)} için içerik hazır.`;
    }
    return { optimizing, testing, hookSignal, rationale };
  })();

  const loopActivities: DashboardOperatorOverview["loopActivities"] = [
    {
      id: "a1",
      title: "Analyze",
      detail: discovery
        ? `Niş: ${discovery.niche} · format: ${discovery.content_formats.slice(0, 3).join(", ")}`
        : "Hesap sinyalleri toplanıyor (MVP metin analizi).",
      pulse: true,
    },
    {
      id: "a2",
      title: "Learn",
      detail: discovery
        ? `Etkileşim paterni: ${discovery.engagement_pattern_hint.slice(0, 120)}${discovery.engagement_pattern_hint.length > 120 ? "…" : ""}`
        : "Öğrenme katmanı veri bekliyor.",
      pulse: false,
    },
    {
      id: "a3",
      title: "Generate",
      detail: input.latestGen
        ? pack?.creativeStrategy?.trim()
          ? clip(pack.creativeStrategy, 120)
          : `Son paket: ${input.latestGen.caption.slice(0, 72)}…`
        : "İçerik üretim motoru bekmede.",
      pulse: Boolean(input.latestGen),
    },
    {
      id: "a4",
      title: "Optimize",
      detail: growth
        ? liveSignals?.optimizing?.trim()
          ? clip(liveSignals.optimizing, 120)
          : `Hook stili: ${growth.recommended_hook_style.slice(0, 100)}`
        : "Strateji optimizasyonu için growth profili gerekli.",
      pulse: Boolean(growth),
    },
    {
      id: "a5",
      title: "Test hook",
      detail: clip(hookTest, 140),
      pulse: true,
    },
  ];

  let nextScheduled: DashboardOperatorOverview["nextScheduled"] = null;
  if (input.nextPost) {
    const snap = input.nextPost.operator_context;
    const publishFromSnap =
      snap && typeof snap === "object"
        ? String((snap as Record<string, unknown>).publish_reason ?? "").trim()
        : "";
    const why =
      publishFromSnap ||
      pack?.publishReason?.trim() ||
      growth?.why_this_direction?.trim() ||
      "Strateji ve niş ile uyumlu sıradaki yayın.";
    nextScheduled = {
      at: input.nextPost.scheduled_for,
      title: input.nextPost.title,
      platform: input.nextPost.platform,
      why,
    };
  }

  const cognitionFeed: DashboardOperatorOverview["cognitionFeed"] = (() => {
    const lines: Array<{ id: string; text: string }> = [];
    if (queueOptimizationActive) {
      lines.push({
        id: "cf1",
        text: "AI şu an hook tutma (retention) için varyantları optimize ediyor — sıradaki yayın için en güçlü açılışı seçiyor.",
      });
    } else {
      lines.push({
        id: "cf1",
        text: "AI içerik-öncelik skorunu güncelliyor; bir sonraki otonom turda daha keskin hook denemesi planlanıyor.",
      });
    }
    if (accountLinked && input.nextPost && nextAutonomousAt) {
      lines.push({
        id: "cf2",
        text: `AI daha yüksek etkileşim penceresi tespit etti; sonraki otonom yayın ${formatShortTr(nextAutonomousAt)} için hazırlanıyor.`,
      });
    } else {
      lines.push({
        id: "cf2",
        text: "AI yayın zamanı sinyallerini tarıyor; bağlı platformlarda en iyi görünürlük aralığını arıyor.",
      });
    }
    if (input.nextPost && nextAutonomousTitle) {
      lines.push({
        id: "cf3",
        text: `Sonraki otonom gönderi hazır: “${clip(nextAutonomousTitle, 72)}”.`,
      });
    } else {
      lines.push({
        id: "cf3",
        text: "Sonraki otonom gönderi kuyruğu için içerik taslağı oluşturuluyor.",
      });
    }
    lines.push({
      id: "cf4",
      text: publishingActive
        ? "AI büyüme döngüsü çalışıyor: performans geri bildirimine göre strateji uyarlanıyor."
        : "AI strateji tabanı hazır; otonom yayın hattı aktifleştikçe döngü hızlanacak.",
    });
    return lines.slice(0, 4);
  })();

  const aiAutopilot: DashboardOperatorOverview["aiAutopilot"] = {
    accountLinked,
    publishingActive,
    nextAutonomousAt,
    nextAutonomousTitle,
    growthLoopActive,
    queueOptimizationActive,
  };

  return {
    usageMode,
    discovery,
    growth,
    loopActivities,
    nextScheduled,
    liveSignals,
    aiAutopilot,
    cognitionFeed,
  };
}
