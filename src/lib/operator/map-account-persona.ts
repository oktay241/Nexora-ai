import { type UserPersona } from "@/lib/onboarding/persona";

export function mapAccountTypeToPersona(accountType: string | undefined | null): UserPersona {
  const t = (accountType ?? "").toLowerCase();
  if (t.includes("ecommerce") || t.includes("e-ticaret") || t.includes("ürün")) return "ecommerce";
  if (t.includes("personal") || t.includes("kişisel")) return "personal_brand";
  if (t.includes("saas")) return "business";
  if (t.includes("business") || t.includes("işletme") || t.includes("kurumsal")) return "business";
  if (t.includes("creator") || t.includes("içerik")) return "creator";
  return "creator";
}
