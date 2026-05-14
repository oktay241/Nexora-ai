"use client";

import type { SVGProps } from "react";
import { Instagram } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ConnectedAccountRow } from "@/types/database";

function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

function platformLabel(p: ConnectedAccountRow["platform"]): string {
  return p === "tiktok" ? "TikTok" : "Instagram";
}

export function AccountsPanel({ accounts }: { accounts: ConnectedAccountRow[] }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 shadow-inner-glow">
      <h3 className="font-display text-lg font-semibold">Bağlı hesaplar</h3>
      <p className="text-xs text-muted-foreground">Kurulumda seçtiğiniz kanallar</p>
      {accounts.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Henüz platform seçilmedi. Kurulumdan ekleyebilirsiniz.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {accounts.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-black/30 px-3 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                  {a.platform === "instagram" ? (
                    <Instagram className="h-5 w-5 text-pink-300" />
                  ) : (
                    <TikTokIcon className="h-5 w-5 text-cyan-200" />
                  )}
                </span>
                <div>
                  <p className="text-sm font-medium">{platformLabel(a.platform)}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.handle ?? "Handle eklenecek"}
                  </p>
                </div>
              </div>
              <Badge variant="success" className="text-[10px] capitalize">
                {a.status === "connected" ? "Hazır" : a.status}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
