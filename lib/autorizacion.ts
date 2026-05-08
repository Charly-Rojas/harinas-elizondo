import "server-only";

import { redirect } from "next/navigation";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { supabaseAdminConfigurado } from "@/lib/supabase/configuracion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { PerfilUsuario, RolUsuario, StatusUsuario } from "@/lib/tipos";

export type { PerfilUsuario, RolUsuario } from "@/lib/tipos";

export type UsuarioAutenticado = {
  usuario: {
    id: string;
    email: string | undefined;
  };
  perfil: PerfilUsuario;
};

export function es_administrador(rol: RolUsuario) {
  return rol === "admin" || rol === "gerente_laboratorio";
}

export function puede_escribir_panel(rol: RolUsuario) {
  return (
    rol === "admin" ||
    rol === "gerente_laboratorio" ||
    rol === "laboratorista"
  );
}

export function es_gerente(rol: RolUsuario) {
  return (
    rol === "gte_calidad" ||
    rol === "gte_plantas" ||
    rol === "dir_operaciones"
  );
}

export function puede_asignar_rol(rolActor: RolUsuario, rolObjetivo: RolUsuario) {
  if (!es_administrador(rolActor)) return false;
  return (
    rolObjetivo === "admin" ||
    rolObjetivo === "gerente_laboratorio" ||
    rolObjetivo === "gte_calidad" ||
    rolObjetivo === "gte_plantas" ||
    rolObjetivo === "dir_operaciones" ||
    rolObjetivo === "laboratorista"
  );
}

export function usuario_activo(perfil: Pick<PerfilUsuario, "aprobado" | "status">) {
  return perfil.aprobado && perfil.status === "activo";
}

function nombreInicialUsuario(correo: string, nombre?: unknown) {
  if (typeof nombre === "string" && nombre.trim()) {
    return nombre.trim();
  }

  return correo.split("@")[0] ?? "Usuario";
}

async function buscarPerfil(
  idUsuario: string,
  usarAdmin = false
): Promise<PerfilUsuario | null> {
  const cliente = usarAdmin ? crearClienteAdmin() : await crearClienteServidor();

  const { data: perfil } = await cliente
    .from("perfiles")
    .select(
      "id, correo, nombre, rol, aprobado, status, aprobado_en, aprobado_por, creado_en"
    )
    .eq("id", idUsuario)
    .maybeSingle();

  return (perfil as PerfilUsuario | null) ?? null;
}

async function asegurar_perfil_faltante(usuario: {
  id: string;
  email?: string;
  user_metadata?: {
    nombre?: unknown;
  };
}) {
  if (!supabaseAdminConfigurado() || !usuario.email) {
    return null;
  }

  const correo = usuario.email.trim().toLowerCase();
  const esAdminInicial = correo === "superadmin@harinas-elizondo.local";
  const supabaseAdmin = crearClienteAdmin();

  const { error } = await supabaseAdmin.from("perfiles").upsert(
    {
      id: usuario.id,
      correo,
      nombre: nombreInicialUsuario(correo, usuario.user_metadata?.nombre),
      rol: esAdminInicial ? "admin" : "laboratorista",
      aprobado: esAdminInicial,
      status: esAdminInicial ? "activo" : "pendiente",
      aprobado_en: esAdminInicial ? new Date().toISOString() : null,
      aprobado_por: null,
    },
    {
      onConflict: "id",
      ignoreDuplicates: false,
    }
  );

  if (error) {
    console.error("[supabase][perfil_faltante]", {
      id: usuario.id,
      correo,
      message: error.message,
      code: error.code,
      status: error.details,
    });
    return null;
  }

  return buscarPerfil(usuario.id, true);
}

export async function obtener_usuario_actual(): Promise<UsuarioAutenticado | null> {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  let perfil = await buscarPerfil(user.id);

  if (!perfil) {
    perfil = await asegurar_perfil_faltante(user);
  }

  if (!perfil) {
    return null;
  }

  return {
    usuario: {
      id: user.id,
      email: user.email,
    },
    perfil,
  };
}

export async function requiere_sesion(): Promise<UsuarioAutenticado> {
  const actual = await obtener_usuario_actual();

  if (!actual) {
    redirect("/login");
  }

  return actual;
}

export async function requiere_admin(): Promise<UsuarioAutenticado> {
  const actual = await requiere_sesion();

  if (!usuario_activo(actual.perfil) || !es_administrador(actual.perfil.rol)) {
    redirect("/");
  }

  return actual;
}

export async function requiere_permiso_escritura(): Promise<UsuarioAutenticado> {
  const actual = await requiere_sesion();

  if (!usuario_activo(actual.perfil) || !puede_escribir_panel(actual.perfil.rol)) {
    redirect("/");
  }

  return actual;
}

export function status_usuario_desde_datos(
  aprobado: boolean,
  status: string | null | undefined
): StatusUsuario {
  if (
    status === "pendiente" ||
    status === "activo" ||
    status === "rechazado" ||
    status === "baja"
  ) {
    return status;
  }

  return aprobado ? "activo" : "pendiente";
}
