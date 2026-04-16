"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requiere_sesion } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { TipoEquipo } from "@/lib/tipos-dominio";

export type EstadoFormularioEquipo = {
  error?: string;
};

type AsociacionEquipoFormulario = {
  id_parametro: number;
  desviacion_permitida: number | null;
  lim_min_internacional: number | null;
  lim_max_internacional: number | null;
  especificacion_interna: string | null;
};

function limpiar(valor: FormDataEntryValue | null) {
  return String(valor ?? "").trim();
}

function numeroOpcional(valor: string) {
  if (!valor) return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function esTipoEquipoValido(valor: string): valor is TipoEquipo {
  return valor === "alveografo" || valor === "farinografo" || valor === "otro";
}

function esEstadoEquipoValido(valor: string): valor is "activo" | "inactivo" | "baja" {
  return valor === "activo" || valor === "inactivo" || valor === "baja";
}

function parsearAsociacionesEquipo(formData: FormData) {
  const bruto = limpiar(formData.get("asociaciones_json"));

  if (!bruto) {
    return {
      error: null,
      asociaciones: [] as AsociacionEquipoFormulario[],
    };
  }

  try {
    const datos = JSON.parse(bruto);

    if (!Array.isArray(datos)) {
      return {
        error: "El formato de asociaciones del equipo es inválido.",
        asociaciones: [] as AsociacionEquipoFormulario[],
      };
    }

    const asociaciones = datos
      .map((fila) => {
        const id_parametro = Number(limpiar(fila?.id_parametro));
        const desviacion_permitida = numeroOpcional(
          limpiar(fila?.desviacion_permitida)
        );
        const lim_min_internacional = numeroOpcional(
          limpiar(fila?.lim_min_internacional)
        );
        const lim_max_internacional = numeroOpcional(
          limpiar(fila?.lim_max_internacional)
        );
        const especificacion_interna =
          limpiar(fila?.especificacion_interna) || null;

        return {
          id_parametro,
          desviacion_permitida,
          lim_min_internacional,
          lim_max_internacional,
          especificacion_interna,
        };
      })
      .filter((fila) => Number.isFinite(fila.id_parametro) && fila.id_parametro > 0);

    const usados = new Set<number>();

    for (const asociacion of asociaciones) {
      if (usados.has(asociacion.id_parametro)) {
        return {
          error: "No puedes repetir el mismo parámetro en un equipo.",
          asociaciones: [] as AsociacionEquipoFormulario[],
        };
      }
      usados.add(asociacion.id_parametro);

      if (
        asociacion.lim_min_internacional !== null &&
        asociacion.lim_max_internacional !== null &&
        asociacion.lim_min_internacional > asociacion.lim_max_internacional
      ) {
        return {
          error:
            "En las asociaciones del equipo el límite mínimo no puede ser mayor que el máximo.",
          asociaciones: [] as AsociacionEquipoFormulario[],
        };
      }
    }

    return {
      error: null,
      asociaciones,
    };
  } catch {
    return {
      error: "No fue posible leer las asociaciones del equipo.",
      asociaciones: [] as AsociacionEquipoFormulario[],
    };
  }
}

async function sincronizarAsociacionesEquipo(
  supabase: Awaited<ReturnType<typeof crearClienteServidor>>,
  idEquipo: number,
  asociaciones: AsociacionEquipoFormulario[]
) {
  await supabase
    .from("equipos_parametros")
    .delete()
    .eq("id_equipo", idEquipo);

  if (!asociaciones.length) {
    return;
  }

  const { error } = await supabase.from("equipos_parametros").insert(
    asociaciones.map((asociacion) => ({
      id_equipo: idEquipo,
      id_parametro: asociacion.id_parametro,
      desviacion_permitida: asociacion.desviacion_permitida,
      lim_min_internacional: asociacion.lim_min_internacional,
      lim_max_internacional: asociacion.lim_max_internacional,
      especificacion_interna: asociacion.especificacion_interna,
      activo: true,
    }))
  );

  if (error) {
    throw error;
  }
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

  const {
    error: errorAsociaciones,
    asociaciones,
  } = parsearAsociacionesEquipo(formData);

  if (errorAsociaciones) {
    return { error: errorAsociaciones };
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

  const { data, error } = await supabase
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
    })
    .select("id_equipo")
    .single();

  if (error || !data) {
    console.error("[equipos][crear]", error);
    return { error: "No fue posible registrar el equipo." };
  }

  try {
    await sincronizarAsociacionesEquipo(supabase, data.id_equipo, asociaciones);
  } catch (errorRelacion) {
    console.error("[equipos][crear_asociaciones]", errorRelacion);
    return {
      error:
        "El equipo se registró, pero falló la asociación de parámetros.",
    };
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

  const {
    error: errorAsociaciones,
    asociaciones,
  } = parsearAsociacionesEquipo(formData);

  if (errorAsociaciones) {
    return { error: errorAsociaciones };
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

  try {
    await sincronizarAsociacionesEquipo(supabase, id_equipo, asociaciones);
  } catch (errorRelacion) {
    console.error("[equipos][editar_asociaciones]", errorRelacion);
    return {
      error:
        "Los datos principales se actualizaron, pero falló la asociación de parámetros.",
    };
  }

  revalidatePath("/equipos");
  redirect("/equipos");
}

export async function cambiar_status_equipo(formData: FormData) {
  const usuario = await requiere_sesion();

  const id_equipo = parseInt(limpiar(formData.get("id_equipo")), 10);
  const status = limpiar(formData.get("status"));

  if (!id_equipo || !esEstadoEquipoValido(status)) return;

  const supabase = await crearClienteServidor();

  await supabase
    .from("equipos_laboratorio")
    .update({
      status,
      motivo_status:
        status === "activo"
          ? null
          : `Cambio manual desde panel el ${new Date().toISOString()}`,
      actualizado_por: usuario.usuario.id,
    })
    .eq("id_equipo", id_equipo);

  revalidatePath("/equipos");
}
