import type { GrowthStrategyPayload } from "@/lib/operator/discovery-types";
import type { CreativeEnginePayload } from "@/lib/openai/creative-engine";

/** Planlı yayına yazılan operator snapshot (kart UI + strateji bağlantısı). */
export function buildScheduledPostOperatorContext(input: {
  growth: GrowthStrategyPayload;
  pack: CreativeEnginePayload;
  pillarLabel: string;
  platform: string;
}): Record<string, unknown> {
  return {
    version: "creative_growth_os_v1",
    growth_strategy_summary: input.growth.strategy_summary,
    content_pillar: input.pillarLabel,
    platform: input.platform,
    viral_hook_primary: input.pack.viralHookPrimary,
    publish_reason: input.pack.publishReason,
    ai_reasoning: input.pack.aiReasoning,
    algorithm_behavior: input.pack.algorithmBehaviorTarget,
    publishing_strategy: input.pack.publishingStrategy,
    creative_strategy: input.pack.creativeStrategy,
    recommended_hook_style: input.growth.recommended_hook_style,
  };
}
