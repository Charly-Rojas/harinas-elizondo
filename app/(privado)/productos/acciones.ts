"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requiere_sesion } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export type EstadoFormularioProducto = {
  error?: string;
};

function limpiar(valor: FormDataEntryValue | null) {
  return String(valor ?? "").trim();
}

export async function crear_producto(
  _estado: EstadoFormularioProducto,
  formData: FormData
): Promise<EstadoFormularioProducto> {
  await requiere_sesion();

  const clave = limpiar(formData.get("clave")).toUpperCase();
  const nombre = limpiar(formData.get("nombre"));
  const descripcion = limpiar(formData.get("descripcion")) || null;

  if (!clave) return { error: "La clave es obligatoria." };
  if (!nombre) return { error: "El nombre es obligatorio." };

  const supabase = await crearClienteServidor();

  const { data: existente } = await supabase
    .from("productos")
    .select("id_producto")
    .eq("clave", clave)
    .maybeSingle();

  if (existente) {
    return { error: "Ya existe un producto con esa clave." };
  }

  const { error } = await supabase.from("productos").insert({
    clave,
    nombre,
    descripcion,
    activo: true,
  });

  if (error) {
    console.error("[productos][crear]", error);
    return { error: "No fue posible registrar el producto." };
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

  const id_producto = parseInt(limpiar(formData.get("id_producto")), 10);
  const clave = limpiar(formData.get("clave")).toUpperCase();
  const nombre = limpiar(formData.get("nombre"));
  const descripcion = limpiar(formData.get("descripcion")) || null;

  if (!id_producto) return { error: "Producto inválido." };
  if (!clave) return { error: "La clave es obligatoria." };
  if (!nombre) return { error: "El nombre es obligatorio." };

  const supabase = await crearClienteServidor();

  const { data: existente } = await supabase
    .from("productos")
    .select("id_producto")
    .eq("clave", clave)
    .neq("id_producto", id_producto)
    .maybeSingle();

  if (existente) {
    return { error: "Ya existe otro producto con esa clave." };
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
    return { error: "No fue posible actualizar el producto." };
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
