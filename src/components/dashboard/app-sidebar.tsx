"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { dashboardNav } from "@/components/dashboard/dashboard-nav";
import { signOut } from "@/actions/auth";
import { siteConfig } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/[0.06] bg-black/50 px-4 py-6 backdrop-blur-xl lg:flex">
      <Link href="/" className="flex items-center gap-2 px-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-br from-violet-500/30 to-sky-500/20">
          <Sparkles className="h-4 w-4 text-violet-200" />
        </span>
        <div className="leading-tight">
          <p className="font-display text-sm font-semibold">{siteConfig.name}</p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Operasyon merkezi
          </p>
        </div>
      </Link>

      <Separator className="my-6 bg-white/10" />

      <nav className="flex flex-1 flex-col gap-1">
        {dashboardNav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="relative block">
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-lg bg-white/[0.08]"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span
                className={cn(
                  "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.title}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2">
        <form action={signOut}>
          <Button type="submit" variant="outline" size="sm" className="w-full">
            Çıkış
          </Button>
        </form>
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-violet-500/10 to-transparent p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Canlı veri</p>
          <p className="mt-1 leading-relaxed">
            Özetler Supabase&apos;ten gelir; planlı yayınlar Nexora AI yayın hattı ile eşlenebilir.
          </p>
        </div>
      </div>
    </aside>
  );
}
