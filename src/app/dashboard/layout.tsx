import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { signOut } from "@/actions/auth";
import { siteConfig } from "@/lib/constants";
import { getUserProfile } from "@/lib/data/user";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const profile = await getUserProfile();
  if (!profile) {
    redirect("/login?next=/dashboard");
  }
  if (!profile.onboarding_completed_at) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 mesh-gradient opacity-40" />
      <AppSidebar />
      <MobileNav />
      <div className="relative lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-black/40 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="pl-14 lg:pl-0">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Operasyon merkezi
              </p>
              <p className="font-display text-sm font-semibold">{siteConfig.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">Ana sayfa</Link>
              </Button>
              <Button variant="secondary" size="sm" asChild>
                <Link href="/onboarding">Kurulum</Link>
              </Button>
              <form action={signOut}>
                <Button type="submit" variant="outline" size="sm">
                  Çıkış
                </Button>
              </form>
            </div>
          </div>
        </header>
        <div className="relative px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}
