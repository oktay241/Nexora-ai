"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { generateAiContentPack } from "@/actions/ai-generation";
import { normalizePersona, type UserPersona } from "@/lib/onboarding/persona";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function promptCopy(persona: UserPersona): { title: string; desc: string; label: string; placeholder: string } {
  switch (persona) {
    case "ecommerce":
      return {
        title: "Yeni Creative Engine paketi",
        desc: "Reklam görseli fikirleri, UGC senaryoları, satış hook’ları, Reels ve caption — geçmişe kaydedilir.",
        label: "Ürün veya kampanya notu",
        placeholder: "Ürün, teklif, hedef kitle, kampanya odağı…",
      };
    case "personal_brand":
      return {
        title: "Yeni Creative Engine paketi",
        desc: "Otorite içeriği, carousel hatları, CTA setleri ve kısa video konseptleri — geçmişe kaydedilir.",
        label: "Bu tur için içerik notu",
        placeholder: "Uzmanlık alanın, mesajın, yayın tonun…",
      };
    case "business":
      return {
        title: "Yeni Creative Engine paketi",
        desc: "Kampanya fikirleri, yerel içerik önerileri, marka mesajları ve kısa video — geçmişe kaydedilir.",
        label: "Kampanya veya teklif notu",
        placeholder: "Sektör, teklif, yerel odağın…",
      };
    case "creator":
    default:
      return {
        title: "Yeni Creative Engine paketi",
        desc: "Viral fikirler, hook’lar, Reels konseptleri, UGC ve CTA’lar — geçmişe kaydedilir.",
        label: "Bu turda ne üretelim?",
        placeholder: "Trend, hook, seri içerik, platform…",
      };
  }
}

export function AiContentGenerateForm({
  persona: personaProp,
  defaultDescription,
}: {
  persona?: string | null;
  defaultDescription: string;
}) {
  const persona = normalizePersona(personaProp);
  const copy = promptCopy(persona);
  const router = useRouter();
  const [state, formAction, pending] = useActionState(generateAiContentPack, undefined);

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
    }
  }, [state?.ok, router]);

  return (
    <Card className="border-white/[0.08] bg-white/[0.02]">
      <CardHeader>
        <CardTitle className="font-display text-lg">{copy.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{copy.desc}</p>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="acd">{copy.label}</Label>
            <Textarea
              id="acd"
              name="product_description"
              required
              minLength={8}
              defaultValue={defaultDescription}
              placeholder={copy.placeholder}
              className="min-h-[100px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="acf">Yeni görsel (isteğe bağlı)</Label>
            <Input id="acf" name="image" type="file" accept="image/png,image/jpeg,image/webp" />
            <p className="text-xs text-muted-foreground">
              Boş bırakırsanız kurulumda yüklediğiniz görsel kullanılır.
            </p>
          </div>
          {state?.error ? (
            <p className="text-sm text-red-400" role="alert">
              {state.error}
            </p>
          ) : null}
          {state?.ok ? (
            <p className="text-sm text-emerald-400">Üretim kaydedildi.</p>
          ) : null}
          <Button type="submit" disabled={pending} className="shadow-glow">
            {pending ? "Üretiliyor…" : "Üret ve kaydet"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
