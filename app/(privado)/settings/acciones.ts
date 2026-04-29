"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  puede_asignar_rol,
  requiere_admin,
  type RolUsuario,
} from "@/lib/autorizacion";
import { crearClienteAdmin } from "@/lib/supabase/admin";

function redirigirConMensaje(
  tipo: "error" | "exito",
  mensaje: string
): never {
  const parametros = new URLSearchParams({
    tipo,
    mensaje,
  });

  redirect(`/settings?${parametros.toString()}`);
}

function obtenerRolDesdeFormulario(valor: FormDataEntryValue | null): RolUsuario | null {
  if (
    valor === "superadmin" ||
    valor === "admin" ||
    valor === "gte_calidad" ||
    valor === "gte_plantas" ||
    valor === "dir_operaciones" ||
    valor === "operador"
  ) {
    return valor;
  }

  return null;
}

export async function aprobar_usuario(formData: FormData) {
  const idObjetivo = String(formData.get("id") ?? "").trim();
  const rolObjetivo = obtenerRolDesdeFormulario(formData.get("rol"));

  if (!idObjetivo || !rolObjetivo) {
    redirigirConMensaje("error", "Datos incompletos para aprobar al usuario.");
  }

  const actor = await requiere_admin();

  if (!puede_asignar_rol(actor.perfil.rol, rolObjetivo)) {
    redirigirConMensaje(
      "error",
      "Tu rol actual no puede asignar ese permiso."
    );
  }

  const supabaseAdmin = crearClienteAdmin();

  const { data: perfilObjetivo, error: errorPerfil } = await supabaseAdmin
    .from("perfiles")
    .select("id, rol, aprobado")
    .eq("id", idObjetivo)
    .maybeSingle();

  if (errorPerfil || !perfilObjetivo) {
    redirigirConMensaje("error", "No se encontró el usuario a aprobar.");
  }

  if (actor.usuario.id === idObjetivo) {
    redirigirConMensaje(
      "error",
      "No puedes aprobar ni modificar tu propia cuenta desde aquí."
    );
  }

  if (perfilObjetivo.rol === "superadmin" && actor.perfil.rol !== "superadmin") {
    redirigirConMensaje(
      "error",
      "Solo el superadmin puede modificar otra cuenta superadmin."
    );
  }

  const { error } = await supabaseAdmin
    .from("perfiles")
    .update({
      rol: rolObjetivo,
      aprobado: true,
      aprobado_en: new Date().toISOString(),
      aprobado_por: actor.usuario.id,
    })
    .eq("id", idObjetivo);

  if (error) {
    redirigirConMensaje("error", "No fue posible aprobar al usuario.");
  }

  revalidatePath("/", "layout");
  revalidatePath("/settings");
  redirigirConMensaje("exito", "Usuario aprobado correctamente.");
}

export async function actualizar_rol(formData: FormData) {
  const idObjetivo = String(formData.get("id") ?? "").trim();
  const rolObjetivo = obtenerRolDesdeFormulario(formData.get("rol"));

  if (!idObjetivo || !rolObjetivo) {
    redirigirConMensaje("error", "Datos incompletos para actualizar el rol.");
  }

  const actor = await requiere_admin();

  if (actor.usuario.id === idObjetivo) {
    redirigirConMensaje("error", "No puedes cambiar tu propio rol.");
  }

  if (!puede_asignar_rol(actor.perfil.rol, rolObjetivo)) {
    redirigirConMensaje(
      "error",
      "Tu rol actual no puede asignar ese permiso."
    );
  }

  const supabaseAdmin = crearClienteAdmin();

  const { data: perfilObjetivo, error: errorPerfil } = await supabaseAdmin
    .from("perfiles")
    .select("id, rol, aprobado")
    .eq("id", idObjetivo)
    .maybeSingle();

  if (errorPerfil || !perfilObjetivo) {
    redirigirConMensaje("error", "No se encontró el usuario seleccionado.");
  }

  if (perfilObjetivo.rol === "superadmin" && actor.perfil.rol !== "superadmin") {
    redirigirConMensaje(
      "error",
      "Solo el superadmin puede cambiar el rol de otra cuenta superadmin."
    );
  }

  const { error } = await supabaseAdmin
    .from("perfiles")
    .update({
      rol: rolObjetivo,
    })
    .eq("id", idObjetivo);

  if (error) {
    redirigirConMensaje("error", "No fue posible guardar el nuevo rol.");
  }

  revalidatePath("/", "layout");
  revalidatePath("/settings");
  redirigirConMensaje("exito", "Rol actualizado correctamente.");
}

/*
SQL manual para ejecutar en Supabase SQL Editor:

ALTER TABLE perfiles DROP CONSTRAINT IF EXISTS perfiles_rol_check;
ALTER TABLE perfiles ADD CONSTRAINT perfiles_rol_check CHECK (rol IN ('superadmin', 'admin', 'gte_calidad', 'gte_plantas', 'dir_operaciones', 'operador'));
*/
