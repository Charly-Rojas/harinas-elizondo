"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requiere_sesion } from "@/lib/autorizacion";
import type { FormState } from "@/lib/form-state";
import { crearClienteServidor } from "@/lib/supabase/servidor";

type ValoresFormularioLote = {
  id_lote: string;
  numero_lote: string;
  id_producto: string;
  variedad: string;
  fecha_produccion: string;
  fecha_caducidad: string;
  observaciones: string;
};

export type EstadoFormularioLote = FormState<
  ValoresFormularioLote,
  keyof ValoresFormularioLote
>;

function limpiar(valor: FormDataEntryValue | null) {
  return String(valor ?? "").trim();
}

function numeroOpcional(valor: string) {
  if (!valor) return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function extraerValores(formData: FormData): ValoresFormularioLote {
  return {
    id_lote: limpiar(formData.get("id_lote")),
    numero_lote: limpiar(formData.get("numero_lote")).toUpperCase(),
    id_producto: limpiar(formData.get("id_producto")),
    variedad: limpiar(formData.get("variedad")),
    fecha_produccion: limpiar(formData.get("fecha_produccion")),
    fecha_caducidad: limpiar(formData.get("fecha_caducidad")),
    observaciones: limpiar(formData.get("observaciones")),
  };
}

function errorFormulario(
  values: ValoresFormularioLote,
  formError: string,
  fieldErrors?: EstadoFormularioLote["fieldErrors"]
): EstadoFormularioLote {
  return { formError, fieldErrors, values };
}

export async function crear_lote(
  _estado: EstadoFormularioLote,
  formData: FormData
): Promise<EstadoFormularioLote> {
  const usuario = await requiere_sesion();

  const values = extraerValores(formData);
  const numero_lote = values.numero_lote;
  const id_producto = numeroOpcional(values.id_producto);
  const variedad = values.variedad || null;
  const fecha_produccion = values.fecha_produccion || null;
  const fecha_caducidad = values.fecha_caducidad || null;
  const observaciones = values.observaciones || null;

  if (!numero_lote) {
    return errorFormulario(values, "El número de lote es obligatorio.", {
      numero_lote: "Captura el numero de lote.",
    });
  }

  if (
    fecha_produccion &&
    fecha_caducidad &&
    fecha_caducidad < fecha_produccion
  ) {
    return errorFormulario(
      values,
      "La fecha de caducidad no puede ser anterior a la de producción.",
      {
        fecha_produccion: "Revisa la fecha de produccion.",
        fecha_caducidad: "Revisa la fecha de caducidad.",
      }
    );
  }

  const supabase = await crearClienteServidor();

  const { data: existente } = await supabase
    .from("lotes_produccion")
    .select("id_lote")
    .eq("numero_lote", numero_lote)
    .maybeSingle();

  if (existente) {
    return errorFormulario(values, "Ya existe un lote con ese número.", {
      numero_lote: "Ese numero de lote ya esta registrado.",
    });
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
    return errorFormulario(values, "No fue posible registrar el lote.");
  }

  revalidatePath("/lotes");
  redirect("/lotes");
}

export async function editar_lote(
  _estado: EstadoFormularioLote,
  formData: FormData
): Promise<EstadoFormularioLote> {
  const usuario = await requiere_sesion();

  const values = extraerValores(formData);
  const id_lote = parseInt(values.id_lote, 10);
  const numero_lote = values.numero_lote;
  const id_producto = numeroOpcional(values.id_producto);
  const variedad = values.variedad || null;
  const fecha_produccion = values.fecha_produccion || null;
  const fecha_caducidad = values.fecha_caducidad || null;
  const observaciones = values.observaciones || null;

  if (!id_lote) return errorFormulario(values, "Lote inválido.");
  if (!numero_lote) {
    return errorFormulario(values, "El número de lote es obligatorio.", {
      numero_lote: "Captura el numero de lote.",
    });
  }
  if (
    fecha_produccion &&
    fecha_caducidad &&
    fecha_caducidad < fecha_produccion
  ) {
    return errorFormulario(
      values,
      "La fecha de caducidad no puede ser anterior a la de producción.",
      {
        fecha_produccion: "Revisa la fecha de produccion.",
        fecha_caducidad: "Revisa la fecha de caducidad.",
      }
    );
  }

  const supabase = await crearClienteServidor();

  const { data: existente } = await supabase
    .from("lotes_produccion")
    .select("id_lote")
    .eq("numero_lote", numero_lote)
    .neq("id_lote", id_lote)
    .maybeSingle();

  if (existente) {
    return errorFormulario(values, "Ya existe otro lote con ese número.", {
      numero_lote: "Ese numero de lote ya esta registrado.",
    });
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
    return errorFormulario(values, "No fue posible actualizar el lote.");
  }

  revalidatePath("/lotes");
  redirect("/lotes");
}
