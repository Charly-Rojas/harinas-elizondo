import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { obtenerCredencialesPublicasSupabase } from "@/lib/supabase/configuracion";

export async function actualizar_sesion(request: NextRequest) {
  let respuesta = NextResponse.next({
    request,
  });

  try {
    const { url, clavePublicable } = obtenerCredencialesPublicasSupabase();

    const supabase = createServerClient(url, clavePublicable, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          respuesta = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            respuesta.cookies.set(name, value, options);
          });
        },
      },
    });

    await supabase.auth.getClaims();
    return respuesta;
  } catch {
    return respuesta;
  }
}
