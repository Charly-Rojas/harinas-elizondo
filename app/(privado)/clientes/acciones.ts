"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  direccionCompleta,
  formatearDireccion,
  normalizarDireccionEntregaEntrada,
  normalizarDireccionEntrada,
  parsearDireccionLegacy,
  type DireccionEntregaCaptura,
  type DireccionEstructurada,
} from "@/lib/direcciones";
import type { FormState } from "@/lib/form-state";
import { requiere_permiso_escritura } from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { ClienteFormValues } from "@/lib/tipos-clientes";

export type EstadoFormularioCliente = FormState<ClienteFormValues, string>;

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

type DomicilioEntregaFormulario = {
  etiqueta: string;
  direccion: string;
  calle: string;
  numero_exterior: string;
  numero_interior: string;
  colonia: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  pais: string;
};

function construirEstadoError(
  values: ClienteFormValues,
  formError: string,
  fieldErrors?: EstadoFormularioCliente["fieldErrors"]
): EstadoFormularioCliente {
  return {
    formError,
    fieldErrors,
    values,
  };
}

function parsearJson<T>(valor: string, fallback: T): T {
  if (!valor) return fallback;

  try {
    return JSON.parse(valor) as T;
  } catch {
    return fallback;
  }
}

function construirValoresCliente(formData: FormData): ClienteFormValues {
  const parametrosJson = parsearJson<
    ClienteFormValues["parametros_json"]
  >(limpiar(formData.get("parametros_json")), []);
  const domicilioFiscalJson = parsearJson<Partial<DireccionEstructurada>>(
    limpiar(formData.get("domicilio_fiscal_json")),
    {}
  );
  const domiciliosJson = parsearJson<Partial<DireccionEntregaCaptura>[]>(
    limpiar(formData.get("domicilios_json")),
    []
  );

  const domicilioFiscal =
    Object.keys(domicilioFiscalJson).length > 0
      ? normalizarDireccionEntrada(domicilioFiscalJson)
      : parsearDireccionLegacy(limpiar(formData.get("domicilio_fiscal")));

  if (!domicilioFiscal.calle) {
    domicilioFiscal.calle = limpiar(formData.get("dom_calle"));
    domicilioFiscal.numero_exterior = limpiar(formData.get("dom_numero_exterior"));
    domicilioFiscal.numero_interior = limpiar(formData.get("dom_numero_interior"));
    domicilioFiscal.colonia = limpiar(formData.get("dom_colonia"));
    domicilioFiscal.ciudad = limpiar(formData.get("dom_ciudad"));
    domicilioFiscal.estado = limpiar(formData.get("dom_estado"));
    domicilioFiscal.codigo_postal = limpiar(formData.get("dom_codigo_postal"));
    domicilioFiscal.pais = limpiar(formData.get("dom_pais")) || "Mexico";
  }

  return {
    id_cliente: limpiar(formData.get("id_cliente")),
    nombre: limpiar(formData.get("nombre")),
    rfc: limpiar(formData.get("rfc")).toUpperCase(),
    contacto_certificado: limpiar(formData.get("contacto_certificado")),
    correo_contacto_cliente: limpiar(formData.get("correo_contacto_cliente")),
    correo_almacenista: limpiar(formData.get("correo_almacenista")),
    correo_gte_calidad: limpiar(formData.get("correo_gte_calidad")),
    solicita_certificado: formData.get("solicita_certificado") === "on",
    usa_especificaciones_cliente:
      formData.get("usa_especificaciones_cliente") === "on",
    domicilio_fiscal: domicilioFiscal,
    domicilios: domiciliosJson.map((fila) =>
      normalizarDireccionEntregaEntrada(fila)
    ),
    parametros_json: parametrosJson,
  };
}

function parsearDomiciliosEntrega(values: ClienteFormValues) {
  if (!values.domicilios.length) {
    return {
      error: null,
      domicilios: [] as DomicilioEntregaFormulario[],
    };
  }

  const domicilios = values.domicilios
    .map((fila) => {
      const direccion = normalizarDireccionEntregaEntrada(fila);
      return {
        ...direccion,
        direccion: formatearDireccion(direccion),
      };
    })
    .filter((fila) => fila.etiqueta || fila.direccion);

  for (const domicilio of domicilios) {
    if (!domicilio.etiqueta || !direccionCompleta(domicilio)) {
      return {
        error:
          "Cada domicilio de entrega debe incluir etiqueta, direccion completa y codigo postal.",
        domicilios: [] as DomicilioEntregaFormulario[],
      };
    }
  }

  return { error: null, domicilios };
}

function construirDomicilioFiscal(values: ClienteFormValues) {
  const direccion = normalizarDireccionEntrada(values.domicilio_fiscal);

  if (!direccionCompleta(direccion)) {
    return {
      error: "Completa los campos del domicilio fiscal.",
      valor: "",
      direccion,
    };
  }

  return {
    error: null,
    valor: formatearDireccion(direccion),
    direccion,
  };
}

function parsearParametrosCliente(
  values: ClienteFormValues,
  documentoEspecificaciones: string | null
) {
  if (!values.parametros_json.length) {
    return {
      error: null,
      parametros: [] as ParametroClienteFormulario[],
    };
  }

  const parametros = values.parametros_json
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
}

async function sincronizarDireccionesEntrega(
  supabase: Awaited<ReturnType<typeof crearClienteServidor>>,
  idCliente: number,
  domicilios: DomicilioEntregaFormulario[]
) {
  await supabase.from("direcciones").delete().eq("id_cliente", idCliente);

  if (!domicilios.length) {
    return;
  }

  const { error } = await supabase.from("direcciones").insert(
    domicilios.map((domicilio) => ({
      id_cliente: idCliente,
      etiqueta: domicilio.etiqueta,
      direccion: domicilio.direccion,
      calle: domicilio.calle,
      numero_exterior: domicilio.numero_exterior,
      numero_interior: domicilio.numero_interior,
      colonia: domicilio.colonia,
      ciudad: domicilio.ciudad,
      estado: domicilio.estado,
      codigo_postal: domicilio.codigo_postal,
      pais: domicilio.pais,
      activo: true,
    }))
  );

  if (error) {
    throw error;
  }
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
  const usuario = await requiere_permiso_escritura();
  const values = construirValoresCliente(formData);
  const id_cliente = parseInt(values.id_cliente, 10);
  const nombre = values.nombre;
  const rfc = values.rfc;
  const contacto_certificado = values.contacto_certificado || null;
  const correo_contacto_cliente = values.correo_contacto_cliente || null;
  const correo_almacenista = values.correo_almacenista || null;
  const correo_gte_calidad = values.correo_gte_calidad || null;
  const solicita_certificado = values.solicita_certificado;
  const usa_especificaciones_cliente = values.usa_especificaciones_cliente;

  if (!id_cliente || id_cliente < 100000 || id_cliente > 999999) {
    return construirEstadoError(values, "El ID SAP debe ser un número de 6 dígitos.", {
      id_cliente: "Captura un ID SAP valido de 6 digitos.",
    });
  }
  if (!nombre) {
    return construirEstadoError(values, "El nombre es obligatorio.", {
      nombre: "Captura el nombre o razon social.",
    });
  }
  if (!rfc) {
    return construirEstadoError(values, "El RFC es obligatorio.", {
      rfc: "Captura el RFC del cliente.",
    });
  }

  const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
  if (!rfcRegex.test(rfc)) {
    return construirEstadoError(values, "El formato del RFC no es válido.", {
      rfc: "El RFC no cumple el formato esperado.",
    });
  }

  const {
    error: errorDomicilio,
    valor: domicilio_fiscal,
    direccion: domicilioFiscalEstructurado,
  } = construirDomicilioFiscal(values);

  if (errorDomicilio) {
    return construirEstadoError(values, errorDomicilio, {
      domicilio_fiscal: "Completa el domicilio fiscal.",
    });
  }

  const {
    error: errorDomiciliosEntrega,
    domicilios: domiciliosEntrega,
  } = parsearDomiciliosEntrega(values);

  if (errorDomiciliosEntrega) {
    return construirEstadoError(values, errorDomiciliosEntrega, {
      domicilios: "Corrige los domicilios de entrega.",
    });
  }

  const {
    error: errorParametros,
    parametros,
  } = parsearParametrosCliente(values, null);

  if (errorParametros) {
    return construirEstadoError(values, errorParametros, {
      parametros_json: "Corrige las especificaciones del cliente.",
    });
  }

  if (usa_especificaciones_cliente && parametros.length === 0) {
    return construirEstadoError(
      values,
      "Marca al menos una especificación del cliente o desactiva esa opción.",
      {
        parametros_json: "Captura al menos una especificacion.",
      }
    );
  }

  const supabase = await crearClienteServidor();

  const { data: existeId } = await supabase
    .from("clientes")
    .select("id_cliente")
    .eq("id_cliente", id_cliente)
    .maybeSingle();

  if (existeId) {
    return construirEstadoError(values, "Ya existe un cliente con ese ID SAP.", {
      id_cliente: "Ese ID SAP ya esta registrado.",
    });
  }

  const { data: existeRfc } = await supabase
    .from("clientes")
    .select("id_cliente")
    .eq("rfc", rfc)
    .maybeSingle();

  if (existeRfc) {
    return construirEstadoError(values, "Ya existe un cliente con ese RFC.", {
      rfc: "Ese RFC ya esta registrado.",
    });
  }

  const { error } = await supabase.from("clientes").insert({
    id_cliente,
    nombre,
    rfc,
    domicilio_fiscal,
    domicilio_entrega: domiciliosEntrega[0]?.direccion ?? null,
    dom_fiscal_calle: domicilioFiscalEstructurado.calle,
    dom_fiscal_numero_exterior: domicilioFiscalEstructurado.numero_exterior || null,
    dom_fiscal_numero_interior: domicilioFiscalEstructurado.numero_interior || null,
    dom_fiscal_colonia: domicilioFiscalEstructurado.colonia,
    dom_fiscal_ciudad: domicilioFiscalEstructurado.ciudad,
    dom_fiscal_estado: domicilioFiscalEstructurado.estado,
    dom_fiscal_codigo_postal: domicilioFiscalEstructurado.codigo_postal,
    dom_fiscal_pais: domicilioFiscalEstructurado.pais,
    contacto_certificado,
    correo_contacto_cliente,
    correo_almacenista,
    correo_gte_calidad,
    solicita_certificado,
    usa_especificaciones_cliente,
    status: "activo",
    creado_por: usuario.usuario.id,
    actualizado_por: usuario.usuario.id,
  });

  if (error) {
    console.error("[clientes][crear]", error);
    return construirEstadoError(values, "No fue posible registrar al cliente.");
  }

  try {
    await sincronizarDireccionesEntrega(supabase, id_cliente, domiciliosEntrega);
    await sincronizarParametrosCliente(
      supabase,
      id_cliente,
      usa_especificaciones_cliente ? parametros : []
    );
  } catch (errorRelacion) {
    console.error("[clientes][crear_relaciones]", errorRelacion);
    return construirEstadoError(
      values,
      "El cliente se registro, pero fallo el guardado de direccion o especificaciones."
    );
  }

  revalidatePath("/clientes");
  redirect("/clientes");
}

// ─── EDITAR CLIENTE ──────────────────────────────────────

export async function editar_cliente(
  _estado: EstadoFormularioCliente,
  formData: FormData
): Promise<EstadoFormularioCliente> {
  const usuario = await requiere_permiso_escritura();
  const values = construirValoresCliente(formData);

  const id_cliente = parseInt(values.id_cliente, 10);
  const nombre = values.nombre;
  const rfc = values.rfc;
  const contacto_certificado = values.contacto_certificado || null;
  const correo_contacto_cliente = values.correo_contacto_cliente || null;
  const correo_almacenista = values.correo_almacenista || null;
  const correo_gte_calidad = values.correo_gte_calidad || null;
  const solicita_certificado = values.solicita_certificado;
  const usa_especificaciones_cliente = values.usa_especificaciones_cliente;
  const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;

  if (!nombre) {
    return construirEstadoError(values, "El nombre es obligatorio.", {
      nombre: "Captura el nombre o razon social.",
    });
  }
  if (!rfc) {
    return construirEstadoError(values, "El RFC es obligatorio.", {
      rfc: "Captura el RFC del cliente.",
    });
  }
  if (!rfcRegex.test(rfc)) {
    return construirEstadoError(values, "El formato del RFC no es válido.", {
      rfc: "El RFC no cumple el formato esperado.",
    });
  }

  const {
    error: errorDomicilio,
    valor: domicilio_fiscal,
    direccion: domicilioFiscalEstructurado,
  } = construirDomicilioFiscal(values);

  if (errorDomicilio) {
    return construirEstadoError(values, errorDomicilio, {
      domicilio_fiscal: "Completa el domicilio fiscal.",
    });
  }

  const {
    error: errorDomiciliosEntrega,
    domicilios: domiciliosEntrega,
  } = parsearDomiciliosEntrega(values);

  if (errorDomiciliosEntrega) {
    return construirEstadoError(values, errorDomiciliosEntrega, {
      domicilios: "Corrige los domicilios de entrega.",
    });
  }

  const {
    error: errorParametros,
    parametros,
  } = parsearParametrosCliente(values, null);

  if (errorParametros) {
    return construirEstadoError(values, errorParametros, {
      parametros_json: "Corrige las especificaciones del cliente.",
    });
  }

  if (usa_especificaciones_cliente && parametros.length === 0) {
    return construirEstadoError(
      values,
      "Marca al menos una especificación del cliente o desactiva esa opción.",
      {
        parametros_json: "Captura al menos una especificacion.",
      }
    );
  }

  const supabase = await crearClienteServidor();

  const { data: existeRfc } = await supabase
    .from("clientes")
    .select("id_cliente")
    .eq("rfc", rfc)
    .neq("id_cliente", id_cliente)
    .maybeSingle();

  if (existeRfc) {
    return construirEstadoError(values, "Ese RFC ya pertenece a otro cliente.", {
      rfc: "Ese RFC ya esta registrado.",
    });
  }

  const { error } = await supabase
    .from("clientes")
    .update({
      nombre,
      rfc,
      domicilio_fiscal,
      domicilio_entrega: domiciliosEntrega[0]?.direccion ?? null,
      dom_fiscal_calle: domicilioFiscalEstructurado.calle,
      dom_fiscal_numero_exterior: domicilioFiscalEstructurado.numero_exterior || null,
      dom_fiscal_numero_interior: domicilioFiscalEstructurado.numero_interior || null,
      dom_fiscal_colonia: domicilioFiscalEstructurado.colonia,
      dom_fiscal_ciudad: domicilioFiscalEstructurado.ciudad,
      dom_fiscal_estado: domicilioFiscalEstructurado.estado,
      dom_fiscal_codigo_postal: domicilioFiscalEstructurado.codigo_postal,
      dom_fiscal_pais: domicilioFiscalEstructurado.pais,
      contacto_certificado,
      correo_contacto_cliente,
      correo_almacenista,
      correo_gte_calidad,
      solicita_certificado,
      usa_especificaciones_cliente,
      actualizado_por: usuario.usuario.id,
    })
    .eq("id_cliente", id_cliente);

  if (error) {
    console.error("[clientes][editar]", error);
    return construirEstadoError(values, "No fue posible actualizar al cliente.");
  }

  try {
    await sincronizarDireccionesEntrega(supabase, id_cliente, domiciliosEntrega);
    await sincronizarParametrosCliente(
      supabase,
      id_cliente,
      usa_especificaciones_cliente ? parametros : []
    );
  } catch (errorRelacion) {
    console.error("[clientes][editar_relaciones]", errorRelacion);
    return construirEstadoError(
      values,
      "Los datos principales se actualizaron, pero fallo la direccion o las especificaciones."
    );
  }

  revalidatePath("/clientes");
  redirect("/clientes");
}

// ─── CAMBIAR STATUS ──────────────────────────────────────

export async function cambiar_status_cliente(formData: FormData) {
  const usuario = await requiere_permiso_escritura();

  const id_cliente = parseInt(limpiar(formData.get("id_cliente")), 10);
  const nuevo_status = limpiar(formData.get("nuevo_status"));
  const motivo = limpiar(formData.get("motivo"));

  if (!id_cliente || !es_status_cliente_valido(nuevo_status)) return;
  if (nuevo_status !== "activo" && !motivo) {
    return { error: "El motivo es obligatorio para inactivar o dar de baja." };
  }

  const supabase = await crearClienteServidor();

  await supabase
    .from("clientes")
    .update({
      status: nuevo_status,
      motivo_status: nuevo_status === "activo" ? null : motivo,
      actualizado_por: usuario.usuario.id,
    })
    .eq("id_cliente", id_cliente);

  revalidatePath("/clientes");
}
