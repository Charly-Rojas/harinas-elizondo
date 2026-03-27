import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { obtenerCredencialesPublicasSupabase } from "@/lib/supabase/configuracion";

export async function crearClienteServidor() {
  const { url, clavePublicable } = obtenerCredencialesPublicasSupabase();
  const cookieStore = await cookies();

  return createServerClient(url, clavePublicable, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // En Server Components no siempre es posible escribir cookies.
        }
      },
    },
  });
}
