export type UserPersona = "creator" | "ecommerce" | "personal_brand" | "business";

export const PERSONA_OPTIONS: ReadonlyArray<{
  id: UserPersona;
  label: string;
  description: string;
}> = [
  {
    id: "creator",
    label: "İçerik Üreticisi",
    description: "Niş, trend ve viral büyüme odaklı içerik.",
  },
  {
    id: "ecommerce",
    label: "Ürün Satan Marka",
    description: "Ürün, dönüşüm ve reklam yaratıcıları.",
  },
  {
    id: "personal_brand",
    label: "Kişisel Marka",
    description: "Uzmanlık, otorite ve topluluk.",
  },
  {
    id: "business",
    label: "İşletme",
    description: "Yerel görünürlük, kampanya ve marka iletişimi.",
  },
];

export const GOAL_OPTIONS = [
  "Takipçi kazanmak",
  "Etkileşim artırmak",
  "Ürün satmak",
  "Viral olmak",
  "Marka bilinirliği oluşturmak",
] as const;

export type OnboardingContext = Record<string, string>;

export function isUserPersona(v: string): v is UserPersona {
  return v === "creator" || v === "ecommerce" || v === "personal_brand" || v === "business";
}

export function normalizePersona(v: string | null | undefined): UserPersona {
  if (v && isUserPersona(v)) return v;
  return "creator";
}
