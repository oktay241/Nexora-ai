"use client";

import { Instagram } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { SVGProps } from "react";

function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

export function ConnectPlatformButtons() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild size="sm" className="gap-2 border border-pink-500/25 bg-pink-500/10 text-pink-50 hover:bg-pink-500/15">
        <a href="/api/social/connect/start?platform=instagram">
          <Instagram className="h-4 w-4" />
          Connect Instagram
        </a>
      </Button>
      <Button
        asChild
        size="sm"
        className="gap-2 border border-cyan-500/25 bg-cyan-500/10 text-cyan-50 hover:bg-cyan-500/15"
      >
        <a href="/dashboard/social?err=platform_not_supported">
          <TikTokIcon className="h-4 w-4" />
          Connect TikTok
        </a>
      </Button>
      <Button asChild size="sm" variant="secondary" className="border border-white/10 bg-white/[0.06]">
        <a href="/dashboard/social?autopilot=1">Activate AI Autopilot</a>
      </Button>
    </div>
  );
}
