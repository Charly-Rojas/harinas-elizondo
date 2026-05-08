"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requiere_sesion } from "@/lib/autorizacion";
import type { FormState } from "@/lib/form-state";
import { crearClienteServidor } from "@/lib/supabase/servidor";

type ValoresFormularioProducto = {
  id_producto: string;
  clave: string;
  nombre: string;
  descripcion: string;
};

export type EstadoFormularioProducto = FormState<
  ValoresFormularioProducto,
  keyof ValoresFormularioProducto
>;

function limpiar(valor: FormDataEntryValue | null) {
  return String(valor ?? "").trim();
}

function extraerValores(formData: FormData): ValoresFormularioProducto {
  return {
    id_producto: limpiar(formData.get("id_producto")),
    clave: limpiar(formData.get("clave")).toUpperCase(),
    nombre: limpiar(formData.get("nombre")),
    descripcion: limpiar(formData.get("descripcion")),
  };
}

function errorFormulario(
  values: ValoresFormularioProducto,
  formError: string,
  fieldErrors?: EstadoFormularioProducto["fieldErrors"]
): EstadoFormularioProducto {
  return { formError, fieldErrors, values };
}

export async function crear_producto(
  _estado: EstadoFormularioProducto,
  formData: FormData
): Promise<EstadoFormularioProducto> {
  await requiere_sesion();

  const values = extraerValores(formData);
  const clave = values.clave;
  const nombre = values.nombre;
  const descripcion = values.descripcion || null;

  if (!clave) {
    return errorFormulario(values, "La clave es obligatoria.", {
      clave: "Captura la clave del producto.",
    });
  }
  if (!nombre) {
    return errorFormulario(values, "El nombre es obligatorio.", {
      nombre: "Captura el nombre del producto.",
    });
  }

  const supabase = await crearClienteServidor();

  const { data: existente } = await supabase
    .from("productos")
    .select("id_producto")
    .eq("clave", clave)
    .maybeSingle();

  if (existente) {
    return errorFormulario(values, "Ya existe un producto con esa clave.", {
      clave: "Esa clave ya esta registrada.",
    });
  }

  const { error } = await supabase.from("productos").insert({
    clave,
    nombre,
    descripcion,
    activo: true,
  });

  if (error) {
    console.error("[productos][crear]", error);
    return errorFormulario(values, "No fue posible registrar el producto.");
  }

  revalidatePath("/productos");
  revalidatePath("/lotes");
  redirect("/productos");
}

export async function editar_producto(
  _estado: EstadoFormularioProducto,
  formData: FormData
): Promise<EstadoFormularioProducto> {
  await requiere_sesion();

  const values = extraerValores(formData);
  const id_producto = parseInt(values.id_producto, 10);
  const clave = values.clave;
  const nombre = values.nombre;
  const descripcion = values.descripcion || null;

  if (!id_producto) return errorFormulario(values, "Producto inválido.");
  if (!clave) {
    return errorFormulario(values, "La clave es obligatoria.", {
      clave: "Captura la clave del producto.",
    });
  }
  if (!nombre) {
    return errorFormulario(values, "El nombre es obligatorio.", {
      nombre: "Captura el nombre del producto.",
    });
  }

  const supabase = await crearClienteServidor();

  const { data: existente } = await supabase
    .from("productos")
    .select("id_producto")
    .eq("clave", clave)
    .neq("id_producto", id_producto)
    .maybeSingle();

  if (existente) {
    return errorFormulario(values, "Ya existe otro producto con esa clave.", {
      clave: "Esa clave ya esta registrada.",
    });
  }

  const { error } = await supabase
    .from("productos")
    .update({
      clave,
      nombre,
      descripcion,
    })
    .eq("id_producto", id_producto);

  if (error) {
    console.error("[productos][editar]", error);
    return errorFormulario(values, "No fue posible actualizar el producto.");
  }

  revalidatePath("/productos");
  revalidatePath("/lotes");
  redirect("/productos");
}

export async function cambiar_estado_producto(formData: FormData) {
  await requiere_sesion();

  const id_producto = parseInt(limpiar(formData.get("id_producto")), 10);
  const activo = formData.get("activo") === "true";

  if (!id_producto) return;

  const supabase = await crearClienteServidor();

  await supabase.from("productos").update({ activo }).eq("id_producto", id_producto);

  revalidatePath("/productos");
  revalidatePath("/lotes");
}
