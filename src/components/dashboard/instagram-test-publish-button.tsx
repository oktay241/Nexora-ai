"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";

import { publishInstagramTestPostAction } from "@/actions/instagram-publish";
import { Button } from "@/components/ui/button";

export function InstagramTestPublishButton({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(publishInstagramTestPostAction, undefined);

  return (
    <div className="space-y-2">
      <form
        action={async (fd) => {
          await action(fd);
          router.refresh();
        }}
      >
        <Button
          type="submit"
          size="sm"
          variant="secondary"
          disabled={disabled || pending}
          className="gap-2 border border-pink-500/25 bg-pink-500/10 text-pink-50 hover:bg-pink-500/15"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Publish test post
        </Button>
      </form>
      {state?.error ? (
        <p className="text-[11px] text-red-300" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="text-[11px] text-emerald-300">Nexora AI published successfully.</p>
      ) : null}
    </div>
  );
}
