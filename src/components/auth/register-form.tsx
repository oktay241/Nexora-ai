"use client";

import { useActionState } from "react";
import Link from "next/link";

import { signUp } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(signUp, undefined);

  return (
    <Card className="border-white/10 bg-white/[0.02] shadow-glow">
      <CardContent className="p-6 sm:p-8">
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Ad (isteğe bağlı)</Label>
            <Input id="full_name" name="full_name" autoComplete="name" placeholder="Adınız" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="siz@ornek.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Şifre</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="En az 8 karakter"
            />
          </div>
          {state?.error ? (
            <p className="text-sm text-red-400" role="alert">
              {state.error}
            </p>
          ) : null}
          <Button type="submit" className="w-full shadow-glow" disabled={pending}>
            {pending ? "Kayıt yapılıyor…" : "Kayıt ol"}
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Ana sayfaya dön
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
