"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requiere_sesion } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { TipoEquipo } from "@/lib/tipos-dominio";

export type EstadoFormularioParametro = {
  error?: string;
};

function limpiar(valor: FormDataEntryValue | null) {
  return String(valor ?? "").trim();
}

function esTipoEquipoValido(valor: string): valor is TipoEquipo {
  return valor === "alveografo" || valor === "farinografo";
}

function parsearNumeroOpcional(valor: FormDataEntryValue | null): {
  valor: number | null;
  error?: string;
} {
  const limpio = limpiar(valor).replace(",", ".");
  if (!limpio) return { valor: null };

  const numero = Number(limpio);
  if (!Number.isFinite(numero)) {
    return { valor: null, error: "Los límites deben ser valores numéricos." };
  }

  return { valor: numero };
}

export async function crear_parametro(
  _estado: EstadoFormularioParametro,
  formData: FormData
): Promise<EstadoFormularioParametro> {
  await requiere_sesion();

  const clave = limpiar(formData.get("clave")).toUpperCase();
  const nombre = limpiar(formData.get("nombre"));
  const unidad_medida = limpiar(formData.get("unidad_medida")) || null;
  const equipo_origen = limpiar(formData.get("equipo_origen"));
  const lim_min_global = parsearNumeroOpcional(formData.get("lim_min_global"));
  const lim_max_global = parsearNumeroOpcional(formData.get("lim_max_global"));
  const descripcion = limpiar(formData.get("descripcion")) || null;

  if (!clave) return { error: "La clave es obligatoria." };
  if (!nombre) return { error: "El nombre es obligatorio." };
  if (lim_min_global.error) return { error: lim_min_global.error };
  if (lim_max_global.error) return { error: lim_max_global.error };
  if (
    lim_min_global.valor !== null &&
    lim_max_global.valor !== null &&
    lim_min_global.valor > lim_max_global.valor
  ) {
    return { error: "El límite inferior no puede ser mayor al superior." };
  }
  if (!esTipoEquipoValido(equipo_origen)) {
    return { error: "Selecciona un origen de equipo válido." };
  }

  const supabase = await crearClienteServidor();

  const { data: existente } = await supabase
    .from("parametros_calidad")
    .select("id_parametro")
    .eq("clave", clave)
    .maybeSingle();

  if (existente) {
    return { error: "Ya existe un parámetro con esa clave." };
  }

  const { error } = await supabase.from("parametros_calidad").insert({
    clave,
    nombre,
    unidad_medida,
    equipo_origen,
    lim_min_global: lim_min_global.valor,
    lim_max_global: lim_max_global.valor,
    descripcion,
    activo: true,
  });

  if (error) {
    console.error("[parametros][crear]", error);
    return { error: "No fue posible registrar el parámetro." };
  }

  revalidatePath("/parametros");
  redirect("/parametros");
}

export async function editar_parametro(
  _estado: EstadoFormularioParametro,
  formData: FormData
): Promise<EstadoFormularioParametro> {
  await requiere_sesion();

  const id_parametro = parseInt(limpiar(formData.get("id_parametro")), 10);
  const clave = limpiar(formData.get("clave")).toUpperCase();
  const nombre = limpiar(formData.get("nombre"));
  const unidad_medida = limpiar(formData.get("unidad_medida")) || null;
  const equipo_origen = limpiar(formData.get("equipo_origen"));
  const lim_min_global = parsearNumeroOpcional(formData.get("lim_min_global"));
  const lim_max_global = parsearNumeroOpcional(formData.get("lim_max_global"));
  const descripcion = limpiar(formData.get("descripcion")) || null;

  if (!id_parametro) return { error: "Parámetro inválido." };
  if (!clave) return { error: "La clave es obligatoria." };
  if (!nombre) return { error: "El nombre es obligatorio." };
  if (lim_min_global.error) return { error: lim_min_global.error };
  if (lim_max_global.error) return { error: lim_max_global.error };
  if (
    lim_min_global.valor !== null &&
    lim_max_global.valor !== null &&
    lim_min_global.valor > lim_max_global.valor
  ) {
    return { error: "El límite inferior no puede ser mayor al superior." };
  }
  if (!esTipoEquipoValido(equipo_origen)) {
    return { error: "Selecciona un origen de equipo válido." };
  }

  const supabase = await crearClienteServidor();

  const { data: existente } = await supabase
    .from("parametros_calidad")
    .select("id_parametro")
    .eq("clave", clave)
    .neq("id_parametro", id_parametro)
    .maybeSingle();

  if (existente) {
    return { error: "Ya existe otro parámetro con esa clave." };
  }

  const { error } = await supabase
    .from("parametros_calidad")
    .update({
      clave,
      nombre,
      unidad_medida,
      equipo_origen,
      lim_min_global: lim_min_global.valor,
      lim_max_global: lim_max_global.valor,
      descripcion,
    })
    .eq("id_parametro", id_parametro);

  if (error) {
    console.error("[parametros][editar]", error);
    return { error: "No fue posible actualizar el parámetro." };
  }

  revalidatePath("/parametros");
  redirect("/parametros");
}

export async function cambiar_estado_parametro(formData: FormData) {
  await requiere_sesion();

  const id_parametro = parseInt(limpiar(formData.get("id_parametro")), 10);
  const activo = formData.get("activo") === "true";

  if (!id_parametro) return;

  const supabase = await crearClienteServidor();

  await supabase
    .from("parametros_calidad")
    .update({ activo })
    .eq("id_parametro", id_parametro);

  revalidatePath("/parametros");
}
