import "server-only";

import { createClient } from "@supabase/supabase-js";
import { obtenerCredencialesAdminSupabase } from "@/lib/supabase/configuracion";

export function crearClienteAdmin() {
  const { url, serviceRole } = obtenerCredencialesAdminSupabase();

  return createClient(url, serviceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
