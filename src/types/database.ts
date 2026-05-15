/** Veritabanı satırları için uygulama içi tipler (Supabase CLI generate ile değiştirilebilir). */

import type { DashboardPersonaUi } from "@/lib/dashboard/persona-ui";
import type { DiscoveryProfile, GrowthStrategyPayload } from "@/lib/operator/discovery-types";

export type UserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  persona: string | null;
  onboarding_context: Record<string, unknown> | null;
  product_description: string | null;
  product_image_path: string | null;
  onboarding_completed_at: string | null;
  content_niche: string | null;
  content_tone: string | null;
  target_audience: string | null;
  target_platform: string | null;
  brand_description: string | null;
  ai_strategy: Record<string, unknown> | null;
  content_pillars: unknown;
  viral_hooks: unknown;
  usage_mode: string | null;
  instagram_profile_input: string | null;
  tiktok_profile_input: string | null;
  profile_bio_note: string | null;
  discovery_profile: Record<string, unknown> | null;
  growth_strategy: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type GrowthGoalRow = {
  id: string;
  user_id: string;
  goal_key: string;
  created_at: string;
};

export type ConnectedAccountRow = {
  id: string;
  user_id: string;
  platform: "instagram" | "tiktok";
  handle: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

/** Meta / Instagram native OAuth token store (migrations 009+ / 011 consolidated). */
export type ConnectedSocialAccountRow = {
  id: string;
  user_id: string;
  platform: "instagram" | "tiktok";
  platform_user_id: string | null;
  username: string | null;
  access_token: string;
  refresh_token: string | null;
  /** Legacy alias; kept in sync with token_expires_at via DB trigger (migration 011). */
  expires_at: string | null;
  token_expires_at: string | null;
  token_type: string | null;
  meta_page_id: string | null;
  instagram_business_id: string | null;
  /** Canonical Graph IG user id; mirrored with instagram_business_id (migration 011). */
  instagram_business_account_id: string | null;
  account_type: string | null;
  autopilot_enabled: boolean | null;
  last_publish_at: string | null;
  last_publish_status: string | null;
  created_at: string;
  updated_at: string;
};

export type AiGenerationRow = {
  id: string;
  user_id: string;
  goal: string | null;
  product_description: string | null;
  product_image_path: string | null;
  caption: string;
  hashtags: string[];
  content_idea: string;
  short_video_idea: string;
  model: string;
  creative_pack: Record<string, unknown> | null;
  persona: string | null;
  creative_type: string | null;
  created_at: string;
};

export type ScheduledPostRow = {
  id: string;
  user_id: string;
  platform: string;
  title: string;
  body_preview: string | null;
  scheduled_for: string;
  status: string;
  source_ai_generation_id: string | null;
  /** Denormalized AI generation pointer; synced with source_ai_generation_id (migration 011). */
  generation_id: string | null;
  /** Image URL used for native Instagram publish (signed URL snapshot). */
  image_url: string | null;
  /** Full caption including hashtags at publish time. */
  caption: string | null;
  persona: string | null;
  creative_type: string | null;
  /** Plan anındaki strateji / hook / reasoning snapshot (migration 006+). */
  operator_context?: Record<string, unknown> | null;
  /** Buffer GraphQL Post id (migration 008+). */
  buffer_post_id?: string | null;
  buffer_channel_id?: string | null;
  /** Native: queued | publishing | published | failed; legacy Buffer değerleri de olabilir */
  publish_status?: string | null;
  instagram_media_id?: string | null;
  publish_error?: string | null;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
};

/** Planlı yayın + ilişkili AI üretim özeti (otomatik paylaşım ekranı). */
export type AiGenerationScheduleSnippet = Pick<
  AiGenerationRow,
  | "id"
  | "caption"
  | "hashtags"
  | "content_idea"
  | "short_video_idea"
  | "creative_pack"
  | "persona"
  | "goal"
  | "creative_type"
>;

export type ScheduledPostWithAi = ScheduledPostRow & {
  ai_generation: AiGenerationScheduleSnippet | null;
  /** İlgili AI üretimine bağlı son görsel önizlemesi (signed URL, kısa ömür). */
  creative_preview_url: string | null;
};

export type AiCreativeRow = {
  id: string;
  user_id: string;
  ai_generation_id: string | null;
  storage_path: string;
  prompt: string | null;
  style_preset: string | null;
  created_at: string;
};

/** @deprecated Tablo adı ai_creatives; tip AiCreativeRow kullanın. */
export type AiCreativeImageRow = AiCreativeRow;

export type AnalyticsRow = {
  id: string;
  user_id: string;
  platform: string;
  metric_date: string;
  impressions: number;
  reach: number;
  engagements: number;
  followers: number;
  saves?: number;
  shares?: number;
  profile_visits?: number;
  video_views?: number;
  meta: Record<string, unknown>;
  created_at: string;
};

export type DashboardSocialLivePreview = {
  imageUrl: string | null;
  caption: string;
  hashtags: string[];
  hook: string;
  cta: string;
  algorithmTarget: string | null;
  publishReason: string | null;
  aiReasoning: string | null;
  usernameInstagram: string;
  usernameTiktok: string;
  displayName: string;
  carouselSlides: number;
};

/** Dashboard operatör özeti (AI operation center). */
export type DashboardOperatorOverview = {
  usageMode: string | null;
  discovery: DiscoveryProfile | null;
  growth: GrowthStrategyPayload | null;
  loopActivities: Array<{ id: string; title: string; detail: string; pulse: boolean }>;
  nextScheduled: { at: string; title: string; platform: string; why: string } | null;
  /** Operation Center — yaşayan operatör sinyalleri. */
  liveSignals: {
    optimizing: string;
    testing: string;
    hookSignal: string;
    rationale: string;
  } | null;
  /** Nexora AI Autopilot — kullanıcıya görünen otonom yayın hissi (altyapı markasız). */
  aiAutopilot: {
    accountLinked: boolean;
    publishingActive: boolean;
    nextAutonomousAt: string | null;
    nextAutonomousTitle: string | null;
    growthLoopActive: boolean;
    queueOptimizationActive: boolean;
  };
  /** Kısa “canlı operatör” cümleleri — Operation Center nabzı. */
  cognitionFeed: Array<{ id: string; text: string }>;
};

export type DashboardBufferChannel = {
  id: string;
  name: string;
  service: string;
  descriptor: string;
  isDisconnected: boolean;
  isLocked: boolean;
};

export type DashboardBufferSnapshot = {
  configured: boolean;
  error: string | null;
  organizations: Array<{ id: string; name: string }>;
  channels: DashboardBufferChannel[];
  pipeline: {
    bufferLinkedTotal: number;
    byPublishStatus: Record<string, number>;
    queueLikely: number;
    sent: number;
    errors: number;
  };
};

export type DashboardOverview = {
  user: UserRow;
  growthGoal: GrowthGoalRow | null;
  connectedAccounts: ConnectedAccountRow[];
  recentGenerations: AiGenerationRow[];
  scheduledPosts: ScheduledPostRow[];
  analyticsSeries: AnalyticsRow[];
  buffer: DashboardBufferSnapshot;
  ui: DashboardPersonaUi;
  scores: {
    growth: number;
    viral: number;
    engagementRate: number;
    followerDeltaLabel: string;
    impressionsLabel: string;
  };
  activity: Array<{
    id: string;
    title: string;
    detail: string;
    time: string;
    tone: "success" | "info" | "warning";
  }>;
  insights: Array<{
    id: string;
    title: string;
    impact: "Yüksek" | "Orta" | "Düşük";
    summary: string;
  }>;
  contentPerformance: Array<{
    id: string;
    title: string;
    reach: string;
    er: string;
    score: number;
  }>;
  followerSeries: Array<{ label: string; value: number }>;
  operator: DashboardOperatorOverview;
  /** Son üretim için canlı sosyal önizleme verisi (yoksa null). */
  socialLivePreview: DashboardSocialLivePreview | null;
  /** Son üretilen AI görselleri (önizleme URL). */
  aiCreativePreviews: Array<{ id: string; url: string }>;
};
