"use client";

import { useMemo } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

/**
 * İstemci bileşenlerinde Supabase oturumu için.
 * Ortam değişkenleri yoksa null döner (geliştirme sırasında güvenli düşüş).
 */
export function useSupabaseBrowser() {
  return useMemo(() => {
    try {
      return createBrowserSupabaseClient();
    } catch {
      return null;
    }
  }, []);
}
