"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requiere_sesion } from "@/lib/autorizacion";
import type { FormState } from "@/lib/form-state";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { TipoEquipo } from "@/lib/tipos-dominio";

type ValoresFormularioParametro = {
  id_parametro: string;
  clave: string;
  nombre: string;
  unidad_medida: string;
  lim_min_global: string;
  lim_max_global: string;
  equipo_origen: string;
  descripcion: string;
};

export type EstadoFormularioParametro = FormState<
  ValoresFormularioParametro,
  keyof ValoresFormularioParametro
>;

function limpiar(valor: FormDataEntryValue | null) {
  return String(valor ?? "").trim();
}

function extraerValores(formData: FormData): ValoresFormularioParametro {
  return {
    id_parametro: limpiar(formData.get("id_parametro")),
    clave: limpiar(formData.get("clave")).toUpperCase(),
    nombre: limpiar(formData.get("nombre")),
    unidad_medida: limpiar(formData.get("unidad_medida")),
    lim_min_global: limpiar(formData.get("lim_min_global")),
    lim_max_global: limpiar(formData.get("lim_max_global")),
    equipo_origen: limpiar(formData.get("equipo_origen")),
    descripcion: limpiar(formData.get("descripcion")),
  };
}

function errorFormulario(
  values: ValoresFormularioParametro,
  formError: string,
  fieldErrors?: EstadoFormularioParametro["fieldErrors"]
): EstadoFormularioParametro {
  return { formError, fieldErrors, values };
}

function esTipoEquipoValido(valor: string): valor is TipoEquipo {
  return valor === "alveografo" || valor === "farinografo" || valor === "otro";
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

  const values = extraerValores(formData);
  const clave = values.clave;
  const nombre = values.nombre;
  const unidad_medida = values.unidad_medida || null;
  const lim_min_global = parsearNumeroOpcional(values.lim_min_global);
  const lim_max_global = parsearNumeroOpcional(values.lim_max_global);
  const equipo_origen = values.equipo_origen;
  const descripcion = values.descripcion || null;

  if (!clave) {
    return errorFormulario(values, "La clave es obligatoria.", {
      clave: "Captura la clave del parametro.",
    });
  }
  if (!nombre) {
    return errorFormulario(values, "El nombre es obligatorio.", {
      nombre: "Captura el nombre del parametro.",
    });
  }
  if (lim_min_global.error) {
    return errorFormulario(values, lim_min_global.error, {
      lim_min_global: "Captura un valor numerico valido.",
    });
  }
  if (lim_max_global.error) {
    return errorFormulario(values, lim_max_global.error, {
      lim_max_global: "Captura un valor numerico valido.",
    });
  }
  if (!esTipoEquipoValido(equipo_origen)) {
    return errorFormulario(values, "Selecciona un origen de equipo válido.", {
      equipo_origen: "Selecciona un equipo de origen valido.",
    });
  }
  if (
    lim_min_global.valor !== null &&
    lim_max_global.valor !== null &&
    lim_min_global.valor > lim_max_global.valor
  ) {
    return errorFormulario(
      values,
      "El limite minimo global no puede ser mayor que el maximo.",
      {
        lim_min_global: "Revisa el limite minimo.",
        lim_max_global: "Revisa el limite maximo.",
      }
    );
  }

  const supabase = await crearClienteServidor();

  const { data: existente } = await supabase
    .from("parametros_calidad")
    .select("id_parametro")
    .eq("clave", clave)
    .maybeSingle();

  if (existente) {
    return errorFormulario(values, "Ya existe un parámetro con esa clave.", {
      clave: "Esa clave ya esta registrada.",
    });
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
    return errorFormulario(values, "No fue posible registrar el parámetro.");
  }

  revalidatePath("/parametros");
  redirect("/parametros");
}

export async function editar_parametro(
  _estado: EstadoFormularioParametro,
  formData: FormData
): Promise<EstadoFormularioParametro> {
  await requiere_sesion();

  const values = extraerValores(formData);
  const id_parametro = parseInt(values.id_parametro, 10);
  const clave = values.clave;
  const nombre = values.nombre;
  const unidad_medida = values.unidad_medida || null;
  const lim_min_global = parsearNumeroOpcional(values.lim_min_global);
  const lim_max_global = parsearNumeroOpcional(values.lim_max_global);
  const equipo_origen = values.equipo_origen;
  const descripcion = values.descripcion || null;

  if (!id_parametro) return errorFormulario(values, "Parámetro inválido.");
  if (!clave) {
    return errorFormulario(values, "La clave es obligatoria.", {
      clave: "Captura la clave del parametro.",
    });
  }
  if (!nombre) {
    return errorFormulario(values, "El nombre es obligatorio.", {
      nombre: "Captura el nombre del parametro.",
    });
  }
  if (lim_min_global.error) {
    return errorFormulario(values, lim_min_global.error, {
      lim_min_global: "Captura un valor numerico valido.",
    });
  }
  if (lim_max_global.error) {
    return errorFormulario(values, lim_max_global.error, {
      lim_max_global: "Captura un valor numerico valido.",
    });
  }
  if (!esTipoEquipoValido(equipo_origen)) {
    return errorFormulario(values, "Selecciona un origen de equipo válido.", {
      equipo_origen: "Selecciona un equipo de origen valido.",
    });
  }
  if (
    lim_min_global.valor !== null &&
    lim_max_global.valor !== null &&
    lim_min_global.valor > lim_max_global.valor
  ) {
    return errorFormulario(
      values,
      "El limite minimo global no puede ser mayor que el maximo.",
      {
        lim_min_global: "Revisa el limite minimo.",
        lim_max_global: "Revisa el limite maximo.",
      }
    );
  }

  const supabase = await crearClienteServidor();

  const { data: existente } = await supabase
    .from("parametros_calidad")
    .select("id_parametro")
    .eq("clave", clave)
    .neq("id_parametro", id_parametro)
    .maybeSingle();

  if (existente) {
    return errorFormulario(values, "Ya existe otro parámetro con esa clave.", {
      clave: "Esa clave ya esta registrada.",
    });
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
    return errorFormulario(values, "No fue posible actualizar el parámetro.");
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
