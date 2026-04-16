"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requiere_sesion } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export type EstadoFormularioLote = {
  error?: string;
};

function limpiar(valor: FormDataEntryValue | null) {
  return String(valor ?? "").trim();
}

function numeroOpcional(valor: string) {
  if (!valor) return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

export async function crear_lote(
  _estado: EstadoFormularioLote,
  formData: FormData
): Promise<EstadoFormularioLote> {
  const usuario = await requiere_sesion();

  const numero_lote = limpiar(formData.get("numero_lote")).toUpperCase();
  const id_producto = numeroOpcional(limpiar(formData.get("id_producto")));
  const variedad = limpiar(formData.get("variedad")) || null;
  const fecha_produccion = limpiar(formData.get("fecha_produccion")) || null;
  const fecha_caducidad = limpiar(formData.get("fecha_caducidad")) || null;
  const observaciones = limpiar(formData.get("observaciones")) || null;

  if (!numero_lote) {
    return { error: "El número de lote es obligatorio." };
  }

  const supabase = await crearClienteServidor();

  const { data: existente } = await supabase
    .from("lotes_produccion")
    .select("id_lote")
    .eq("numero_lote", numero_lote)
    .maybeSingle();

  if (existente) {
    return { error: "Ya existe un lote con ese número." };
  }

  const { error } = await supabase.from("lotes_produccion").insert({
    numero_lote,
    id_producto,
    variedad,
    fecha_produccion,
    fecha_caducidad,
    observaciones,
    creado_por: usuario.usuario.id,
    actualizado_por: usuario.usuario.id,
  });

  if (error) {
    console.error("[lotes][crear]", error);
    return { error: "No fue posible registrar el lote." };
  }

  revalidatePath("/lotes");
  redirect("/lotes");
}

export async function editar_lote(
  _estado: EstadoFormularioLote,
  formData: FormData
): Promise<EstadoFormularioLote> {
  const usuario = await requiere_sesion();

  const id_lote = parseInt(limpiar(formData.get("id_lote")), 10);
  const numero_lote = limpiar(formData.get("numero_lote")).toUpperCase();
  const id_producto = numeroOpcional(limpiar(formData.get("id_producto")));
  const variedad = limpiar(formData.get("variedad")) || null;
  const fecha_produccion = limpiar(formData.get("fecha_produccion")) || null;
  const fecha_caducidad = limpiar(formData.get("fecha_caducidad")) || null;
  const observaciones = limpiar(formData.get("observaciones")) || null;

  if (!id_lote) return { error: "Lote inválido." };
  if (!numero_lote) {
    return { error: "El número de lote es obligatorio." };
  }

  const supabase = await crearClienteServidor();

  const { data: existente } = await supabase
    .from("lotes_produccion")
    .select("id_lote")
    .eq("numero_lote", numero_lote)
    .neq("id_lote", id_lote)
    .maybeSingle();

  if (existente) {
    return { error: "Ya existe otro lote con ese número." };
  }

  const { error } = await supabase
    .from("lotes_produccion")
    .update({
      numero_lote,
      id_producto,
      variedad,
      fecha_produccion,
      fecha_caducidad,
      observaciones,
      actualizado_por: usuario.usuario.id,
    })
    .eq("id_lote", id_lote);

  if (error) {
    console.error("[lotes][editar]", error);
    return { error: "No fue posible actualizar el lote." };
  }

  revalidatePath("/lotes");
  redirect("/lotes");
}
