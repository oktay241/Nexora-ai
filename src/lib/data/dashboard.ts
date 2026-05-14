import { createServerSupabaseClient } from "@/lib/supabase/server";
import { buildOperatorOverview } from "@/lib/dashboard/operator-overview";
import { getDashboardPersonaUi, getEmptyInsightSkeleton } from "@/lib/dashboard/persona-ui";
import { loadBufferDashboardSnapshot } from "@/lib/integrations/buffer/dashboard-slice";
import { syncBufferPublishStatusesForUser } from "@/lib/integrations/buffer/sync-post-statuses";
import { getBufferAccessToken } from "@/lib/env";
import { normalizePersona, type UserPersona } from "@/lib/onboarding/persona";
import { parseCreativePack } from "@/lib/openai/creative-pack-utils";
import type {
  AiGenerationRow,
  AiGenerationScheduleSnippet,
  AnalyticsRow,
  ConnectedAccountRow,
  DashboardOverview,
  GrowthGoalRow,
  ScheduledPostRow,
  ScheduledPostWithAi,
} from "@/types/database";

const weekdayTr = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatRelativeTr(iso: string): string {
  const sec = Math.max(
    0,
    Math.round((Date.now() - new Date(iso).getTime()) / 1000),
  );
  if (sec < 60) return `${sec} sn önce`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} dk önce`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} sa önce`;
  const day = Math.round(hr / 24);
  return `${day} gün önce`;
}

function formatNumberTr(n: number): string {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(n);
}

function hashScore(id: string, salt: number): number {
  let h = 0;
  const s = id + salt;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return 55 + (h % 40);
}

export async function getDashboardOverview(): Promise<DashboardOverview | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userRow, error: uErr } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();
  if (uErr || !userRow) return null;

  const { data: goal } = await supabase
    .from("growth_goals")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: connectedAccounts } = await supabase
    .from("connected_accounts")
    .select("*")
    .eq("user_id", user.id)
    .order("platform", { ascending: true });

  const { data: recentGenerations } = await supabase
    .from("ai_generations")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(12);

  const { data: scheduledPosts } = await supabase
    .from("scheduled_posts")
    .select("*")
    .eq("user_id", user.id)
    .order("scheduled_for", { ascending: true })
    .limit(20);

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 35);
  const sinceStr = since.toISOString().slice(0, 10);

  const { data: analyticsRows } = await supabase
    .from("analytics")
    .select("*")
    .eq("user_id", user.id)
    .gte("metric_date", sinceStr)
    .order("metric_date", { ascending: true });

  const analytics = (analyticsRows ?? []) as AnalyticsRow[];
  const persona = normalizePersona((userRow as { persona?: string | null }).persona);
  const ui = getDashboardPersonaUi(persona as UserPersona);
  const last7 = analytics.filter((a) => {
    const diff =
      (Date.now() - parseDate(a.metric_date).getTime()) / (86400 * 1000);
    return diff <= 8;
  });

  const igSeries = last7
    .filter((a) => a.platform === "Instagram")
    .slice(-7);
  const followerSeries = igSeries.map((r) => {
    const wd = weekdayTr[parseDate(r.metric_date).getUTCDay()] ?? "?";
    return {
      label: wd,
      value: Math.min(100, Math.round(r.reach / 25)),
    };
  });

  if (followerSeries.length === 0) {
    for (let i = 0; i < 7; i++) {
      followerSeries.push({ label: weekdayTr[(i + 1) % 7] ?? "?", value: 8 + i * 4 });
    }
  }

  let totalReach = 0;
  let totalEng = 0;
  let totalImp = 0;
  let lastFollowers = 0;
  let firstFollowers = 0;
  const byDate = new Map<string, AnalyticsRow[]>();
  for (const a of analytics) {
    totalReach += Number(a.reach);
    totalEng += Number(a.engagements);
    totalImp += Number(a.impressions);
    const list = byDate.get(a.metric_date) ?? [];
    list.push(a);
    byDate.set(a.metric_date, list);
  }
  const sortedDates = [...byDate.keys()].sort();
  if (sortedDates.length > 0) {
    const first = byDate.get(sortedDates[0]) ?? [];
    const last = byDate.get(sortedDates[sortedDates.length - 1]) ?? [];
    firstFollowers = first.reduce((s, r) => s + Number(r.followers), 0) / Math.max(1, first.length);
    lastFollowers = last.reduce((s, r) => s + Number(r.followers), 0) / Math.max(1, last.length);
  }

  const er = totalReach > 0 ? (totalEng / totalReach) * 100 : 0;
  const growth = Math.min(99, Math.round(42 + Math.log10(totalEng + 10) * 18));
  const viral = Math.min(99, Math.round(36 + Math.log10(totalImp + 10) * 14));

  let followerDeltaLabel = "Veri toplanıyor";
  if (firstFollowers > 0 && lastFollowers > 0) {
    const pct = ((lastFollowers - firstFollowers) / firstFollowers) * 100;
    followerDeltaLabel = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}% (takipçi proxy)`;
  }

  const gens = (recentGenerations ?? []) as AiGenerationRow[];
  const sched = (scheduledPosts ?? []) as ScheduledPostRow[];

  type Act = {
    id: string;
    title: string;
    detail: string;
    time: string;
    tone: "success" | "info" | "warning";
    ts: number;
  };

  const rawActs: Act[] = [
    ...gens.slice(0, 8).map((g) => ({
      id: `gen-${g.id}`,
      title: ui.activityGenTitle,
      detail: g.caption.slice(0, 72) + (g.caption.length > 72 ? "…" : ""),
      time: formatRelativeTr(g.created_at),
      tone: "info" as const,
      ts: new Date(g.created_at).getTime(),
    })),
    ...sched.slice(0, 8).map((p) => ({
      id: `post-${p.id}`,
      title: "Yayın planlandı",
      detail: `${p.platform} · ${p.title}`,
      time: formatRelativeTr(p.created_at),
      tone: "success" as const,
      ts: new Date(p.created_at).getTime(),
    })),
  ];

  const activity = rawActs
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 8)
    .map(({ ts: _ts, ...rest }) => rest);

  const latest = gens[0];
  const pack = latest ? parseCreativePack(latest.creative_pack) : null;

  let insights: DashboardOverview["insights"];
  if (pack) {
    const clip = (s: string, n = 160) => s.slice(0, n) + (s.length > n ? "…" : "");
    if (persona === "ecommerce") {
      insights = [
        {
          id: "i1",
          title: "Reklam görseli fikri",
          impact: "Yüksek",
          summary: clip(pack.adCreativeIdeas[0] ?? pack.viralIdeas[0] ?? latest!.content_idea),
        },
        {
          id: "i2",
          title: "UGC video fikri",
          impact: "Yüksek",
          summary: clip(pack.ugcVideoIdeas[0] ?? pack.ugcScenarios[0] ?? latest!.short_video_idea),
        },
        {
          id: "i3",
          title: "Satış hook'u",
          impact: "Orta",
          summary: clip(pack.salesHooks[0] ?? pack.hooks[0] ?? pack.ctas[0] ?? ""),
        },
      ];
    } else if (persona === "creator") {
      insights = [
        {
          id: "i1",
          title: "Viral fikir",
          impact: "Yüksek",
          summary: clip(pack.viralIdeas[0] ?? latest!.content_idea),
        },
        {
          id: "i2",
          title: "Hook önerisi",
          impact: "Yüksek",
          summary: clip(pack.hooks[0] ?? pack.ctas[0] ?? ""),
        },
        {
          id: "i3",
          title: "Reels konsepti",
          impact: "Orta",
          summary: clip(pack.reelsConcepts[0] ?? pack.videoConcepts[0] ?? latest!.short_video_idea),
        },
      ];
    } else if (persona === "personal_brand") {
      insights = [
        {
          id: "i1",
          title: "İçerik hattı",
          impact: "Yüksek",
          summary: clip(pack.contentIdea || latest!.content_idea),
        },
        {
          id: "i2",
          title: "Carousel fikri",
          impact: "Orta",
          summary: clip(pack.carouselIdeas[0] ?? pack.ugcScenarios[0] ?? ""),
        },
        {
          id: "i3",
          title: "CTA seti",
          impact: "Orta",
          summary: clip(pack.ctas[0] ?? pack.hooks[0] ?? ""),
        },
      ];
    } else {
      insights = [
        {
          id: "i1",
          title: "Kampanya fikri",
          impact: "Yüksek",
          summary: clip(pack.carouselIdeas[0] ?? pack.contentIdea ?? latest!.content_idea),
        },
        {
          id: "i2",
          title: "Yerel içerik",
          impact: "Orta",
          summary: clip(pack.ugcScenarios[0] ?? pack.videoConcepts[0] ?? ""),
        },
        {
          id: "i3",
          title: "Marka mesajı",
          impact: "Orta",
          summary: clip(pack.hooks[0] ?? pack.ctas[0] ?? ""),
        },
      ];
    }
  } else if (latest) {
    insights = [
      {
        id: "i1",
        title: "Son üretim — gönderi fikri",
        impact: "Yüksek",
        summary:
          latest.content_idea.slice(0, 160) + (latest.content_idea.length > 160 ? "…" : ""),
      },
      {
        id: "i2",
        title: "Kısa video kurgusu",
        impact: "Yüksek",
        summary:
          latest.short_video_idea.slice(0, 160) +
          (latest.short_video_idea.length > 160 ? "…" : ""),
      },
      {
        id: "i3",
        title: "Hashtag seti",
        impact: "Orta",
        summary: (latest.hashtags ?? []).slice(0, 8).join(" "),
      },
    ];
  } else {
    insights = getEmptyInsightSkeleton(persona as UserPersona);
  }

  const contentPerformance = gens.slice(0, 5).map((g) => {
    const p = parseCreativePack(g.creative_pack);
    let title = g.content_idea.slice(0, 48) + (g.content_idea.length > 48 ? "…" : "");
    if (p) {
      if (persona === "ecommerce") {
        const t =
          p.adCreativeIdeas[0] ??
          p.ugcVideoIdeas[0] ??
          p.salesHooks[0] ??
          p.viralIdeas[0] ??
          g.content_idea;
        title = t.slice(0, 48) + (t.length > 48 ? "…" : "");
      } else if (persona === "creator") {
        const t = p.viralIdeas[0] ?? p.hooks[0] ?? p.reelsConcepts[0] ?? g.content_idea;
        title = t.slice(0, 48) + (t.length > 48 ? "…" : "");
      } else if (persona === "personal_brand") {
        const t = p.carouselIdeas[0] ?? p.contentIdea ?? g.content_idea;
        title = t.slice(0, 48) + (t.length > 48 ? "…" : "");
      } else {
        const t = p.carouselIdeas[0] ?? p.ugcScenarios[0] ?? g.content_idea;
        title = t.slice(0, 48) + (t.length > 48 ? "…" : "");
      }
    }
    return {
      id: g.id,
      title,
      reach: "—",
      er: "—",
      score: hashScore(g.id, 1),
    };
  });

  const nowMs = Date.now();
  const nextPost =
    sched.find((s) => new Date(s.scheduled_for).getTime() > nowMs) ?? sched[0] ?? null;

  const buffer = await loadBufferDashboardSnapshot(sched);

  const operator = buildOperatorOverview({
    user: userRow as {
      usage_mode?: string | null;
      discovery_profile?: unknown;
      growth_strategy?: unknown;
    },
    latestGen: latest ?? null,
    nextPost,
    publish: buffer,
  });

  const { data: imgRows, error: imgListErr } = await supabase
    .from("ai_creatives")
    .select("id, storage_path")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(8);

  const aiCreativePreviews: Array<{ id: string; url: string }> = [];
  if (!imgListErr && imgRows) {
    for (const row of imgRows) {
      const sp = row.storage_path as string;
      const { data: signed } = await supabase.storage.from("ai-creatives").createSignedUrl(sp, 3600);
      if (signed?.signedUrl) aiCreativePreviews.push({ id: row.id as string, url: signed.signedUrl });
    }
  }

  let socialLivePreview: DashboardOverview["socialLivePreview"] = null;
  if (latest) {
    const lp = parseCreativePack(latest.creative_pack);
    let liveImg: string | null = null;
    const { data: creRow } = await supabase
      .from("ai_creatives")
      .select("storage_path")
      .eq("ai_generation_id", latest.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (creRow?.storage_path) {
      const { data: sig } = await supabase.storage
        .from("ai-creatives")
        .createSignedUrl(creRow.storage_path as string, 3600);
      if (sig?.signedUrl) liveImg = sig.signedUrl;
    }
    const accts = (connectedAccounts ?? []) as ConnectedAccountRow[];
    const igAcc = accts.find((a) => a.platform === "instagram");
    const ttAcc = accts.find((a) => a.platform === "tiktok");
    const uRow = userRow as { full_name?: string | null; email?: string | null };
    const displayName =
      String(uRow.full_name ?? "").trim() ||
      String(uRow.email ?? "user")
        .split("@")[0]
        ?.trim() ||
      "Nexora";
    const unIg = igAcc?.handle ? `@${String(igAcc.handle).replace(/^@/, "")}` : "@nexora";
    const unTt = ttAcc?.handle ? `@${String(ttAcc.handle).replace(/^@/, "")}` : "@nexora";
    socialLivePreview = {
      imageUrl: liveImg,
      caption: latest.caption,
      hashtags: latest.hashtags ?? [],
      hook: lp?.viralHookPrimary?.trim() || lp?.hooks?.[0] || latest.caption.slice(0, 100),
      cta: lp?.ctas?.[0] || "Bio’daki link.",
      algorithmTarget: lp?.algorithmBehaviorTarget ?? null,
      publishReason: lp?.publishReason ?? null,
      aiReasoning: lp?.aiReasoning ?? null,
      usernameInstagram: unIg,
      usernameTiktok: unTt,
      displayName,
      carouselSlides: Math.min(5, Math.max(1, lp?.carouselIdeas?.length ?? 1)),
    };
  }

  return {
    user: userRow as DashboardOverview["user"],
    growthGoal: (goal as GrowthGoalRow | null) ?? null,
    connectedAccounts: (connectedAccounts ?? []) as ConnectedAccountRow[],
    recentGenerations: gens,
    scheduledPosts: sched,
    analyticsSeries: analytics,
    buffer,
    ui,
    scores: {
      growth,
      viral,
      engagementRate: Math.round(er * 10) / 10,
      followerDeltaLabel,
      impressionsLabel: totalImp > 0 ? formatNumberTr(totalImp) : "—",
    },
    activity,
    insights,
    contentPerformance,
    followerSeries:
      followerSeries.length > 0
        ? followerSeries
        : [
            { label: "Pzt", value: 10 },
            { label: "Sal", value: 14 },
            { label: "Çar", value: 18 },
            { label: "Per", value: 22 },
            { label: "Cum", value: 28 },
            { label: "Cmt", value: 32 },
            { label: "Paz", value: 36 },
          ],
    operator,
    aiCreativePreviews,
    socialLivePreview,
  };
}

export async function listAiGenerations(): Promise<AiGenerationRow[]> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("ai_generations")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (data ?? []) as AiGenerationRow[];
}

export async function listScheduledPosts(): Promise<ScheduledPostRow[]> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("scheduled_posts")
    .select("*")
    .eq("user_id", user.id)
    .order("scheduled_for", { ascending: true })
    .limit(50);

  return (data ?? []) as ScheduledPostRow[];
}

export async function listScheduledPostsWithAi(opts?: {
  syncBuffer?: boolean;
}): Promise<ScheduledPostWithAi[]> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  if (opts?.syncBuffer) {
    const token = getBufferAccessToken();
    if (token) {
      await syncBufferPublishStatusesForUser({
        supabase,
        userId: user.id,
        accessToken: token,
        timeoutMs: 5000,
      });
    }
  }

  const { data: posts, error } = await supabase
    .from("scheduled_posts")
    .select("*")
    .eq("user_id", user.id)
    .order("scheduled_for", { ascending: true })
    .limit(50);

  if (error) return [];

  const rows = posts ?? [];
  if (rows.length === 0) return [];

  const ids = [
    ...new Set(
      rows
        .map((p) => p.source_ai_generation_id as string | null)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const genMap = new Map<string, AiGenerationScheduleSnippet>();
  if (ids.length > 0) {
    const { data: gens } = await supabase
      .from("ai_generations")
      .select(
        "id, caption, hashtags, content_idea, short_video_idea, creative_pack, persona, goal, creative_type",
      )
      .in("id", ids);

    for (const g of gens ?? []) {
      genMap.set(g.id as string, g as AiGenerationScheduleSnippet);
    }
  }

  const imgByGen = new Map<string, string>();
  if (ids.length > 0) {
    const { data: imgs, error: imgErr } = await supabase
      .from("ai_creatives")
      .select("ai_generation_id, storage_path, created_at")
      .in("ai_generation_id", ids)
      .order("created_at", { ascending: false });
    if (!imgErr && imgs) {
      for (const im of imgs) {
        const gid = im.ai_generation_id as string | null;
        const sp = im.storage_path as string | undefined;
        if (gid && sp && !imgByGen.has(gid)) imgByGen.set(gid, sp);
      }
    }
  }

  const uniquePaths = [...new Set(imgByGen.values())];
  const urlByPath = new Map<string, string>();
  for (const path of uniquePaths) {
    const { data: signed } = await supabase.storage.from("ai-creatives").createSignedUrl(path, 1800);
    if (signed?.signedUrl) urlByPath.set(path, signed.signedUrl);
  }

  return rows.map((p) => {
    const gid = p.source_ai_generation_id as string | null;
    const path = gid ? imgByGen.get(gid) : undefined;
    return {
      ...p,
      ai_generation: gid ? genMap.get(gid) ?? null : null,
      creative_preview_url: path ? urlByPath.get(path) ?? null : null,
    };
  }) as ScheduledPostWithAi[];
}

export async function listConnectedAccounts(): Promise<ConnectedAccountRow[]> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("connected_accounts")
    .select("*")
    .eq("user_id", user.id)
    .order("platform", { ascending: true });

  return (data ?? []) as ConnectedAccountRow[];
}

export type AnalyticsSummary = {
  rows: AnalyticsRow[];
  totals: {
    impressions: number;
    reach: number;
    engagements: number;
    platforms: string[];
  };
};

export async function getAnalyticsSummary(): Promise<AnalyticsSummary | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 30);
  const sinceStr = since.toISOString().slice(0, 10);

  const { data } = await supabase
    .from("analytics")
    .select("*")
    .eq("user_id", user.id)
    .gte("metric_date", sinceStr)
    .order("metric_date", { ascending: false });

  const rows = (data ?? []) as AnalyticsRow[];
  let impressions = 0;
  let reach = 0;
  let engagements = 0;
  const platSet = new Set<string>();
  for (const r of rows) {
    impressions += Number(r.impressions);
    reach += Number(r.reach);
    engagements += Number(r.engagements);
    platSet.add(r.platform);
  }

  return {
    rows,
    totals: {
      impressions,
      reach,
      engagements,
      platforms: [...platSet],
    },
  };
}
