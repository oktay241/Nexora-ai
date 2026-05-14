import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserProfile } from "@/lib/data/user";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ayarlar",
  description: "Hesap ve oturum",
};

export default async function SettingsPage() {
  const profile = await getUserProfile();
  if (!profile) redirect("/login?next=/dashboard/settings");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Ayarlar
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Oturum, e-posta ve ileride ekip rolleri burada toplanacak.
        </p>
      </div>
      <Card className="border-white/[0.08] bg-white/[0.02]">
        <CardHeader>
          <CardTitle className="font-display text-lg">Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            E-posta: <span className="text-foreground">{profile.email ?? "—"}</span>
          </p>
          <p>
            Ad: <span className="text-foreground">{profile.full_name ?? "—"}</span>
          </p>
          <p>
            Kurulum:{" "}
            <span className="text-foreground">
              {profile.onboarding_completed_at ? "Tamamlandı" : "Bekliyor"}
            </span>
          </p>
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-3">
        <form action={signOut}>
          <Button type="submit" variant="outline">
            Çıkış yap
          </Button>
        </form>
      </div>
    </div>
  );
}
