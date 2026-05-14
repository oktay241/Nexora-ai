"use client";

import {
  BarChart3,
  CalendarClock,
  Cpu,
  LayoutDashboard,
  PenLine,
  Plug,
  Settings,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type DashboardNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const dashboardNav: DashboardNavItem[] = [
  { title: "Genel bakış", href: "/dashboard", icon: LayoutDashboard },
  { title: "Otomatik içerik", href: "/dashboard/ai-content", icon: PenLine },
  { title: "Otomatik paylaşım", href: "/dashboard/scheduling", icon: CalendarClock },
  { title: "Performans", href: "/dashboard/analytics", icon: BarChart3 },
  { title: "AI optimizasyon", href: "/dashboard/growth-engine", icon: Cpu },
  { title: "Hesaplar", href: "/dashboard/accounts", icon: Users },
  { title: "Bağlantılar", href: "/dashboard/connections", icon: Plug },
  { title: "Ayarlar", href: "/dashboard/settings", icon: Settings },
];
