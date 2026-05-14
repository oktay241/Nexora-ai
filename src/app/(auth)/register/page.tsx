import type { Metadata } from "next";
import Link from "next/link";

import { RegisterForm } from "@/components/auth/register-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kayıt",
  description: "Nexora ile ücretsiz hesap oluşturun.",
};

export default function RegisterPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Hesap oluştur</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Kurulumdan sonra AI içerik ve planlama akışı açılır.
        </p>
      </div>
      <RegisterForm />
      <p className="text-center text-sm text-muted-foreground">
        Zaten hesabınız var mı?{" "}
        <Link href="/login" className="text-violet-300 hover:underline">
          Giriş yapın
        </Link>
      </p>
    </div>
  );
}
