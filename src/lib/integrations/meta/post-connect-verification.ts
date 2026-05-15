import { META_OAUTH_GRAPH_BASE } from "@/lib/integrations/meta/oauth";
import { isInstagramProfessionalAccount } from "@/lib/integrations/meta/instagram-discovery";
import { logMetaWarn } from "@/lib/logging/nexora-log";

export type InstagramPostConnectVerification = {
  profileOk: boolean;
  pageLinked: boolean;
  professionalAccount: boolean;
  permissionsOk: boolean;
  graphHealthy: boolean;
  warnings: string[];
};

type PermissionsPayload = { data?: Array<{ permission?: string; status?: string }> };

/**
 * Lightweight post-connect checks (non-fatal for OAuth UX). Logs [NEXORA_META] on issues.
 */
export async function verifyInstagramPostConnect(input: {
  accessToken: string;
  instagramBusinessId: string;
  metaPageId: string;
  accountType: string | null;
}): Promise<InstagramPostConnectVerification> {
  const warnings: string[] = [];

  let profileOk = false;
  let graphHealthy = false;

  try {
    const profileUrl = new URL(`${META_OAUTH_GRAPH_BASE}/${input.instagramBusinessId}`);
    profileUrl.searchParams.set("fields", "id,username,account_type");
    profileUrl.searchParams.set("access_token", input.accessToken);
    const pr = await fetch(profileUrl.toString(), { cache: "no-store" });
    graphHealthy = pr.ok;
    const raw = await pr.text();
    let body: { id?: string; username?: string; account_type?: string; error?: { message?: string } } =
      {};
    try {
      body = raw ? (JSON.parse(raw) as typeof body) : {};
    } catch {
      warnings.push("Instagram profile parse failed (Graph).");
    }
    if (!pr.ok || body.error) {
      warnings.push(
        body.error?.message ?? `Instagram profile HTTP ${pr.status}`,
      );
    } else {
      profileOk = Boolean(body.id && body.username);
      if (!isInstagramProfessionalAccount(body.account_type ?? input.accountType)) {
        warnings.push(
          "Instagram is not a Professional (Business/Creator) account — native publishing may fail.",
        );
      }
    }
  } catch (e) {
    warnings.push(e instanceof Error ? e.message : "Instagram profile request failed.");
  }

  const professionalAccount = isInstagramProfessionalAccount(input.accountType);

  let permissionsOk = false;
  try {
    const permUrl = new URL(`${META_OAUTH_GRAPH_BASE}/me/permissions`);
    permUrl.searchParams.set("access_token", input.accessToken);
    const pr = await fetch(permUrl.toString(), { cache: "no-store" });
    const raw = await pr.text();
    let parsed: PermissionsPayload & { error?: { message?: string } } = {};
    try {
      parsed = raw ? (JSON.parse(raw) as PermissionsPayload & { error?: { message?: string } }) : {};
    } catch {
      warnings.push("Permissions response parse failed.");
    }
    if (!pr.ok || parsed.error) {
      warnings.push(parsed.error?.message ?? `Permissions HTTP ${pr.status}`);
    } else {
      const granted = new Set(
        (parsed.data ?? [])
          .filter((p) => p.status === "granted")
          .map((p) => p.permission)
          .filter(Boolean) as string[],
      );
      permissionsOk =
        granted.has("instagram_basic") &&
        granted.has("instagram_content_publish") &&
        granted.has("pages_show_list");
      if (!permissionsOk) {
        warnings.push(
          "Missing expected granted permissions (instagram_basic, instagram_content_publish, pages_show_list).",
        );
      }
    }
  } catch (e) {
    warnings.push(e instanceof Error ? e.message : "Permissions request failed.");
  }

  const pageLinked = Boolean(input.metaPageId?.length && input.instagramBusinessId?.length);

  if (warnings.length) {
    for (const w of warnings) {
      logMetaWarn("post_connect_verify", { detail: w });
    }
  }

  return {
    profileOk,
    pageLinked,
    professionalAccount,
    permissionsOk,
    graphHealthy,
    warnings,
  };
}
