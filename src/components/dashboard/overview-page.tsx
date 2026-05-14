import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { AccountsPanel } from "@/components/dashboard/accounts-panel";
import { AiCreativeGallery } from "@/components/dashboard/ai-creative-gallery";
import { ContentPerformance } from "@/components/dashboard/content-performance";
import { DiscoveryEnginePanel } from "@/components/dashboard/discovery-engine-panel";
import { FollowerChart } from "@/components/dashboard/follower-chart";
import { GrowthStrategyCard } from "@/components/dashboard/growth-strategy-card";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { MetricCards } from "@/components/dashboard/metric-cards";
import { OperationCenterStrip } from "@/components/dashboard/operation-center-strip";
import { ConnectedPlatformsCard } from "@/components/dashboard/connected-platforms-card";
import { ScheduledPosts } from "@/components/dashboard/scheduled-posts";
import { ScoreRing } from "@/components/dashboard/score-ring";
import { SocialPreviewCard } from "@/components/dashboard/social-preview-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardOverview } from "@/types/database";

export function OverviewPage({ data }: { data: DashboardOverview }) {
  const { ui } = data;
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Genel bakış
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{ui.introSubtitle}</p>
      </div>

      <OperationCenterStrip operator={data.operator} />

      <ConnectedPlatformsCard publish={data.buffer} />

      {data.socialLivePreview ? (
        <SocialPreviewCard
          imageUrl={data.socialLivePreview.imageUrl}
          caption={data.socialLivePreview.caption}
          hashtags={data.socialLivePreview.hashtags}
          hook={data.socialLivePreview.hook}
          cta={data.socialLivePreview.cta}
          algorithmTarget={data.socialLivePreview.algorithmTarget}
          publishReason={data.socialLivePreview.publishReason}
          aiReasoning={data.socialLivePreview.aiReasoning}
          usernameInstagram={data.socialLivePreview.usernameInstagram}
          usernameTiktok={data.socialLivePreview.usernameTiktok}
          displayName={data.socialLivePreview.displayName}
          carouselSlides={data.socialLivePreview.carouselSlides}
          sectionTitle="Sosyal paylaşım önizlemesi"
          sectionSubtitle="Son AI üretiminizin Instagram ve TikTok’ta nasıl görüneceğini simüle edin — Growth OS katmanı."
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <DiscoveryEnginePanel operator={data.operator} />
        <GrowthStrategyCard growth={data.operator.growth} />
      </div>

      <MetricCards
        growth={data.scores.growth}
        viral={data.scores.viral}
        engagementRate={data.scores.engagementRate}
        hintGrowth={ui.metricHintGrowth}
        hintViral={ui.metricHintViral}
        hintEngagement={ui.metricHintEngagement}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-white/[0.08] bg-white/[0.02] lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-lg">{ui.chartTitle}</CardTitle>
            <p className="text-xs text-muted-foreground">
              Son kayıtlar · {data.scores.followerDeltaLabel}
            </p>
          </CardHeader>
          <CardContent>
            <FollowerChart data={data.followerSeries} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="border-white/[0.08] bg-white/[0.02]">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-lg">{ui.aiScoresTitle}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-around gap-2 pt-0">
              <ScoreRing label="Büyüme" value={data.scores.growth} />
              <ScoreRing label="Viralite" value={data.scores.viral} />
            </CardContent>
          </Card>
          <Card className="border-white/[0.08] bg-white/[0.02]">
            <CardContent className="space-y-2 p-5">
              <p className="text-xs text-muted-foreground">{ui.impressionsCardLabel}</p>
              <p className="font-display text-2xl font-semibold tracking-tight">
                {data.scores.impressionsLabel}
              </p>
              <p className="text-xs text-muted-foreground">
                {ui.impressionsCardSub} · Etkileşim oranı %{data.scores.engagementRate}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityFeed
          items={data.activity}
          title={ui.activityFeedTitle}
          subtitle={ui.activitySubtitle}
        />
        <ScheduledPosts posts={data.scheduledPosts} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AccountsPanel accounts={data.connectedAccounts} />
        <InsightsPanel
          insights={data.insights}
          title={ui.insightsPanelTitle}
          subtitle={ui.insightsSubtitle}
        />
      </div>

      <ContentPerformance
        items={data.contentPerformance}
        title={ui.contentPerfTitle}
        subtitle={ui.contentPerfSubtitle}
      />

      <AiCreativeGallery previews={data.aiCreativePreviews} />
    </div>
  );
}
