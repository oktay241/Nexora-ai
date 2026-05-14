import { Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <Card className="border-dashed border-white/15 bg-white/[0.02]">
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-violet-500/10">
            <Sparkles className="h-5 w-5 text-violet-200" />
          </span>
          <div>
            <CardTitle className="font-display text-lg">Yakında</CardTitle>
            <p className="text-xs text-muted-foreground">
              Bu modül için arka uç ve veri katmanı sıradaki iterasyonda
              devreye alınacak.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Arayüz ve gezinme hazır. YZ üretimi, zamanlama ve analitik
            bağlantıları tamamlandığında bu alan canlı sinyallerle dolacak.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
