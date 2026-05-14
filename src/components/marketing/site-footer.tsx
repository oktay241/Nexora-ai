import Link from "next/link";
import { Sparkles } from "lucide-react";

import { siteConfig } from "@/lib/constants";

const links = [
  { label: "Ürün", href: "#features" },
  { label: "Hedef", href: "#engine" },
  { label: "Fiyat", href: "#pricing" },
  { label: "Panel", href: "/dashboard" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-black/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-14 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
              <Sparkles className="h-4 w-4 text-violet-300" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">
              {siteConfig.name}
            </span>
          </Link>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {siteConfig.description}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Gezin
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {links.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Yasal
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link
                  href="/privacy"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Gizlilik
                </Link>
              </li>
              <li>
                <span className="cursor-not-allowed">Şartlar</span>
              </li>
            </ul>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Durum
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Önizleme sürümü — arka uç bağlantıları yakında.
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-white/[0.06] py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {siteConfig.name}. Tüm hakları saklıdır.
      </div>
    </footer>
  );
}
