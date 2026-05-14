import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAnalyticsSummary } from "@/lib/data/dashboard";
import { getUserProfile } from "@/lib/data/user";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Performans",
  description: "Erişim ve etkileşim özeti",
};

function formatInt(n: number) {
  return new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(n);
}

export default async function AnalyticsPage() {
  const profile = await getUserProfile();
  if (!profile) redirect("/login?next=/dashboard/analytics");

  const summary = await getAnalyticsSummary();
  const totals = summary?.totals;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Performans analizi
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Son 30 günün toplamları (Supabase `analytics` tablosu). Canlı API ile
          zenginleştirilecek.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-white/[0.08] bg-white/[0.02]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gösterim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold">
              {totals ? formatInt(totals.impressions) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-white/[0.08] bg-white/[0.02]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Erişim</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold">
              {totals ? formatInt(totals.reach) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-white/[0.08] bg-white/[0.02]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Etkileşim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-semibold">
              {totals ? formatInt(totals.engagements) : "—"}
            </p>
          </CardContent>
        </Card>
      </div>
      <Card className="border-white/[0.08] bg-white/[0.02]">
        <CardHeader>
          <CardTitle className="font-display text-lg">Ham satırlar</CardTitle>
          <p className="text-xs text-muted-foreground">
            {totals?.platforms?.length
              ? `Platformlar: ${totals.platforms.join(", ")}`
              : "Veri yok"}
          </p>
        </CardHeader>
        <CardContent className="max-h-[420px] overflow-auto text-xs text-muted-foreground">
          <pre className="whitespace-pre-wrap font-mono">
            {summary?.rows?.length
              ? JSON.stringify(summary.rows.slice(0, 20), null, 2)
              : "Henüz analitik satırı yok."}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
