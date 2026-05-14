"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Instagram, Sparkles } from "lucide-react";
import type { SVGProps } from "react";

import {
  finalizeOnboarding,
  runDiscoveryOperator,
  runGrowthStrategyOperator,
  saveOperatorSocial,
  saveUsageModeAndGoal,
} from "@/actions/onboarding";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { GOAL_OPTIONS } from "@/lib/onboarding/persona";
import type { DiscoveryProfile, GrowthStrategyPayload } from "@/lib/operator/discovery-types";
import { cn } from "@/lib/utils";

const steps = ["Mod & hedef", "Hesaplar", "Discovery", "Strateji", "Operasyon"] as const;

function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [usageMode, setUsageMode] = useState<"full_auto" | "approval_required" | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [bio, setBio] = useState("");
  const [discovery, setDiscovery] = useState<DiscoveryProfile | null>(null);
  const [growth, setGrowth] = useState<GrowthStrategyPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finalizeState, setFinalizeState] = useState<"idle" | "running" | "done" | "error">(
    "idle",
  );
  const [finalizeMessage, setFinalizeMessage] = useState<string | null>(null);
  const finalizeStarted = useRef(false);

  const progress = ((step + 1) / steps.length) * 100;

  const runFinalize = useCallback(async () => {
    setFinalizeState("running");
    setFinalizeMessage(null);
    const res = await finalizeOnboarding();
    if (res.error) {
      setFinalizeState("error");
      setFinalizeMessage(res.error);
      return;
    }
    setFinalizeState("done");
  }, []);

  useEffect(() => {
    if (step !== 4 || finalizeStarted.current) return;
    finalizeStarted.current = true;
    void runFinalize();
  }, [step, runFinalize]);

  async function handleNext() {
    setError(null);
    setBusy(true);
    try {
      if (step === 0) {
        if (!usageMode || !goal) return;
        const r = await saveUsageModeAndGoal(usageMode, goal);
        if (r.error) {
          setError(r.error);
          return;
        }
        setStep(1);
      } else if (step === 1) {
        const r = await saveOperatorSocial({
          instagram,
          tiktok,
          bio,
        });
        if (r.error) {
          setError(r.error);
          return;
        }
        setStep(2);
      } else if (step === 2) {
        if (!discovery) {
          setError('Önce "Discovery Engine" analizini çalıştırın.');
          return;
        }
        setStep(3);
      } else if (step === 3) {
        if (!growth) {
          setError('Önce "Growth Strategy" üretin.');
          return;
        }
        setStep(4);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleRunDiscovery() {
    setError(null);
    setBusy(true);
    try {
      const r = await runDiscoveryOperator();
      if (r.error) {
        setError(r.error);
        return;
      }
      if (r.discovery) setDiscovery(r.discovery);
    } finally {
      setBusy(false);
    }
  }

  async function handleRunGrowth() {
    setError(null);
    setBusy(true);
    try {
      const r = await runGrowthStrategyOperator();
      if (r.error) {
        setError(r.error);
        return;
      }
      if (r.growth) setGrowth(r.growth);
    } finally {
      setBusy(false);
    }
  }

  function back() {
    if (step > 0) setStep((s) => s - 1);
  }

  const canNext =
    step === 0
      ? Boolean(usageMode && goal)
      : step === 1
        ? Boolean(instagram.trim() || tiktok.trim())
        : step === 2
          ? Boolean(discovery)
          : step === 3
            ? Boolean(growth)
            : false;

  const strategyProgress =
    finalizeState === "idle" ? 8 : finalizeState === "running" ? 72 : finalizeState === "done" ? 100 : 40;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Ana sayfa
          </Link>
        </Button>
        <Badge variant="outline">Growth operatörü</Badge>
      </div>

      <div className="mb-8 space-y-3">
        <div className="flex justify-between text-[11px] text-muted-foreground sm:text-xs">
          {steps.map((s, i) => (
            <span key={s} className={cn(i === step ? "text-violet-200" : i < step ? "text-foreground" : "")}>
              {i + 1}. {s}
            </span>
          ))}
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {step === 0 && (
            <Card className="border-white/10 bg-white/[0.02] shadow-glow">
              <CardContent className="space-y-8 p-6 sm:p-8">
                <div>
                  <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                    Kullanım modu
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Nexora tam otonom growth operatörü olarak çalışır. Paylaşım onayını seçin.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setUsageMode("full_auto")}
                    className={cn(
                      "flex flex-col items-start gap-2 rounded-xl border px-4 py-4 text-left text-sm transition-all",
                      usageMode === "full_auto"
                        ? "border-violet-500/50 bg-violet-500/10 shadow-glow"
                        : "border-white/10 bg-black/30 hover:border-white/20",
                    )}
                  >
                    <span className="font-medium">Tam Otomatik</span>
                    <span className="text-xs text-muted-foreground">
                      AI içerik üretir ve otomatik paylaşım kuyruğuna alır (MVP: kuyruk).
                    </span>
                    {usageMode === "full_auto" ? <Check className="ml-auto h-4 w-4 text-violet-200" /> : null}
                  </button>
                  <button
                    type="button"
                    onClick={() => setUsageMode("approval_required")}
                    className={cn(
                      "flex flex-col items-start gap-2 rounded-xl border px-4 py-4 text-left text-sm transition-all",
                      usageMode === "approval_required"
                        ? "border-violet-500/50 bg-violet-500/10 shadow-glow"
                        : "border-white/10 bg-black/30 hover:border-white/20",
                    )}
                  >
                    <span className="font-medium">Onaylı Mod</span>
                    <span className="text-xs text-muted-foreground">
                      AI üretir; yayın öncesi onay akışı (yakında UI).
                    </span>
                    {usageMode === "approval_required" ? (
                      <Check className="ml-auto h-4 w-4 text-violet-200" />
                    ) : null}
                  </button>
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold">Büyüme hedefi</h2>
                  <p className="mt-1 text-xs text-muted-foreground">Strateji ve üretim önceliği buna göre ayarlanır.</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {GOAL_OPTIONS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGoal(g)}
                        className={cn(
                          "flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-all",
                          goal === g
                            ? "border-violet-500/50 bg-violet-500/10 shadow-glow"
                            : "border-white/10 bg-black/30 hover:border-white/20",
                        )}
                      >
                        {g}
                        {goal === g ? <Check className="h-4 w-4 text-violet-200" /> : null}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 1 && (
            <Card className="border-white/10 bg-white/[0.02] shadow-glow">
              <CardContent className="space-y-6 p-6 sm:p-8">
                <div>
                  <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                    Sosyal medya hesabını bağla
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Kullanıcı adı veya profil linki yeterli. OAuth şimdilik gerekmez — analiz metin tabanlıdır.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ig">Instagram</Label>
                  <div className="relative">
                    <Instagram className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pink-300" />
                    <Input
                      id="ig"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="@hesap veya https://instagram.com/..."
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tt">TikTok</Label>
                  <div className="relative">
                    <TikTokIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300" />
                    <Input
                      id="tt"
                      value={tiktok}
                      onChange={(e) => setTiktok(e.target.value)}
                      placeholder="@hesap veya profil URL"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio veya içerik özeti (önerilir)</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Profil bio’nuzu yapıştırın veya hesabınızı kısaca anlatın — Discovery Engine için."
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card className="border-white/10 bg-white/[0.02] shadow-glow">
              <CardContent className="space-y-6 p-6 sm:p-8">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10">
                    <Sparkles className="h-5 w-5 text-amber-200" />
                  </span>
                  <div>
                    <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                      AI Discovery Engine
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Bio, niş, hesap tipi, içerik formatları ve skorlar üretilir.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/15"
                  disabled={busy}
                  onClick={() => void handleRunDiscovery()}
                >
                  {busy ? "Analiz ediliyor…" : discovery ? "Analizi yeniden çalıştır" : "Discovery’yi çalıştır"}
                </Button>
                {discovery ? (
                  <div className="space-y-3 rounded-xl border border-white/10 bg-black/40 p-4 text-sm">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{discovery.account_type}</Badge>
                      <Badge variant="outline">{discovery.niche}</Badge>
                    </div>
                    <p className="text-muted-foreground">{discovery.bio_analysis}</p>
                    <p className="text-xs text-muted-foreground">
                      Formatlar: {discovery.content_formats.join(", ")}
                    </p>
                    <div className="flex gap-4 text-xs">
                      <span>Growth score: {discovery.growth_score}</span>
                      <span>Viral: {discovery.viral_potential}</span>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card className="border-white/10 bg-white/[0.02] shadow-glow">
              <CardContent className="space-y-6 p-6 sm:p-8">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-500/25 bg-sky-500/10">
                    <Sparkles className="h-5 w-5 text-sky-200" />
                  </span>
                  <div>
                    <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                      AI Growth Strategy
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Paylaşım sıklığı, hook stili, platform stratejisi ve içerik sütunları.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/15"
                  disabled={busy}
                  onClick={() => void handleRunGrowth()}
                >
                  {busy ? "Üretiliyor…" : growth ? "Stratejiyi yenile" : "Strateji üret"}
                </Button>
                {growth ? (
                  <div className="space-y-3 rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground/95">{growth.operator_loop_summary}</p>
                    <p>{growth.posting_frequency}</p>
                    <p>Hook: {growth.recommended_hook_style}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {growth.content_pillars.map((p) => (
                        <Badge key={p} variant="outline" className="text-[10px]">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card className="border-white/10 bg-white/[0.02] shadow-glow">
              <CardContent className="space-y-6 p-6 sm:p-8">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-violet-500/30 to-sky-500/20">
                    <Sparkles className="h-5 w-5 text-violet-100" />
                  </span>
                  <div>
                    <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                      Operasyon başlatılıyor
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                      İlk Creative Engine paketi, planlı yayınlar ve örnek analitik satırları oluşturuluyor.
                    </p>
                  </div>
                </div>
                <div className="space-y-3 rounded-xl border border-white/10 bg-black/40 p-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Durum</span>
                    <span>{Math.min(strategyProgress, 100)}%</span>
                  </div>
                  <Progress value={Math.min(strategyProgress, 100)} />
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>— Analyze → Learn → Generate → Publish → Measure → Optimize</li>
                    <li>— Viral hook, Reels senaryosu, carousel, CTA, trend uyumu, UGC fikirleri</li>
                    <li>— Kuyruk ve dashboard operation center</li>
                  </ul>
                  {finalizeState === "error" && finalizeMessage ? (
                    <p className="text-sm text-red-300">{finalizeMessage}</p>
                  ) : null}
                </div>
                {finalizeState === "done" ? (
                  <Button className="w-full shadow-glow" size="lg" onClick={() => router.push("/dashboard")}>
                    Operation center’a git
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : null}
                {finalizeState === "error" ? (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      finalizeStarted.current = false;
                      setFinalizeState("idle");
                      void runFinalize();
                    }}
                  >
                    Tekrar dene
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {step < 4 ? (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <Button variant="secondary" onClick={back} disabled={step === 0 || busy}>
            Geri
          </Button>
          <Button onClick={() => void handleNext()} disabled={!canNext || busy}>
            {busy ? "Kaydediliyor…" : "Devam"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      {step === 2 ? (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Discovery tamamlandıktan sonra &quot;Devam&quot; ile strateji adımına geçin.
        </p>
      ) : null}
      {step === 3 ? (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Strateji hazır olduktan sonra &quot;Devam&quot; ile operasyonu başlatın.
        </p>
      ) : null}
    </div>
  );
}
