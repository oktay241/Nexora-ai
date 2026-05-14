import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Giriş",
  description: "Nexora hesabınıza giriş yapın.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const raw = sp.next?.trim();
  const next =
    raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Giriş yap</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Otonom sosyal büyüme paneline erişin.
        </p>
      </div>
      <LoginForm nextPath={next} />
      <p className="text-center text-sm text-muted-foreground">
        Hesabınız yok mu?{" "}
        <Link href="/register" className="text-violet-300 hover:underline">
          Kayıt olun
        </Link>
      </p>
    </div>
  );
}
