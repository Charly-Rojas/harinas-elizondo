"use client";

import { createBrowserClient } from "@supabase/ssr";
import { obtenerCredencialesPublicasSupabase } from "@/lib/supabase/configuracion";

export function crearClienteNavegador() {
  const { url, clavePublicable } = obtenerCredencialesPublicasSupabase();

  return createBrowserClient(url, clavePublicable);
}
