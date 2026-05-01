"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requiere_sesion } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { TipoEquipo } from "@/lib/tipos-dominio";

export type EstadoFormularioEquipo = {
  error?: string;
};

function limpiar(valor: FormDataEntryValue | null) {
  return String(valor ?? "").trim();
}

function esTipoEquipoValido(valor: string): valor is TipoEquipo {
  return valor === "alveografo" || valor === "farinografo" || valor === "otro";
}

function esEstadoEquipoValido(valor: string): valor is "activo" | "inactivo" | "baja" {
  return valor === "activo" || valor === "inactivo" || valor === "baja";
}

export async function crear_equipo(
  _estado: EstadoFormularioEquipo,
  formData: FormData
): Promise<EstadoFormularioEquipo> {
  const usuario = await requiere_sesion();

  const clave = limpiar(formData.get("clave")).toUpperCase();
  const tipo = limpiar(formData.get("tipo"));
  const descripcion_larga = limpiar(formData.get("descripcion_larga"));
  const descripcion_corta = limpiar(formData.get("descripcion_corta")) || null;
  const marca = limpiar(formData.get("marca")) || null;
  const modelo = limpiar(formData.get("modelo")) || null;
  const serie = limpiar(formData.get("serie")) || null;
  const proveedor = limpiar(formData.get("proveedor")) || null;
  const fecha_adquisicion = limpiar(formData.get("fecha_adquisicion")) || null;
  const garantia = limpiar(formData.get("garantia")) || null;
  const vigencia_garantia = limpiar(formData.get("vigencia_garantia")) || null;
  const ubicacion = limpiar(formData.get("ubicacion")) || null;
  const responsable = limpiar(formData.get("responsable")) || null;
  const mantenimiento = limpiar(formData.get("mantenimiento")) || null;

  if (!clave) return { error: "La clave del equipo es obligatoria." };
  if (!esTipoEquipoValido(tipo)) {
    return { error: "Selecciona un tipo de equipo válido." };
  }
  if (!descripcion_larga) {
    return { error: "La descripción larga es obligatoria." };
  }

  const supabase = await crearClienteServidor();

  const { data: existente } = await supabase
    .from("equipos_laboratorio")
    .select("id_equipo")
    .eq("clave", clave)
    .maybeSingle();

  if (existente) {
    return { error: "Ya existe un equipo con esa clave." };
  }

  const { error } = await supabase
    .from("equipos_laboratorio")
    .insert({
      clave,
      tipo,
      descripcion_larga,
      descripcion_corta,
      marca,
      modelo,
      serie,
      proveedor,
      fecha_adquisicion,
      garantia,
      vigencia_garantia,
      ubicacion,
      responsable,
      mantenimiento,
      status: "activo",
      creado_por: usuario.usuario.id,
      actualizado_por: usuario.usuario.id,
    });

  if (error) {
    console.error("[equipos][crear]", error);
    return { error: "No fue posible registrar el equipo." };
  }

  revalidatePath("/equipos");
  redirect("/equipos");
}

export async function editar_equipo(
  _estado: EstadoFormularioEquipo,
  formData: FormData
): Promise<EstadoFormularioEquipo> {
  const usuario = await requiere_sesion();

  const id_equipo = parseInt(limpiar(formData.get("id_equipo")), 10);
  const clave = limpiar(formData.get("clave")).toUpperCase();
  const tipo = limpiar(formData.get("tipo"));
  const descripcion_larga = limpiar(formData.get("descripcion_larga"));
  const descripcion_corta = limpiar(formData.get("descripcion_corta")) || null;
  const marca = limpiar(formData.get("marca")) || null;
  const modelo = limpiar(formData.get("modelo")) || null;
  const serie = limpiar(formData.get("serie")) || null;
  const proveedor = limpiar(formData.get("proveedor")) || null;
  const fecha_adquisicion = limpiar(formData.get("fecha_adquisicion")) || null;
  const garantia = limpiar(formData.get("garantia")) || null;
  const vigencia_garantia = limpiar(formData.get("vigencia_garantia")) || null;
  const ubicacion = limpiar(formData.get("ubicacion")) || null;
  const responsable = limpiar(formData.get("responsable")) || null;
  const mantenimiento = limpiar(formData.get("mantenimiento")) || null;

  if (!id_equipo) return { error: "Equipo inválido." };
  if (!clave) return { error: "La clave del equipo es obligatoria." };
  if (!esTipoEquipoValido(tipo)) {
    return { error: "Selecciona un tipo de equipo válido." };
  }
  if (!descripcion_larga) {
    return { error: "La descripción larga es obligatoria." };
  }

  const supabase = await crearClienteServidor();

  const { data: existente } = await supabase
    .from("equipos_laboratorio")
    .select("id_equipo")
    .eq("clave", clave)
    .neq("id_equipo", id_equipo)
    .maybeSingle();

  if (existente) {
    return { error: "Ya existe otro equipo con esa clave." };
  }

  const { error } = await supabase
    .from("equipos_laboratorio")
    .update({
      clave,
      tipo,
      descripcion_larga,
      descripcion_corta,
      marca,
      modelo,
      serie,
      proveedor,
      fecha_adquisicion,
      garantia,
      vigencia_garantia,
      ubicacion,
      responsable,
      mantenimiento,
      actualizado_por: usuario.usuario.id,
    })
    .eq("id_equipo", id_equipo);

  if (error) {
    console.error("[equipos][editar]", error);
    return { error: "No fue posible actualizar el equipo." };
  }

  revalidatePath("/equipos");
  redirect("/equipos");
}

export async function cambiar_status_equipo(formData: FormData) {
  const usuario = await requiere_sesion();

  const id_equipo = parseInt(limpiar(formData.get("id_equipo")), 10);
  const status = limpiar(formData.get("status"));
  const motivo = limpiar(formData.get("motivo"));

  if (!id_equipo || !esEstadoEquipoValido(status)) return;
  if (status !== "activo" && !motivo) {
    return { error: "El motivo es obligatorio para inactivar o dar de baja." };
  }

  const supabase = await crearClienteServidor();

  await supabase
    .from("equipos_laboratorio")
    .update({
      status,
      motivo_status: status === "activo" ? null : motivo,
      actualizado_por: usuario.usuario.id,
    })
    .eq("id_equipo", id_equipo);

  revalidatePath("/equipos");
}
