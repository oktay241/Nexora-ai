import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OverviewPage } from "@/components/dashboard/overview-page";
import { getDashboardOverview } from "@/lib/data/dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Genel bakış",
  description: "Otonom sosyal operasyon özeti",
};

export default async function DashboardHomePage() {
  const data = await getDashboardOverview();
  if (!data) {
    redirect("/login?next=/dashboard");
  }
  return <OverviewPage data={data} />;
}
