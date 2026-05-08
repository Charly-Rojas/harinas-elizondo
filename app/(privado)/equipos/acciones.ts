"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requiere_sesion } from "@/lib/autorizacion";
import type { FormState } from "@/lib/form-state";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { TipoEquipo } from "@/lib/tipos-dominio";

type ValoresFormularioEquipo = {
  id_equipo: string;
  clave: string;
  tipo: string;
  descripcion_larga: string;
  descripcion_corta: string;
  marca: string;
  modelo: string;
  serie: string;
  proveedor: string;
  fecha_adquisicion: string;
  garantia_meses: string;
  vigencia_garantia: string;
  ubicacion: string;
  responsable: string;
  mantenimiento: string;
};

export type EstadoFormularioEquipo = FormState<
  ValoresFormularioEquipo,
  keyof ValoresFormularioEquipo
>;

function limpiar(valor: FormDataEntryValue | null) {
  return String(valor ?? "").trim();
}

function numeroOpcional(valor: string) {
  if (!valor) return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function extraerValores(formData: FormData): ValoresFormularioEquipo {
  return {
    id_equipo: limpiar(formData.get("id_equipo")),
    clave: limpiar(formData.get("clave")).toUpperCase(),
    tipo: limpiar(formData.get("tipo")),
    descripcion_larga: limpiar(formData.get("descripcion_larga")),
    descripcion_corta: limpiar(formData.get("descripcion_corta")),
    marca: limpiar(formData.get("marca")),
    modelo: limpiar(formData.get("modelo")),
    serie: limpiar(formData.get("serie")),
    proveedor: limpiar(formData.get("proveedor")),
    fecha_adquisicion: limpiar(formData.get("fecha_adquisicion")),
    garantia_meses: limpiar(formData.get("garantia_meses")),
    vigencia_garantia: limpiar(formData.get("vigencia_garantia")),
    ubicacion: limpiar(formData.get("ubicacion")),
    responsable: limpiar(formData.get("responsable")),
    mantenimiento: limpiar(formData.get("mantenimiento")),
  };
}

function errorFormulario(
  values: ValoresFormularioEquipo,
  formError: string,
  fieldErrors?: EstadoFormularioEquipo["fieldErrors"]
): EstadoFormularioEquipo {
  return { formError, fieldErrors, values };
}

function esTipoEquipoValido(valor: string): valor is TipoEquipo {
  return valor === "alveografo" || valor === "farinografo" || valor === "otro";
}

function esEstadoEquipoValido(valor: string): valor is "activo" | "inactivo" | "baja" {
  return valor === "activo" || valor === "inactivo" || valor === "baja";
}

function sumarMeses(fechaBase: string, meses: number) {
  const [anio, mes, dia] = fechaBase.split("-").map((parte) => Number(parte));
  if (!anio || !mes || !dia) return null;

  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  fecha.setUTCMonth(fecha.getUTCMonth() + meses);
  return fecha.toISOString().slice(0, 10);
}

export async function crear_equipo(
  _estado: EstadoFormularioEquipo,
  formData: FormData
): Promise<EstadoFormularioEquipo> {
  const usuario = await requiere_sesion();

  const values = extraerValores(formData);
  const clave = values.clave;
  const tipo = values.tipo;
  const descripcion_larga = values.descripcion_larga;
  const descripcion_corta = values.descripcion_corta || null;
  const marca = values.marca || null;
  const modelo = values.modelo || null;
  const serie = values.serie || null;
  const proveedor = values.proveedor || null;
  const fecha_adquisicion = values.fecha_adquisicion || null;
  const garantia_meses = numeroOpcional(values.garantia_meses);
  const vigencia_garantia =
    fecha_adquisicion && garantia_meses !== null
      ? sumarMeses(fecha_adquisicion, garantia_meses)
      : null;
  const ubicacion = values.ubicacion || null;
  const responsable = values.responsable || null;
  const mantenimiento = values.mantenimiento || null;

  if (!clave) {
    return errorFormulario(values, "La clave del equipo es obligatoria.", {
      clave: "Captura la clave del equipo.",
    });
  }
  if (!esTipoEquipoValido(tipo)) {
    return errorFormulario(values, "Selecciona un tipo de equipo válido.", {
      tipo: "Selecciona un tipo de equipo valido.",
    });
  }
  if (!descripcion_larga) {
    return errorFormulario(values, "La descripción larga es obligatoria.", {
      descripcion_larga: "Captura la descripcion larga del equipo.",
    });
  }
  if (garantia_meses !== null && garantia_meses < 0) {
    return errorFormulario(values, "La garantía en meses no puede ser negativa.", {
      garantia_meses: "Captura un numero valido de meses.",
    });
  }
  if (garantia_meses !== null && !fecha_adquisicion) {
    return errorFormulario(
      values,
      "Para calcular la vigencia de la garantía debes capturar la fecha de adquisición.",
      {
        fecha_adquisicion: "Captura la fecha de adquisicion.",
        garantia_meses: "La garantia en meses requiere fecha de adquisicion.",
      }
    );
  }

  const supabase = await crearClienteServidor();

  const { data: existente } = await supabase
    .from("equipos_laboratorio")
    .select("id_equipo")
    .eq("clave", clave)
    .maybeSingle();

  if (existente) {
    return errorFormulario(values, "Ya existe un equipo con esa clave.", {
      clave: "Esa clave ya esta registrada.",
    });
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
      garantia: garantia_meses !== null ? `${garantia_meses} meses` : null,
      garantia_meses,
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
    return errorFormulario(values, "No fue posible registrar el equipo.");
  }

  revalidatePath("/equipos");
  redirect("/equipos");
}

export async function editar_equipo(
  _estado: EstadoFormularioEquipo,
  formData: FormData
): Promise<EstadoFormularioEquipo> {
  const usuario = await requiere_sesion();

  const values = extraerValores(formData);
  const id_equipo = parseInt(values.id_equipo, 10);
  const clave = values.clave;
  const tipo = values.tipo;
  const descripcion_larga = values.descripcion_larga;
  const descripcion_corta = values.descripcion_corta || null;
  const marca = values.marca || null;
  const modelo = values.modelo || null;
  const serie = values.serie || null;
  const proveedor = values.proveedor || null;
  const fecha_adquisicion = values.fecha_adquisicion || null;
  const garantia_meses = numeroOpcional(values.garantia_meses);
  const vigencia_garantia =
    fecha_adquisicion && garantia_meses !== null
      ? sumarMeses(fecha_adquisicion, garantia_meses)
      : null;
  const ubicacion = values.ubicacion || null;
  const responsable = values.responsable || null;
  const mantenimiento = values.mantenimiento || null;

  if (!id_equipo) return errorFormulario(values, "Equipo inválido.");
  if (!clave) {
    return errorFormulario(values, "La clave del equipo es obligatoria.", {
      clave: "Captura la clave del equipo.",
    });
  }
  if (!esTipoEquipoValido(tipo)) {
    return errorFormulario(values, "Selecciona un tipo de equipo válido.", {
      tipo: "Selecciona un tipo de equipo valido.",
    });
  }
  if (!descripcion_larga) {
    return errorFormulario(values, "La descripción larga es obligatoria.", {
      descripcion_larga: "Captura la descripcion larga del equipo.",
    });
  }
  if (garantia_meses !== null && garantia_meses < 0) {
    return errorFormulario(values, "La garantía en meses no puede ser negativa.", {
      garantia_meses: "Captura un numero valido de meses.",
    });
  }
  if (garantia_meses !== null && !fecha_adquisicion) {
    return errorFormulario(
      values,
      "Para calcular la vigencia de la garantía debes capturar la fecha de adquisición.",
      {
        fecha_adquisicion: "Captura la fecha de adquisicion.",
        garantia_meses: "La garantia en meses requiere fecha de adquisicion.",
      }
    );
  }

  const supabase = await crearClienteServidor();

  const { data: existente } = await supabase
    .from("equipos_laboratorio")
    .select("id_equipo")
    .eq("clave", clave)
    .neq("id_equipo", id_equipo)
    .maybeSingle();

  if (existente) {
    return errorFormulario(values, "Ya existe otro equipo con esa clave.", {
      clave: "Esa clave ya esta registrada.",
    });
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
      garantia: garantia_meses !== null ? `${garantia_meses} meses` : null,
      garantia_meses,
      vigencia_garantia,
      ubicacion,
      responsable,
      mantenimiento,
      actualizado_por: usuario.usuario.id,
    })
    .eq("id_equipo", id_equipo);

  if (error) {
    console.error("[equipos][editar]", error);
    return errorFormulario(values, "No fue posible actualizar el equipo.");
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
