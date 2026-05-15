export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { runMetaPublishingStartupDiagnostics } = await import("@/lib/db/startup-meta-diagnostics");
    const { logDbError } = await import("@/lib/logging/nexora-log");
    await runMetaPublishingStartupDiagnostics().catch((e) => {
      logDbError("Startup Meta schema diagnostics failed.", {
        message: e instanceof Error ? e.message : String(e),
      });
    });
  }
}
