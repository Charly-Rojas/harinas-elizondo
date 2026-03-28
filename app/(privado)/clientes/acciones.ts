"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requiere_sesion } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export type EstadoFormularioCliente = {
  error?: string;
  exito?: string;
};

function limpiar(valor: FormDataEntryValue | null) {
  return String(valor ?? "").trim();
}

// ─── CREAR CLIENTE ───────────────────────────────────────

export async function crear_cliente(
  _estado: EstadoFormularioCliente,
  formData: FormData
): Promise<EstadoFormularioCliente> {
  const usuario = await requiere_sesion();

  const id_cliente = parseInt(limpiar(formData.get("id_cliente")), 10);
  const nombre = limpiar(formData.get("nombre"));
  const rfc = limpiar(formData.get("rfc")).toUpperCase();
  const domicilio_fiscal = limpiar(formData.get("domicilio_fiscal"));
  const correo_almacenista = limpiar(formData.get("correo_almacenista")) || null;
  const correo_gte_calidad = limpiar(formData.get("correo_gte_calidad")) || null;
  const solicita_certificado = formData.get("solicita_certificado") === "on";

  // Validaciones
  if (!id_cliente || id_cliente < 100000 || id_cliente > 999999) {
    return { error: "El ID SAP debe ser un número de 6 dígitos." };
  }
  if (!nombre) return { error: "El nombre es obligatorio." };
  if (!rfc) return { error: "El RFC es obligatorio." };

  const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
  if (!rfcRegex.test(rfc)) {
    return { error: "El formato del RFC no es válido." };
  }

  if (!domicilio_fiscal) return { error: "El domicilio fiscal es obligatorio." };

  const supabase = await crearClienteServidor();

  // Verificar duplicados
  const { data: existeId } = await supabase
    .from("clientes")
    .select("id_cliente")
    .eq("id_cliente", id_cliente)
    .maybeSingle();

  if (existeId) {
    return { error: "Ya existe un cliente con ese ID SAP." };
  }

  const { data: existeRfc } = await supabase
    .from("clientes")
    .select("id_cliente")
    .eq("rfc", rfc)
    .maybeSingle();

  if (existeRfc) {
    return { error: "Ya existe un cliente con ese RFC." };
  }

  const { error } = await supabase.from("clientes").insert({
    id_cliente,
    nombre,
    rfc,
    domicilio_fiscal,
    correo_almacenista,
    correo_gte_calidad,
    solicita_certificado,
    status: "activo",
    creado_por: usuario.usuario.id,
  });

  if (error) {
    console.error("[clientes][crear]", error);
    return { error: "No fue posible registrar al cliente." };
  }

  revalidatePath("/clientes");
  redirect("/clientes");
}

// ─── EDITAR CLIENTE ──────────────────────────────────────

export async function editar_cliente(
  _estado: EstadoFormularioCliente,
  formData: FormData
): Promise<EstadoFormularioCliente> {
  await requiere_sesion();

  const id_cliente = parseInt(limpiar(formData.get("id_cliente")), 10);
  const nombre = limpiar(formData.get("nombre"));
  const rfc = limpiar(formData.get("rfc")).toUpperCase();
  const domicilio_fiscal = limpiar(formData.get("domicilio_fiscal"));
  const correo_almacenista = limpiar(formData.get("correo_almacenista")) || null;
  const correo_gte_calidad = limpiar(formData.get("correo_gte_calidad")) || null;
  const solicita_certificado = formData.get("solicita_certificado") === "on";

  if (!nombre) return { error: "El nombre es obligatorio." };
  if (!rfc) return { error: "El RFC es obligatorio." };
  if (!domicilio_fiscal) return { error: "El domicilio fiscal es obligatorio." };

  const supabase = await crearClienteServidor();

  // Verificar que el RFC no pertenezca a otro cliente
  const { data: existeRfc } = await supabase
    .from("clientes")
    .select("id_cliente")
    .eq("rfc", rfc)
    .neq("id_cliente", id_cliente)
    .maybeSingle();

  if (existeRfc) {
    return { error: "Ese RFC ya pertenece a otro cliente." };
  }

  const { error } = await supabase
    .from("clientes")
    .update({
      nombre,
      rfc,
      domicilio_fiscal,
      correo_almacenista,
      correo_gte_calidad,
      solicita_certificado,
    })
    .eq("id_cliente", id_cliente);

  if (error) {
    console.error("[clientes][editar]", error);
    return { error: "No fue posible actualizar al cliente." };
  }

  revalidatePath("/clientes");
  redirect("/clientes");
}

// ─── CAMBIAR STATUS ──────────────────────────────────────

export async function cambiar_status_cliente(formData: FormData) {
  await requiere_sesion();

  const id_cliente = parseInt(limpiar(formData.get("id_cliente")), 10);
  const nuevo_status = limpiar(formData.get("nuevo_status"));

  if (!id_cliente || !nuevo_status) return;

  const supabase = await crearClienteServidor();

  await supabase
    .from("clientes")
    .update({ status: nuevo_status })
    .eq("id_cliente", id_cliente);

  revalidatePath("/clientes");
}
