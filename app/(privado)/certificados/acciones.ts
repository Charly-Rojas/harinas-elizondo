"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requiere_sesion } from "@/lib/autorizacion";
import { registrarAuditoria } from "@/lib/auditoria";
import { guardarPdfCertificado } from "@/lib/certificados";
import {
  correoConfigurado,
  enviarCorreoCertificado,
  normalizarDestinatarios,
} from "@/lib/correo";
import { construirPayloadPdfCertificado, generarPdfCertificado } from "@/lib/pdf-certificados";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export type EstadoFormularioCertificado = {
  error?: string;
};

function limpiar(valor: FormDataEntryValue | null) {
  return String(valor ?? "").trim();
}

function numeroOpcional(valor: string) {
  if (!valor) return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
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

  const id_inspeccion = parseInt(limpiar(formData.get("id_inspeccion")), 10);
  const numero_orden_compra = limpiar(formData.get("numero_orden_compra")) || null;
  const cantidad_solicitada = numeroOpcional(limpiar(formData.get("cantidad_solicitada")));
  const cantidad_total_entrega = numeroOpcional(
    limpiar(formData.get("cantidad_total_entrega"))
  );
  const numero_factura = limpiar(formData.get("numero_factura")) || null;
  const fecha_envio = limpiar(formData.get("fecha_envio")) || null;
  const fecha_caducidad = limpiar(formData.get("fecha_caducidad")) || null;
  const correo_cliente = limpiar(formData.get("correo_cliente")) || null;
  const correo_almacen = limpiar(formData.get("correo_almacen")) || null;
  const observaciones = limpiar(formData.get("observaciones")) || null;

  if (!id_inspeccion) {
    return { error: "Debes seleccionar una inspección." };
  }

  const supabase = await crearClienteServidor();

  const { data: inspeccion } = await supabase
    .from("inspecciones")
    .select(
      "id_inspeccion, id_cliente, id_lote, secuencia, status, es_ajuste, id_inspeccion_base, clientes(id_cliente, nombre, correo_contacto_cliente, correo_almacenista), lotes_produccion(id_lote, numero_lote, fecha_caducidad), resultados_analisis(*, parametros_calidad(id_parametro, clave, nombre))"
    )
    .eq("id_inspeccion", id_inspeccion)
    .maybeSingle();

  if (!inspeccion) {
    return { error: "No se encontró la inspección seleccionada." };
  }

  if (!inspeccion.id_cliente) {
    return { error: "La inspección debe tener un cliente asociado para emitir certificado." };
  }

  if (!inspeccion.resultados_analisis?.length) {
    return { error: "La inspección no tiene resultados para certificar." };
  }

  const clienteRelacionado = Array.isArray(inspeccion.clientes)
    ? inspeccion.clientes[0]
    : inspeccion.clientes;
  const loteRelacionado = Array.isArray(inspeccion.lotes_produccion)
    ? inspeccion.lotes_produccion[0]
    : inspeccion.lotes_produccion;
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
    return {
      error: `La inspección ya cuenta con un certificado activo (${existente[0].folio ?? `#${existente[0].id_certificado}`}).`,
    };
  }

  const folio = await generarFolioCertificado(supabase);
  const nombreArchivo = `${folio}.pdf`;
  const storagePath = `certificados/${nombreArchivo}`;

  const { data: certificado, error } = await supabase
    .from("certificados_calidad")
    .insert({
      folio,
      id_cliente: inspeccion.id_cliente,
      id_lote: inspeccion.id_lote,
      id_inspeccion,
      numero_orden_compra,
      cantidad_solicitada,
      cantidad_total_entrega,
      numero_factura,
      fecha_envio,
      fecha_caducidad:
        fecha_caducidad ?? loteRelacionado?.fecha_caducidad ?? null,
      correo_cliente:
        correo_cliente ?? clienteRelacionado?.correo_contacto_cliente ?? null,
      correo_almacen:
        correo_almacen ?? clienteRelacionado?.correo_almacenista ?? null,
      status_certificado: "emitido",
      status_envio: "pendiente",
      pdf_storage_path: storagePath,
      pdf_nombre_archivo: nombreArchivo,
      observaciones,
      emitido_en: new Date().toISOString(),
      emitido_por: usuario.usuario.id,
      actualizado_por: usuario.usuario.id,
    })
    .select("id_certificado")
    .single();

  if (error || !certificado) {
    console.error("[certificados][crear]", error);
    return { error: "No fue posible emitir el certificado." };
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
    return { error: "El certificado se creó, pero falló el snapshot de resultados." };
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
    pdfContenido = await generarPdfCertificado(
      construirPayloadPdfCertificado({
        ...certificado,
        folio,
        id_cliente: inspeccion.id_cliente,
        id_lote: inspeccion.id_lote,
        id_inspeccion,
        numero_orden_compra,
        cantidad_solicitada,
        cantidad_total_entrega,
        numero_factura,
        fecha_envio,
        fecha_caducidad: fecha_caducidad ?? loteRelacionado?.fecha_caducidad ?? null,
        correo_cliente:
          correo_cliente ?? clienteRelacionado?.correo_contacto_cliente ?? null,
        correo_almacen:
          correo_almacen ?? clienteRelacionado?.correo_almacenista ?? null,
        status_certificado: "emitido",
        status_envio: "pendiente",
        pdf_storage_path: null,
        pdf_nombre_archivo: nombreArchivo,
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
              fecha_produccion: null,
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
      })
    );

    const upload = await guardarPdfCertificado(nombreArchivo, pdfContenido);
    if (upload) {
      pdfPath = upload.path;
    }
  } catch (errorPdf) {
    console.error("[certificados][pdf]", errorPdf);
  }

  await supabase
    .from("certificados_calidad")
    .update({
      pdf_storage_path: pdfPath,
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
