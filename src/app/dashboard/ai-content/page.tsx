import type { Metadata } from "next";

import { AiContentGenerateForm } from "@/components/dashboard/ai-content-generate-form";
import { AiPublishQueueRow } from "@/components/dashboard/ai-publish-queue-row";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listAiGenerations, listScheduledPosts } from "@/lib/data/dashboard";
import { loadBufferDashboardSnapshot } from "@/lib/integrations/buffer/dashboard-slice";
import { getUserProfile } from "@/lib/data/user";
import { parseCreativePack } from "@/lib/openai/creative-pack-utils";
import type { AiGenerationRow, DashboardBufferSnapshot } from "@/types/database";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Otomatik içerik",
  description: "AI Creative Engine üretimi ve geçmiş kayıtları.",
};

function formatDt(iso: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <details className="group rounded-lg border border-white/[0.06] bg-black/25 px-3 py-2">
      <summary className="cursor-pointer text-xs font-medium text-violet-200/90 marker:text-violet-400">
        {title} ({items.length})
      </summary>
      <ul className="mt-2 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-muted-foreground">
        {items.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    </details>
  );
}

function GenerationCard({ g, publish }: { g: AiGenerationRow; publish: DashboardBufferSnapshot }) {
  const pack = parseCreativePack(g.creative_pack);

  return (
    <Card className="border-white/[0.08] bg-black/30">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="font-display text-base font-semibold">
            {formatDt(g.created_at)}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {g.persona ? (
              <Badge variant="secondary" className="text-[10px]">
                {g.persona}
              </Badge>
            ) : null}
            <Badge variant="outline" className="text-[10px]">
              {g.model}
            </Badge>
          </div>
        </div>
        {g.goal ? (
          <p className="text-xs text-muted-foreground">Hedef: {g.goal}</p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <p className="text-xs font-medium text-violet-200/90">Caption</p>
          <p className="mt-1 leading-relaxed text-muted-foreground">{g.caption}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-violet-200/90">Hashtag</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {(g.hashtags ?? []).join(" ")}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-violet-200/90">İçerik fikri</p>
          <p className="mt-1 text-muted-foreground">{g.content_idea}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-violet-200/90">Kısa video fikri</p>
          <p className="mt-1 text-muted-foreground">{g.short_video_idea}</p>
        </div>
        {pack ? (
          <div className="space-y-2 border-t border-white/[0.06] pt-3">
            <p className="text-xs font-medium text-violet-200/90">Creative Engine paketi</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <ListBlock title="Viral fikirler" items={pack.viralIdeas} />
              <ListBlock title="Video konseptleri" items={pack.videoConcepts} />
              <ListBlock title="Hook’lar" items={pack.hooks} />
              <ListBlock title="CTA’lar" items={pack.ctas} />
              <ListBlock title="Carousel fikirleri" items={pack.carouselIdeas} />
              <ListBlock title="UGC senaryoları" items={pack.ugcScenarios} />
              <ListBlock title="Reels konseptleri" items={pack.reelsConcepts} />
              <ListBlock title="Reklam görseli fikirleri" items={pack.adCreativeIdeas} />
              <ListBlock title="UGC video fikirleri" items={pack.ugcVideoIdeas} />
              <ListBlock title="Satış hook’ları" items={pack.salesHooks} />
              <ListBlock title="Kısa reklam senaryoları" items={pack.shortAdScripts} />
            </div>
          </div>
        ) : null}
        <div className="border-t border-white/[0.06] pt-3">
          <p className="text-xs font-medium text-violet-200/90">AI yayın kuyruğu</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Üretimi kaydettikten sonra tek tıkla otonom yayın kuyruğuna alın; Nexora planlı yayın tablosuna
            otomatik satır eklenir (Creative Engine bağımsız çalışır).
          </p>
          <div className="mt-2">
            <AiPublishQueueRow generationId={g.id} publish={publish} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

async function AiContentHistory({
  generations,
  publish,
}: {
  generations: AiGenerationRow[];
  publish: DashboardBufferSnapshot;
}) {
  if (generations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Henüz kayıtlı üretim yok. Yukarıdan ilk Creative Engine paketinizi oluşturun.
      </p>
    );
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {generations.map((g) => (
        <GenerationCard key={g.id} g={g} publish={publish} />
      ))}
    </div>
  );
}

export default async function AiContentPage() {
  const [profile, generations, sched] = await Promise.all([
    getUserProfile(),
    listAiGenerations(),
    listScheduledPosts(),
  ]);
  const bufferSnap = await loadBufferDashboardSnapshot(sched);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Otomatik içerik
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="font-medium text-foreground/90">AI Creative Engine</span> — viral
          fikirler, hook’lar, UGC/Reels ve (marka seçimine göre) reklam senaryoları. Üretim{" "}
          <code className="text-xs">ai_generations</code> tablosunda; isteğe bağlı olarak otonom yayın
          kuyruğuna aktarılır.
        </p>
      </div>
      <AiContentGenerateForm
        persona={profile?.persona}
        defaultDescription={profile?.product_description ?? ""}
      />
      <div>
        <h2 className="font-display text-lg font-semibold">Geçmiş</h2>
        <div className="mt-4">
          <AiContentHistory generations={generations} publish={bufferSnap} />
        </div>
      </div>
    </div>
  );
}
