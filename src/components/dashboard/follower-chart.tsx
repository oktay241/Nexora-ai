"use client";

import { motion } from "framer-motion";

export type FollowerPoint = { label: string; value: number };

export function FollowerChart({ data }: { data: FollowerPoint[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const maxPx = 120;

  return (
    <div className="space-y-4">
      <div className="flex h-36 items-end justify-between gap-2 sm:h-40">
        {data.map((d, i) => {
          const target = (d.value / max) * maxPx;
          return (
            <div
              key={d.label}
              className="flex h-full flex-1 flex-col items-center justify-end gap-2"
            >
              <motion.div
                initial={{ height: 0 }}
                whileInView={{ height: target }}
                viewport={{ once: true }}
                transition={{
                  delay: i * 0.06,
                  duration: 0.55,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="w-full max-w-[52px] rounded-t-md bg-gradient-to-t from-violet-600/50 to-sky-400/90 shadow-glow"
              />
              <span className="text-[10px] text-muted-foreground">{d.label}</span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">Kitle eğrisi (örnek seri)</p>
    </div>
  );
}
