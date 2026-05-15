/** Tek adımlı onboarding — başka step id eklenmemeli (dashboard’da bağlantı). */
export type OnboardingStepId = "mode";

export type OnboardingStepConfig = {
  id: OnboardingStepId;
  title: string;
};

export const ONBOARDING_STEPS: readonly OnboardingStepConfig[] = [
  { id: "mode", title: "Mod & hedef" },
] as const;
