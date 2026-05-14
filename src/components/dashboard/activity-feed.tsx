"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export type ActivityFeedItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  tone: "success" | "info" | "warning";
};

export function ActivityFeed({
  items,
  title = "Otonom aktivite",
  subtitle = "AI üretimi ve planlı yayınlar (veritabanı)",
}: {
  items: ActivityFeedItem[];
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 shadow-inner-glow">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Sparkles className="h-3 w-3" />
          Aktif
        </Badge>
      </div>
      <ScrollArea className="mt-4 h-[280px] pr-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henüz aktivite kaydı yok.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((a, i) => (
              <motion.li
                key={a.id}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-white/[0.06] bg-black/30 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-snug">{a.title}</p>
                  <Badge
                    variant="outline"
                    className="shrink-0 border-white/10 text-[10px] font-normal text-muted-foreground"
                  >
                    {a.time}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{a.detail}</p>
              </motion.li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </div>
  );
}
