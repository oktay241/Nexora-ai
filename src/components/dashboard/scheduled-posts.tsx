"use client";

import { CalendarClock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ScheduledPostRow } from "@/types/database";

function formatScheduled(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function ScheduledPosts({ posts }: { posts: ScheduledPostRow[] }) {
  const list = posts.slice(0, 8);
  const count = list.length;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 shadow-inner-glow">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-semibold">Otomatik yayın sırası</h3>
          <p className="text-xs text-muted-foreground">Planlanmış gönderiler (MVP)</p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <CalendarClock className="h-3 w-3" />
          {count}
        </Badge>
      </div>
      {list.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Henüz planlı yayın yok. Kurulumu tamamlayın veya içerik üretin.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {list.map((p) => (
            <li
              key={p.id}
              className="rounded-xl border border-white/[0.06] bg-black/30 px-3 py-3 transition-colors hover:border-violet-500/25"
            >
              <p className="text-sm font-medium">{p.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{p.platform}</span>
                <span className="text-white/20">·</span>
                <span>{formatScheduled(p.scheduled_for)}</span>
                <span className="text-white/20">·</span>
                <span className="capitalize">{p.status}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
