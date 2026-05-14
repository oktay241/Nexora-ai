import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AccountsPanel } from "@/components/dashboard/accounts-panel";
import { listConnectedAccounts } from "@/lib/data/dashboard";
import { getUserProfile } from "@/lib/data/user";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hesaplar",
  description: "Bağlı platformlar",
};

export default async function AccountsPage() {
  const profile = await getUserProfile();
  if (!profile) redirect("/login?next=/dashboard/accounts");

  const accounts = await listConnectedAccounts();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Hesaplar
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kurulumda seçtiğiniz Instagram / TikTok kayıtları.
        </p>
      </div>
      <AccountsPanel accounts={accounts} />
    </div>
  );
}
