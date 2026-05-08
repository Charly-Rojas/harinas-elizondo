import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import {
  construirPayloadPdfCertificado,
  generarPdfCertificado,
  PDF_CERTIFICADO_VERSION,
} from "@/lib/pdf-certificados";
import { supabaseAdminConfigurado } from "@/lib/supabase/configuracion";
import type { CertificadoConRelaciones } from "@/lib/tipos-dominio";

export function normalizarRelacion<T>(valor: T | T[] | null | undefined) {
  if (Array.isArray(valor)) {
    return valor[0] ?? null;
  }

  return valor ?? null;
}

export async function obtenerCertificadoDetalleConCliente(
  supabase: SupabaseClient,
  idCertificado: number
) {
  const { data } = await supabase
    .from("certificados_calidad")
    .select(
      "*, clientes(id_cliente, nombre, domicilio_fiscal), lotes_produccion(id_lote, numero_lote, fecha_produccion, fecha_caducidad, productos(*)), inspecciones(id_inspeccion, secuencia, es_ajuste, id_inspeccion_base), certificado_resultados(*)"
    )
    .eq("id_certificado", idCertificado)
    .maybeSingle();

  return data as CertificadoConRelaciones | null;
}

export async function obtenerCertificadoDetalle(idCertificado: number) {
  return await obtenerCertificadoDetalleConCliente(crearClienteAdmin(), idCertificado);
}

export async function guardarPdfCertificado(
  nombreArchivo: string,
  contenido: Uint8Array
) {
  if (!supabaseAdminConfigurado()) {
    return null;
  }

  const supabase = crearClienteAdmin();
  const bucket = "certificados";

  try {
    const { data: bucketActual } = await supabase.storage.getBucket(bucket);

    if (!bucketActual) {
      await supabase.storage.createBucket(bucket, {
        public: false,
        fileSizeLimit: 10 * 1024 * 1024,
      });
    }
  } catch (error) {
    console.error("[certificados][bucket]", error);
  }

  const path = nombreArchivo;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, contenido, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) {
    console.error("[certificados][storage]", error);
    return null;
  }

  return {
    bucket,
    path,
  };
}

export async function descargarPdfCertificado(path: string) {
  if (!supabaseAdminConfigurado()) {
    return null;
  }

  const supabase = crearClienteAdmin();
  const { data, error } = await supabase.storage.from("certificados").download(path);

  if (error || !data) {
    console.error("[certificados][storage][download]", error);
    return null;
  }

  return new Uint8Array(await data.arrayBuffer());
}

export function requiereRegenerarPdf(certificado: Pick<
  CertificadoConRelaciones,
  "pdf_storage_path" | "pdf_version"
>) {
  return (
    !certificado.pdf_storage_path ||
    certificado.pdf_storage_path.startsWith("/") ||
    (certificado.pdf_version ?? 1) < PDF_CERTIFICADO_VERSION
  );
}

export async function generarYGuardarPdfCertificado(
  certificado: CertificadoConRelaciones,
  usuarioId?: string | null
) {
  const contenido = await generarPdfCertificado(
    construirPayloadPdfCertificado(certificado)
  );
  const nombreArchivo =
    certificado.pdf_nombre_archivo ||
    `${certificado.folio || `certificado-${certificado.id_certificado}`}.pdf`;
  const upload = await guardarPdfCertificado(nombreArchivo, contenido);

  if (upload && supabaseAdminConfigurado()) {
    const supabase = crearClienteAdmin();
    await supabase
      .from("certificados_calidad")
      .update({
        pdf_storage_path: upload.path,
        pdf_nombre_archivo: nombreArchivo,
        pdf_version: PDF_CERTIFICADO_VERSION,
        ...(usuarioId ? { actualizado_por: usuarioId } : {}),
      })
      .eq("id_certificado", certificado.id_certificado);
  }

  return {
    contenido,
    pdfPath: upload?.path || certificado.pdf_storage_path || null,
    pdfNombre: nombreArchivo,
  };
}
