import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGrowthGoalKey, getUserProfile } from "@/lib/data/user";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI optimizasyon",
  description: "Hedef ve otonom döngü",
};

export default async function GrowthEnginePage() {
  const profile = await getUserProfile();
  if (!profile) redirect("/login?next=/dashboard/growth-engine");

  const goal = await getGrowthGoalKey();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          AI optimizasyon
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Üretim sonrası metin ve zaman penceresi iyileştirmeleri bu modülde
          toplanacak.
        </p>
      </div>
      <Card className="border-white/[0.08] bg-white/[0.02] shadow-inner-glow">
        <CardHeader>
          <CardTitle className="font-display text-lg">Aktif hedef</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Kurulumda seçilen hedef:{" "}
            <span className="font-medium text-foreground">{goal}</span>
          </p>
          <p>
            Ürün özeti:{" "}
            {profile.product_description
              ? profile.product_description.slice(0, 280) +
                (profile.product_description.length > 280 ? "…" : "")
              : "—"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
