import type { Metadata } from "next";

import { PrivacyPolicyView } from "@/components/legal/privacy-policy-view";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { siteConfig } from "@/lib/constants";

const title = "Gizlilik Politikası";
const description = `${siteConfig.name} — kişisel verilerinizin işlenmesi, OAuth ile sosyal hesap bağlantıları, AI içerik üretimi, analitik ve güvenlik uygulamaları hakkında resmi gizlilik politikası.`;

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: `${siteConfig.url}/privacy`,
    siteName: siteConfig.name,
    title: `${title} · ${siteConfig.name}`,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} · ${siteConfig.name}`,
    description,
  },
  alternates: {
    canonical: "/privacy",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <PrivacyPolicyView />
      <SiteFooter />
    </>
  );
}
