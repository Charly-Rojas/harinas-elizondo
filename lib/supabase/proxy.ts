import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { obtenerCredencialesPublicasSupabase } from "@/lib/supabase/configuracion";

type RolUsuario =
  | "admin"
  | "gerente_laboratorio"
  | "gte_calidad"
  | "gte_plantas"
  | "dir_operaciones"
  | "laboratorista";

function esAdministrador(rol: RolUsuario) {
  return rol === "admin" || rol === "gerente_laboratorio";
}

function puedeEscribirPanel(rol: RolUsuario) {
  return (
    rol === "admin" ||
    rol === "gerente_laboratorio" ||
    rol === "laboratorista"
  );
}

function puedeVerSoloEstadisticas(rol: RolUsuario) {
  return (
    rol === "gte_calidad" ||
    rol === "gte_plantas" ||
    rol === "dir_operaciones"
  );
}

function esRutaPrivada(pathname: string) {
  return pathname.startsWith("/settings") ||
    pathname.startsWith("/clientes") ||
    pathname.startsWith("/productos") ||
    pathname.startsWith("/equipos") ||
    pathname.startsWith("/parametros") ||
    pathname.startsWith("/lotes") ||
    pathname.startsWith("/inspecciones") ||
    pathname.startsWith("/certificados") ||
    pathname === "/";
}

export async function actualizar_sesion(request: NextRequest) {
  let response = NextResponse.next({ request });

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

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const pathname = request.nextUrl.pathname;

    await supabase.auth.getClaims();

    if (!esRutaPrivada(pathname)) {
      return response;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    const { data: perfil } = await supabase
      .from("perfiles")
      .select("rol, aprobado, status")
      .eq("id", user.id)
      .maybeSingle();

    if (!perfil || !perfil.aprobado || perfil.status !== "activo") {
      const homeUrl = new URL("/", request.url);
      return NextResponse.redirect(homeUrl);
    }

    const rol = perfil.rol as RolUsuario;

    if (pathname.startsWith("/settings")) {
      if (!esAdministrador(rol)) {
        return NextResponse.redirect(new URL("/", request.url));
      }
      return response;
    }

    if (
      pathname.startsWith("/clientes") ||
      pathname.startsWith("/productos") ||
      pathname.startsWith("/equipos") ||
      pathname.startsWith("/parametros") ||
      pathname.startsWith("/lotes") ||
      pathname.startsWith("/inspecciones") ||
      pathname.startsWith("/certificados")
    ) {
      if (!puedeEscribirPanel(rol)) {
        return NextResponse.redirect(new URL("/", request.url));
      }
      return response;
    }

    if (pathname === "/") {
      if (puedeVerSoloEstadisticas(rol) || puedeEscribirPanel(rol) || esAdministrador(rol)) {
        return response;
      }
    }

    return response;
  } catch {
    return response;
  }
}

export const config = {
  matcher: [
    "/",
    "/settings/:path*",
    "/clientes/:path*",
    "/productos/:path*",
    "/equipos/:path*",
    "/parametros/:path*",
    "/lotes/:path*",
    "/inspecciones/:path*",
    "/certificados/:path*",
  ],
};