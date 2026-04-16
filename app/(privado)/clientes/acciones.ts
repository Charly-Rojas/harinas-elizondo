"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requiere_sesion } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export type EstadoFormularioCliente = {
  error?: string;
  exito?: string;
};

type ParametroClienteFormulario = {
  clave_parametro: string;
  nombre: string;
  unidad_medida: string | null;
  lim_min: number | null;
  lim_max: number | null;
  origen_limites: "cliente" | "internacional";
  documento_referencia: string | null;
};

function limpiar(valor: FormDataEntryValue | null) {
  return String(valor ?? "").trim();
}

function numeroOpcional(valor: string) {
  if (!valor) return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function es_status_cliente_valido(
  valor: string
): valor is "activo" | "inactivo" | "baja" {
  return valor === "activo" || valor === "inactivo" || valor === "baja";
}

function parsearParametrosCliente(
  formData: FormData,
  documentoEspecificaciones: string | null
) {
  const bruto = limpiar(formData.get("parametros_json"));

  if (!bruto) {
    return {
      error: null,
      parametros: [] as ParametroClienteFormulario[],
    };
  }

  try {
    const datos = JSON.parse(bruto);

    if (!Array.isArray(datos)) {
      return {
        error: "El formato de especificaciones del cliente es inválido.",
        parametros: [] as ParametroClienteFormulario[],
      };
    }

    const parametros = datos
      .map((fila) => {
        const clave_parametro = limpiar(fila?.clave_parametro).toUpperCase();
        const nombre = limpiar(fila?.nombre);
        const unidad_medida = limpiar(fila?.unidad_medida) || null;
        const lim_min = numeroOpcional(limpiar(fila?.lim_min));
        const lim_max = numeroOpcional(limpiar(fila?.lim_max));

        return {
          clave_parametro,
          nombre,
          unidad_medida,
          lim_min,
          lim_max,
          origen_limites: "cliente" as const,
          documento_referencia: documentoEspecificaciones,
        };
      })
      .filter((fila) => {
        return (
          fila.clave_parametro ||
          fila.nombre ||
          fila.unidad_medida ||
          fila.lim_min !== null ||
          fila.lim_max !== null
        );
      });

    for (const parametro of parametros) {
      if (!parametro.clave_parametro || !parametro.nombre) {
        return {
          error:
            "Cada especificación del cliente debe incluir clave y nombre del parámetro.",
          parametros: [] as ParametroClienteFormulario[],
        };
      }

      if (
        parametro.lim_min !== null &&
        parametro.lim_max !== null &&
        parametro.lim_min > parametro.lim_max
      ) {
        return {
          error:
            "En las especificaciones del cliente el límite mínimo no puede ser mayor que el máximo.",
          parametros: [] as ParametroClienteFormulario[],
        };
      }
    }

    return {
      error: null,
      parametros,
    };
  } catch {
    return {
      error: "No fue posible leer las especificaciones del cliente.",
      parametros: [] as ParametroClienteFormulario[],
    };
  }
}

async function sincronizarDireccionEntrega(
  supabase: Awaited<ReturnType<typeof crearClienteServidor>>,
  idCliente: number,
  domicilioEntrega: string | null
) {
  await supabase
    .from("direcciones")
    .delete()
    .eq("id_cliente", idCliente)
    .eq("etiqueta", "entrega_principal");

  if (!domicilioEntrega) {
    return;
  }

  await supabase.from("direcciones").insert({
    id_cliente: idCliente,
    etiqueta: "entrega_principal",
    direccion: domicilioEntrega,
    activo: true,
  });
}

async function sincronizarParametrosCliente(
  supabase: Awaited<ReturnType<typeof crearClienteServidor>>,
  idCliente: number,
  parametros: ParametroClienteFormulario[]
) {
  await supabase
    .from("param_ref_cliente")
    .delete()
    .eq("id_cliente", idCliente);

  if (!parametros.length) {
    return;
  }

  const { error } = await supabase.from("param_ref_cliente").insert(
    parametros.map((parametro) => ({
      id_cliente: idCliente,
      clave_parametro: parametro.clave_parametro,
      nombre: parametro.nombre,
      unidad_medida: parametro.unidad_medida,
      lim_min: parametro.lim_min,
      lim_max: parametro.lim_max,
      origen_limites: parametro.origen_limites,
      documento_referencia: parametro.documento_referencia,
      activo: true,
    }))
  );

  if (error) {
    throw error;
  }
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
  const domicilio_entrega = limpiar(formData.get("domicilio_entrega")) || null;
  const contacto_certificado = limpiar(formData.get("contacto_certificado")) || null;
  const correo_contacto_cliente =
    limpiar(formData.get("correo_contacto_cliente")) || null;
  const correo_almacenista = limpiar(formData.get("correo_almacenista")) || null;
  const correo_gte_calidad = limpiar(formData.get("correo_gte_calidad")) || null;
  const documento_especificaciones =
    limpiar(formData.get("documento_especificaciones")) || null;
  const solicita_certificado = formData.get("solicita_certificado") === "on";
  const usa_especificaciones_cliente =
    formData.get("usa_especificaciones_cliente") === "on";

  if (!id_cliente || id_cliente < 100000 || id_cliente > 999999) {
    return { error: "El ID SAP debe ser un número de 6 dígitos." };
  }
  if (!nombre) return { error: "El nombre es obligatorio." };
  if (!rfc) return { error: "El RFC es obligatorio." };

  const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
  if (!rfcRegex.test(rfc)) {
    return { error: "El formato del RFC no es válido." };
  }

  if (!domicilio_fiscal) {
    return { error: "El domicilio fiscal es obligatorio." };
  }

  const {
    error: errorParametros,
    parametros,
  } = parsearParametrosCliente(formData, documento_especificaciones);

  if (errorParametros) {
    return { error: errorParametros };
  }

  if (usa_especificaciones_cliente && parametros.length === 0) {
    return {
      error:
        "Marca al menos una especificación del cliente o desactiva esa opción.",
    };
  }

  const supabase = await crearClienteServidor();

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
    domicilio_entrega,
    contacto_certificado,
    correo_contacto_cliente,
    correo_almacenista,
    correo_gte_calidad,
    documento_especificaciones,
    solicita_certificado,
    usa_especificaciones_cliente,
    status: "activo",
    creado_por: usuario.usuario.id,
    actualizado_por: usuario.usuario.id,
  });

  if (error) {
    console.error("[clientes][crear]", error);
    return { error: "No fue posible registrar al cliente." };
  }

  try {
    await sincronizarDireccionEntrega(supabase, id_cliente, domicilio_entrega);
    await sincronizarParametrosCliente(
      supabase,
      id_cliente,
      usa_especificaciones_cliente ? parametros : []
    );
  } catch (errorRelacion) {
    console.error("[clientes][crear_relaciones]", errorRelacion);
    return {
      error:
        "El cliente se registró, pero falló el guardado de dirección o especificaciones.",
    };
  }

  revalidatePath("/clientes");
  redirect("/clientes");
}

// ─── EDITAR CLIENTE ──────────────────────────────────────

export async function editar_cliente(
  _estado: EstadoFormularioCliente,
  formData: FormData
): Promise<EstadoFormularioCliente> {
  const usuario = await requiere_sesion();

  const id_cliente = parseInt(limpiar(formData.get("id_cliente")), 10);
  const nombre = limpiar(formData.get("nombre"));
  const rfc = limpiar(formData.get("rfc")).toUpperCase();
  const domicilio_fiscal = limpiar(formData.get("domicilio_fiscal"));
  const domicilio_entrega = limpiar(formData.get("domicilio_entrega")) || null;
  const contacto_certificado = limpiar(formData.get("contacto_certificado")) || null;
  const correo_contacto_cliente =
    limpiar(formData.get("correo_contacto_cliente")) || null;
  const correo_almacenista = limpiar(formData.get("correo_almacenista")) || null;
  const correo_gte_calidad = limpiar(formData.get("correo_gte_calidad")) || null;
  const documento_especificaciones =
    limpiar(formData.get("documento_especificaciones")) || null;
  const solicita_certificado = formData.get("solicita_certificado") === "on";
  const usa_especificaciones_cliente =
    formData.get("usa_especificaciones_cliente") === "on";
  const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;

  if (!nombre) return { error: "El nombre es obligatorio." };
  if (!rfc) return { error: "El RFC es obligatorio." };
  if (!rfcRegex.test(rfc)) {
    return { error: "El formato del RFC no es válido." };
  }
  if (!domicilio_fiscal) {
    return { error: "El domicilio fiscal es obligatorio." };
  }

  const {
    error: errorParametros,
    parametros,
  } = parsearParametrosCliente(formData, documento_especificaciones);

  if (errorParametros) {
    return { error: errorParametros };
  }

  if (usa_especificaciones_cliente && parametros.length === 0) {
    return {
      error:
        "Marca al menos una especificación del cliente o desactiva esa opción.",
    };
  }

  const supabase = await crearClienteServidor();

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
      domicilio_entrega,
      contacto_certificado,
      correo_contacto_cliente,
      correo_almacenista,
      correo_gte_calidad,
      documento_especificaciones,
      solicita_certificado,
      usa_especificaciones_cliente,
      actualizado_por: usuario.usuario.id,
    })
    .eq("id_cliente", id_cliente);

  if (error) {
    console.error("[clientes][editar]", error);
    return { error: "No fue posible actualizar al cliente." };
  }

  try {
    await sincronizarDireccionEntrega(supabase, id_cliente, domicilio_entrega);
    await sincronizarParametrosCliente(
      supabase,
      id_cliente,
      usa_especificaciones_cliente ? parametros : []
    );
  } catch (errorRelacion) {
    console.error("[clientes][editar_relaciones]", errorRelacion);
    return {
      error:
        "Los datos principales se actualizaron, pero falló la dirección o las especificaciones.",
    };
  }

  revalidatePath("/clientes");
  redirect("/clientes");
}

// ─── CAMBIAR STATUS ──────────────────────────────────────

export async function cambiar_status_cliente(formData: FormData) {
  const usuario = await requiere_sesion();

  const id_cliente = parseInt(limpiar(formData.get("id_cliente")), 10);
  const nuevo_status = limpiar(formData.get("nuevo_status"));

  if (!id_cliente || !es_status_cliente_valido(nuevo_status)) return;

  const supabase = await crearClienteServidor();

  await supabase
    .from("clientes")
    .update({
      status: nuevo_status,
      motivo_status:
        nuevo_status === "activo"
          ? null
          : `Cambio manual desde panel el ${new Date().toISOString()}`,
      actualizado_por: usuario.usuario.id,
    })
    .eq("id_cliente", id_cliente);

  revalidatePath("/clientes");
}
