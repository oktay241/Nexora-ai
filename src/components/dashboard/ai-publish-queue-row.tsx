"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";

import { sendCreativeGenerationToBuffer } from "@/actions/buffer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { bufferServiceToDisplayPlatform } from "@/lib/integrations/buffer/platform-map";
import { cn } from "@/lib/utils";
import type { DashboardBufferSnapshot } from "@/types/database";

export function AiPublishQueueRow({
  generationId,
  publish,
}: {
  generationId: string;
  publish: DashboardBufferSnapshot;
}) {
  const router = useRouter();
  const [channelId, setChannelId] = useState<string>("");
  const [state, action, pending] = useActionState(sendCreativeGenerationToBuffer, undefined);

  const usableChannels = useMemo(
    () => publish.channels.filter((c) => !c.isDisconnected && !c.isLocked),
    [publish.channels],
  );

  useEffect(() => {
    if (!channelId && usableChannels[0]?.id) setChannelId(usableChannels[0].id);
  }, [channelId, usableChannels]);

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state?.ok, router]);

  if (!publish.configured) {
    return (
      <div className="rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2 text-[11px] text-muted-foreground">
        Otonom yayın köprüsü henüz yapılandırılmadı. AI üretiminiz yine kaydedilir; yayın köprüsü ayrıca
        etkinleştirilir.
      </div>
    );
  }

  if (publish.error) {
    return <p className="text-[11px] text-amber-200/90">Yayın kanalları okunamadı: {publish.error}</p>;
  }

  if (usableChannels.length === 0) {
    return (
      <p className="text-[11px] text-muted-foreground">
        Bağlı bir yayın kanalı bulunamadı. Önce hesap bağlama adımını tamamlayın.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-2 rounded-lg border border-violet-500/20 bg-violet-500/[0.06] p-3">
      <input type="hidden" name="generation_id" value={generationId} />
      <input type="hidden" name="mode" value="queue" />
      <input type="hidden" name="channel_id" value={channelId} />
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[200px] flex-1 space-y-1.5">
          <Label
            htmlFor={`pub-ch-${generationId}`}
            className="text-[10px] uppercase tracking-[0.12em] text-violet-200/80"
          >
            Hedef kanal
          </Label>
          <select
            id={`pub-ch-${generationId}`}
            className={cn(
              "h-9 w-full rounded-md border border-white/10 bg-black/40 px-2 text-xs text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-violet-500/40",
              pending && "opacity-60",
            )}
            value={channelId}
            disabled={pending}
            onChange={(e) => setChannelId(e.target.value)}
            required
          >
            {usableChannels.map((c) => (
              <option key={c.id} value={c.id}>
                {bufferServiceToDisplayPlatform(c.service)} · {c.name}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="submit"
          size="sm"
          variant="secondary"
          disabled={pending || !channelId}
          className="gap-1.5 border border-white/10 bg-white/[0.06] hover:bg-white/[0.1]"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          AI yayın kuyruğuna al
        </Button>
      </div>
      {state?.error ? (
        <p className="text-[11px] text-red-300" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? <p className="text-[11px] text-emerald-300">Otonom yayın kuyruğuna eklendi.</p> : null}
    </form>
  );
}
