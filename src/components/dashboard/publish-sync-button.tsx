"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";

import { syncPublishStatusesAction } from "@/actions/buffer";
import { Button } from "@/components/ui/button";

export function PublishSyncButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        className="gap-1.5 border-white/10 bg-black/30"
        onClick={() => {
          setMsg(null);
          start(async () => {
            const r = await syncPublishStatusesAction();
            if (r.error) setMsg(r.error);
            else setMsg(r.updated != null ? `${r.updated} yayın durumu güncellendi.` : "Senkron tamam.");
            router.refresh();
          });
        }}
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
        Yayın durumunu yenile
      </Button>
      {msg ? <span className="text-[11px] text-muted-foreground">{msg}</span> : null}
    </div>
  );
}
