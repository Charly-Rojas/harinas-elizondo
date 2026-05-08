"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requiere_sesion } from "@/lib/autorizacion";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  descargarPdfCertificado,
  generarYGuardarPdfCertificado,
  obtenerCertificadoDetalleConCliente,
  requiereRegenerarPdf,
} from "@/lib/certificados";
import {
  correoConfigurado,
  enviarCorreoCertificado,
  normalizarDestinatarios,
} from "@/lib/correo";
import {
  PDF_CERTIFICADO_VERSION,
} from "@/lib/pdf-certificados";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { FormState } from "@/lib/form-state";

type ValoresFormularioCertificado = {
  id_inspeccion: string;
  numero_pedido_cliente: string;
  cantidad_solicitada: string;
  cantidad_total_entrega: string;
  numero_factura: string;
  fecha_envio: string;
  fecha_produccion: string;
  fecha_caducidad: string;
  id_direccion_entrega: string;
  correo_cliente: string;
  correo_almacen: string;
  observaciones: string;
};

export type EstadoFormularioCertificado = FormState<
  ValoresFormularioCertificado,
  keyof ValoresFormularioCertificado
>;

function limpiar(valor: FormDataEntryValue | null) {
  return String(valor ?? "").trim();
}

function numeroOpcional(valor: string) {
  if (!valor) return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function extraerValoresFormulario(formData: FormData): ValoresFormularioCertificado {
  return {
    id_inspeccion: limpiar(formData.get("id_inspeccion")),
    numero_pedido_cliente: limpiar(formData.get("numero_pedido_cliente")),
    cantidad_solicitada: limpiar(formData.get("cantidad_solicitada")),
    cantidad_total_entrega: limpiar(formData.get("cantidad_total_entrega")),
    numero_factura: limpiar(formData.get("numero_factura")),
    fecha_envio: limpiar(formData.get("fecha_envio")),
    fecha_produccion: limpiar(formData.get("fecha_produccion")),
    fecha_caducidad: limpiar(formData.get("fecha_caducidad")),
    id_direccion_entrega: limpiar(formData.get("id_direccion_entrega")),
    correo_cliente: limpiar(formData.get("correo_cliente")),
    correo_almacen: limpiar(formData.get("correo_almacen")),
    observaciones: limpiar(formData.get("observaciones")),
  };
}

function errorFormularioCertificado(
  values: ValoresFormularioCertificado,
  formError: string,
  fieldErrors?: EstadoFormularioCertificado["fieldErrors"]
): EstadoFormularioCertificado {
  return {
    formError,
    fieldErrors,
    values,
  };
}

function redirigirDetalleCertificado(
  idCertificado: number,
  tipo: "exito" | "error",
  mensaje: string
): never {
  const parametros = new URLSearchParams({
    tipo,
    mensaje,
  });

  redirect(`/certificados/${idCertificado}?${parametros.toString()}`);
}

async function generarFolioCertificado(
  supabase: Awaited<ReturnType<typeof crearClienteServidor>>
) {
  const anio = new Date().getFullYear();
  const prefijo = `CC-${anio}-`;
  const { data } = await supabase
    .from("certificados_calidad")
    .select("folio")
    .like("folio", `${prefijo}%`)
    .order("folio", { ascending: false })
    .limit(1);

  const ultimo = data?.[0]?.folio ?? null;
  const consecutivo = ultimo ? Number(ultimo.replace(prefijo, "")) + 1 : 1;

  return `${prefijo}${String(consecutivo).padStart(4, "0")}`;
}

export async function crear_certificado(
  _estado: EstadoFormularioCertificado,
  formData: FormData
): Promise<EstadoFormularioCertificado> {
  const usuario = await requiere_sesion();

  const values = extraerValoresFormulario(formData);
  const id_inspeccion = parseInt(values.id_inspeccion, 10);
  const numero_pedido_cliente = values.numero_pedido_cliente || null;
  const cantidad_solicitada = numeroOpcional(values.cantidad_solicitada);
  const cantidad_total_entrega = numeroOpcional(values.cantidad_total_entrega);
  const numero_factura = values.numero_factura || null;
  const fecha_envio = values.fecha_envio || null;
  const fecha_produccion = values.fecha_produccion || null;
  const fecha_caducidad = values.fecha_caducidad || null;
  const id_direccion_entrega = values.id_direccion_entrega
    ? parseInt(values.id_direccion_entrega, 10)
    : null;
  const correo_cliente = values.correo_cliente || null;
  const correo_almacen = values.correo_almacen || null;
  const observaciones = values.observaciones || null;

  if (!id_inspeccion) {
    return errorFormularioCertificado(values, "Debes seleccionar una inspección.", {
      id_inspeccion: "Selecciona una inspección válida.",
    });
  }

  const supabase = await crearClienteServidor();

  const { data: inspeccion } = await supabase
    .from("inspecciones")
    .select(
      "id_inspeccion, id_cliente, id_lote, secuencia, status, es_ajuste, id_inspeccion_base, clientes(id_cliente, nombre, domicilio_fiscal, correo_contacto_cliente, correo_almacenista, direcciones(*)), lotes_produccion(id_lote, numero_lote, fecha_produccion, fecha_caducidad), resultados_analisis(*, parametros_calidad(id_parametro, clave, nombre))"
    )
    .eq("id_inspeccion", id_inspeccion)
    .maybeSingle();

  if (!inspeccion) {
    return errorFormularioCertificado(
      values,
      "No se encontró la inspección seleccionada."
    );
  }

  if (!inspeccion.id_cliente) {
    return errorFormularioCertificado(
      values,
      "La inspección debe tener un cliente asociado para emitir certificado."
    );
  }

  if (!inspeccion.resultados_analisis?.length) {
    return errorFormularioCertificado(
      values,
      "La inspección no tiene resultados para certificar."
    );
  }

  const clienteRelacionado = Array.isArray(inspeccion.clientes)
    ? inspeccion.clientes[0]
    : inspeccion.clientes;
  const loteRelacionado = Array.isArray(inspeccion.lotes_produccion)
    ? inspeccion.lotes_produccion[0]
    : inspeccion.lotes_produccion;
  const direccionesEntrega = Array.isArray(clienteRelacionado?.direcciones)
    ? clienteRelacionado.direcciones
    : [];
  const direccionEntregaSeleccionada = id_direccion_entrega
    ? direccionesEntrega.find((direccion) => direccion.id_direccion === id_direccion_entrega)
    : null;

  if (id_direccion_entrega && !direccionEntregaSeleccionada) {
    return errorFormularioCertificado(
      values,
      "El domicilio de entrega seleccionado ya no está disponible.",
      {
        id_direccion_entrega: "Selecciona un domicilio de entrega válido.",
      }
    );
  }

  const destinatarios = normalizarDestinatarios([
    correo_cliente || clienteRelacionado?.correo_contacto_cliente,
    correo_almacen || clienteRelacionado?.correo_almacenista,
  ]);

  const { data: existente } = await supabase
    .from("certificados_calidad")
    .select("id_certificado, folio, status_certificado")
    .eq("id_inspeccion", id_inspeccion)
    .neq("status_certificado", "cancelado")
    .order("creado_en", { ascending: false })
    .limit(1);

  if (existente?.length) {
    return errorFormularioCertificado(
      values,
      `La inspección ya cuenta con un certificado activo (${existente[0].folio ?? `#${existente[0].id_certificado}`}).`
    );
  }

  const folio = await generarFolioCertificado(supabase);
  const nombreArchivo = `${folio}.pdf`;
  const storagePath = nombreArchivo;

  const { data: certificado, error } = await supabase
    .from("certificados_calidad")
    .insert({
      folio,
      id_cliente: inspeccion.id_cliente,
      id_lote: inspeccion.id_lote,
      id_inspeccion,
      numero_pedido_cliente,
      cantidad_solicitada,
      cantidad_total_entrega,
      numero_factura,
      fecha_envio,
      fecha_produccion:
        fecha_produccion ?? loteRelacionado?.fecha_produccion ?? null,
      fecha_caducidad:
        fecha_caducidad ?? loteRelacionado?.fecha_caducidad ?? null,
      domicilio_fiscal_snapshot: clienteRelacionado?.domicilio_fiscal ?? null,
      domicilio_entrega_snapshot:
        direccionEntregaSeleccionada?.direccion ?? null,
      domicilio_entrega_etiqueta_snapshot:
        direccionEntregaSeleccionada?.etiqueta ?? null,
      correo_cliente:
        correo_cliente ?? clienteRelacionado?.correo_contacto_cliente ?? null,
      correo_almacen:
        correo_almacen ?? clienteRelacionado?.correo_almacenista ?? null,
      status_certificado: "emitido",
      status_envio: "pendiente",
      pdf_storage_path: storagePath,
      pdf_nombre_archivo: nombreArchivo,
      pdf_version: PDF_CERTIFICADO_VERSION,
      observaciones,
      emitido_en: new Date().toISOString(),
      emitido_por: usuario.usuario.id,
      actualizado_por: usuario.usuario.id,
    })
    .select("id_certificado")
    .single();

  if (error || !certificado) {
    console.error("[certificados][crear]", error);
    return errorFormularioCertificado(
      values,
      "No fue posible emitir el certificado."
    );
  }

  const resultadosSnapshot = inspeccion.resultados_analisis.map((resultado) => ({
    id_certificado: certificado.id_certificado,
    id_parametro: resultado.id_parametro,
    clave_parametro: resultado.parametros_calidad?.clave ?? null,
    nombre_parametro:
      resultado.parametros_calidad?.nombre ?? `Parámetro ${resultado.id_parametro}`,
    unidad_medida: resultado.unidad_medida,
    valor: resultado.valor,
    valor_texto: resultado.valor_texto,
    lim_min_aplicado: resultado.lim_min_aplicado,
    lim_max_aplicado: resultado.lim_max_aplicado,
    desviacion: resultado.desviacion,
    dentro_especificacion: resultado.dentro_especificacion,
    origen_limites: resultado.origen_limites,
    observaciones: resultado.observaciones,
  }));

  const { error: errorResultados } = await supabase
    .from("certificado_resultados")
    .insert(resultadosSnapshot);

  if (errorResultados) {
    console.error("[certificados][resultados]", errorResultados);
    return errorFormularioCertificado(
      values,
      "El certificado se creó, pero falló el snapshot de resultados."
    );
  }

  await supabase
    .from("inspecciones")
    .update({
      status: "aprobada",
      actualizada_por: usuario.usuario.id,
    })
    .eq("id_inspeccion", id_inspeccion);

  let pdfContenido: Uint8Array | null = null;
  let pdfPath = `/certificados/${certificado.id_certificado}/pdf`;

  try {
    const pdfGenerado = await generarYGuardarPdfCertificado({
        ...certificado,
        folio,
        id_cliente: inspeccion.id_cliente,
        id_lote: inspeccion.id_lote,
        id_inspeccion,
        numero_pedido_cliente,
        cantidad_solicitada,
        cantidad_total_entrega,
        numero_factura,
        fecha_envio,
        fecha_produccion: fecha_produccion ?? loteRelacionado?.fecha_produccion ?? null,
        fecha_caducidad: fecha_caducidad ?? loteRelacionado?.fecha_caducidad ?? null,
        domicilio_fiscal_snapshot: clienteRelacionado?.domicilio_fiscal ?? null,
        domicilio_entrega_snapshot: direccionEntregaSeleccionada?.direccion ?? null,
        domicilio_entrega_etiqueta_snapshot:
          direccionEntregaSeleccionada?.etiqueta ?? null,
        correo_cliente:
          correo_cliente ?? clienteRelacionado?.correo_contacto_cliente ?? null,
        correo_almacen:
          correo_almacen ?? clienteRelacionado?.correo_almacenista ?? null,
        status_certificado: "emitido",
        status_envio: "pendiente",
        pdf_storage_path: storagePath,
        pdf_nombre_archivo: nombreArchivo,
        pdf_version: PDF_CERTIFICADO_VERSION,
        observaciones,
        emitido_en: new Date().toISOString(),
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString(),
        emitido_por: usuario.usuario.id,
        actualizado_por: usuario.usuario.id,
        clientes: clienteRelacionado
          ? {
              id_cliente: clienteRelacionado.id_cliente,
              nombre: clienteRelacionado.nombre,
            }
          : null,
        lotes_produccion: loteRelacionado
          ? {
              id_lote: loteRelacionado.id_lote,
              numero_lote: loteRelacionado.numero_lote,
              id_producto: null,
              variedad: null,
              fecha_produccion: loteRelacionado.fecha_produccion ?? null,
              fecha_caducidad: loteRelacionado.fecha_caducidad ?? null,
              observaciones: null,
              creado_en: "",
              actualizado_en: "",
              creado_por: null,
              actualizado_por: null,
            }
          : null,
        inspecciones: {
          id_inspeccion,
          secuencia: inspeccion.secuencia,
          es_ajuste: inspeccion.es_ajuste,
          id_inspeccion_base: inspeccion.id_inspeccion_base,
        },
        certificado_resultados: resultadosSnapshot.map((resultado, indice) => ({
          id: indice + 1,
          ...resultado,
        })),
      }, usuario.usuario.id);

    pdfContenido = pdfGenerado.contenido;
    if (pdfGenerado.pdfPath) {
      pdfPath = pdfGenerado.pdfPath;
    }
  } catch (errorPdf) {
    console.error("[certificados][pdf]", errorPdf);
  }

  await supabase
    .from("certificados_calidad")
    .update({
      pdf_storage_path: pdfPath,
      pdf_version: PDF_CERTIFICADO_VERSION,
      actualizado_por: usuario.usuario.id,
    })
    .eq("id_certificado", certificado.id_certificado);

  await registrarAuditoria(supabase, {
    entidad: "certificados_calidad",
    entidadId: String(certificado.id_certificado),
    accion: "emitir",
    descripcion: `Certificado ${folio} emitido desde inspección ${inspeccion.secuencia}.`,
    valoresAnteriores: {
      id_inspeccion,
      status_inspeccion: inspeccion.status,
    },
    valoresNuevos: {
      folio,
      id_cliente: inspeccion.id_cliente,
      id_lote: inspeccion.id_lote,
      resultados: resultadosSnapshot.length,
      fuera_especificacion: resultadosSnapshot.filter(
        (resultado) => resultado.dentro_especificacion === false
      ).length,
    },
    usuarioId: usuario.usuario.id,
  });

  if (correoConfigurado() && destinatarios.length > 0) {
    try {
      await enviarCorreoCertificado({
        folio,
        cliente: clienteRelacionado?.nombre || `Cliente ${inspeccion.id_cliente}`,
        lote: loteRelacionado?.numero_lote || `Lote ${inspeccion.id_lote}`,
        secuencia: inspeccion.secuencia,
        destinatarios,
        numeroFactura: numero_factura,
        fechaEnvio: fecha_envio,
        totalResultados: resultadosSnapshot.length,
        fueraEspecificacion: resultadosSnapshot.filter(
          (resultado) => resultado.dentro_especificacion === false
        ).length,
        pdfNombre: nombreArchivo,
        pdfContenido,
      });

      await supabase
        .from("certificados_calidad")
        .update({
          status_envio: "enviado",
          actualizado_por: usuario.usuario.id,
        })
        .eq("id_certificado", certificado.id_certificado);
    } catch (errorEnvio) {
      console.error("[certificados][correo]", errorEnvio);
      await supabase
        .from("certificados_calidad")
        .update({
          status_envio: "fallido",
          actualizado_por: usuario.usuario.id,
        })
        .eq("id_certificado", certificado.id_certificado);

      await registrarAuditoria(supabase, {
        entidad: "certificados_calidad",
        entidadId: String(certificado.id_certificado),
        accion: "envio_fallido",
        descripcion: `Fallo el envio del certificado ${folio}.`,
        valoresNuevos: {
          destinatarios,
        },
        motivo:
          errorEnvio instanceof Error ? errorEnvio.message : "Error desconocido",
        usuarioId: usuario.usuario.id,
      });
    }
  }

  revalidatePath("/certificados");
  revalidatePath("/inspecciones");
  revalidatePath(`/certificados/${certificado.id_certificado}`);
  redirect(`/certificados/${certificado.id_certificado}`);
}

export async function enviar_certificado_cliente(formData: FormData) {
  const usuario = await requiere_sesion();
  const idCertificado = parseInt(limpiar(formData.get("id_certificado")), 10);

  if (!idCertificado) {
    redirect("/certificados");
  }

  if (!correoConfigurado()) {
    redirigirDetalleCertificado(
      idCertificado,
      "error",
      "SMTP no está configurado para enviar correos."
    );
  }

  const supabase = await crearClienteServidor();
  const certificado = await obtenerCertificadoDetalleConCliente(
    supabase,
    idCertificado
  );

  if (!certificado) {
    redirigirDetalleCertificado(
      idCertificado,
      "error",
      "No se encontró el certificado seleccionado."
    );
  }

  const cliente = Array.isArray(certificado.clientes)
    ? certificado.clientes[0]
    : certificado.clientes;
  const lote = Array.isArray(certificado.lotes_produccion)
    ? certificado.lotes_produccion[0]
    : certificado.lotes_produccion;
  const inspeccion = Array.isArray(certificado.inspecciones)
    ? certificado.inspecciones[0]
    : certificado.inspecciones;

  const destinatarios = normalizarDestinatarios([
    certificado.correo_cliente,
    certificado.correo_almacen,
  ]);

  if (!destinatarios.length) {
    redirigirDetalleCertificado(
      idCertificado,
      "error",
      "El certificado no tiene correos de destino configurados."
    );
  }

  let pdfContenido: Uint8Array | null = null;
  let pdfNombre =
    certificado.pdf_nombre_archivo ||
    `${certificado.folio || `certificado-${certificado.id_certificado}`}.pdf`;

  if (!requiereRegenerarPdf(certificado) && certificado.pdf_storage_path) {
    pdfContenido = await descargarPdfCertificado(certificado.pdf_storage_path);
  }

  if (!pdfContenido) {
    const regenerado = await generarYGuardarPdfCertificado(
      certificado,
      usuario.usuario.id
    );
    pdfContenido = regenerado.contenido;
    pdfNombre = regenerado.pdfNombre;
  }

  try {
    await enviarCorreoCertificado({
      folio: certificado.folio || `CERT-${certificado.id_certificado}`,
      cliente: cliente?.nombre || `Cliente ${certificado.id_cliente}`,
      lote: lote?.numero_lote || `Lote ${certificado.id_lote}`,
      secuencia: inspeccion?.secuencia || "-",
      destinatarios,
      numeroFactura: certificado.numero_factura,
      fechaEnvio: certificado.fecha_envio,
      totalResultados: certificado.certificado_resultados.length,
      fueraEspecificacion: certificado.certificado_resultados.filter(
        (resultado) => resultado.dentro_especificacion === false
      ).length,
      pdfNombre,
      pdfContenido,
    });

    await supabase
      .from("certificados_calidad")
      .update({
        status_envio: "enviado",
        actualizado_por: usuario.usuario.id,
      })
      .eq("id_certificado", idCertificado);

    await registrarAuditoria(supabase, {
      entidad: "certificados_calidad",
      entidadId: String(idCertificado),
      accion: "envio_manual",
      descripcion: `Envío manual del certificado ${certificado.folio || `#${idCertificado}`}.`,
      valoresNuevos: {
        destinatarios,
      },
      usuarioId: usuario.usuario.id,
    });

    revalidatePath("/certificados");
    revalidatePath(`/certificados/${idCertificado}`);
    redirigirDetalleCertificado(
      idCertificado,
      "exito",
      "Certificado enviado correctamente."
    );
  } catch (errorEnvio) {
    console.error("[certificados][correo][manual]", errorEnvio);

    await supabase
      .from("certificados_calidad")
      .update({
        status_envio: "fallido",
        actualizado_por: usuario.usuario.id,
      })
      .eq("id_certificado", idCertificado);

    await registrarAuditoria(supabase, {
      entidad: "certificados_calidad",
      entidadId: String(idCertificado),
      accion: "envio_manual_fallido",
      descripcion: `Fallo el envío manual del certificado ${certificado.folio || `#${idCertificado}`}.`,
      valoresNuevos: {
        destinatarios,
      },
      motivo:
        errorEnvio instanceof Error ? errorEnvio.message : "Error desconocido",
      usuarioId: usuario.usuario.id,
    });

    revalidatePath("/certificados");
    revalidatePath(`/certificados/${idCertificado}`);
    redirigirDetalleCertificado(
      idCertificado,
      "error",
      "No fue posible enviar el certificado."
    );
  }
}
