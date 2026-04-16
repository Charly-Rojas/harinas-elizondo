import { obtener_usuario_actual } from "@/lib/autorizacion";
import {
  descargarPdfCertificado,
  obtenerCertificadoDetalleConCliente,
} from "@/lib/certificados";
import {
  construirPayloadPdfCertificado,
  generarPdfCertificado,
} from "@/lib/pdf-certificados";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const usuario = await obtener_usuario_actual();

  if (!usuario?.perfil.aprobado) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const idCertificado = Number(id);

  if (!idCertificado) {
    return new Response("Not found", { status: 404 });
  }

  const supabase = await crearClienteServidor();
  const certificado = await obtenerCertificadoDetalleConCliente(
    supabase,
    idCertificado
  );

  if (!certificado) {
    return new Response("Not found", { status: 404 });
  }

  let contenido: Uint8Array | null = null;

  if (
    certificado.pdf_storage_path &&
    !certificado.pdf_storage_path.startsWith("/")
  ) {
    contenido = await descargarPdfCertificado(certificado.pdf_storage_path);
  }

  if (!contenido) {
    contenido = await generarPdfCertificado(
      construirPayloadPdfCertificado(certificado)
    );
  }

  const nombreArchivo =
    certificado.pdf_nombre_archivo ||
    `${certificado.folio || `certificado-${certificado.id_certificado}`}.pdf`;

  const copia = new Uint8Array(contenido.byteLength);
  copia.set(contenido);

  const body = new Blob([copia.buffer], {
    type: "application/pdf",
  });

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nombreArchivo}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
