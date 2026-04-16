import "server-only";

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { CertificadoConRelaciones } from "@/lib/tipos-dominio";

type ResultadoPdf = {
  nombreParametro: string;
  claveParametro: string | null;
  valor: string;
  unidadMedida: string | null;
  limMin: string;
  limMax: string;
  desviacion: string;
  estado: string;
};

export type PayloadPdfCertificado = {
  folio: string;
  cliente: string;
  lote: string;
  secuencia: string;
  numeroOrdenCompra?: string | null;
  numeroFactura?: string | null;
  fechaEnvio?: string | null;
  fechaCaducidad?: string | null;
  cantidadSolicitada?: string | null;
  cantidadTotalEntrega?: string | null;
  observaciones?: string | null;
  resultados: ResultadoPdf[];
};

function formatearNumero(valor: number | null) {
  if (valor === null || valor === undefined) return "-";
  return new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: 4,
  }).format(valor);
}

export function construirPayloadPdfCertificado(
  certificado: CertificadoConRelaciones
): PayloadPdfCertificado {
  const cliente = Array.isArray(certificado.clientes)
    ? certificado.clientes[0]
    : certificado.clientes;
  const lote = Array.isArray(certificado.lotes_produccion)
    ? certificado.lotes_produccion[0]
    : certificado.lotes_produccion;
  const inspeccion = Array.isArray(certificado.inspecciones)
    ? certificado.inspecciones[0]
    : certificado.inspecciones;

  return {
    folio: certificado.folio || `CERT-${certificado.id_certificado}`,
    cliente: cliente?.nombre || "-",
    lote: lote?.numero_lote || "-",
    secuencia: inspeccion?.secuencia || "-",
    numeroOrdenCompra: certificado.numero_orden_compra,
    numeroFactura: certificado.numero_factura,
    fechaEnvio: certificado.fecha_envio,
    fechaCaducidad: certificado.fecha_caducidad || lote?.fecha_caducidad || null,
    cantidadSolicitada: formatearNumero(certificado.cantidad_solicitada),
    cantidadTotalEntrega: formatearNumero(certificado.cantidad_total_entrega),
    observaciones: certificado.observaciones,
    resultados: certificado.certificado_resultados.map((resultado) => ({
      nombreParametro: resultado.nombre_parametro,
      claveParametro: resultado.clave_parametro,
      valor: resultado.valor_texto || formatearNumero(resultado.valor),
      unidadMedida: resultado.unidad_medida,
      limMin: formatearNumero(resultado.lim_min_aplicado),
      limMax: formatearNumero(resultado.lim_max_aplicado),
      desviacion: formatearNumero(resultado.desviacion),
      estado:
        resultado.dentro_especificacion === false
          ? "Fuera"
          : resultado.dentro_especificacion === true
            ? "Dentro"
            : "Sin límite",
    })),
  };
}

const COLOR_TEXTO = rgb(0.06, 0.09, 0.16);
const COLOR_MUTED = rgb(0.42, 0.47, 0.55);
const COLOR_LINEA = rgb(0.87, 0.89, 0.92);
const COLOR_HEADER = rgb(0.94, 0.96, 0.99);

function dibujarTextoAjustado(
  page: PDFPage,
  font: PDFFont,
  texto: string,
  x: number,
  y: number,
  maxWidth: number,
  size: number,
  color = COLOR_TEXTO
) {
  const palabras = texto.split(/\s+/).filter(Boolean);
  const lineas: string[] = [];
  let actual = "";

  for (const palabra of palabras) {
    const candidato = actual ? `${actual} ${palabra}` : palabra;
    const ancho = font.widthOfTextAtSize(candidato, size);
    if (ancho <= maxWidth || !actual) {
      actual = candidato;
      continue;
    }
    lineas.push(actual);
    actual = palabra;
  }

  if (actual) {
    lineas.push(actual);
  }

  lineas.forEach((linea, indice) => {
    page.drawText(linea, {
      x,
      y: y - indice * (size + 3),
      size,
      font,
      color,
    });
  });

  return y - Math.max(lineas.length - 1, 0) * (size + 3);
}

function filaTabla(
  page: PDFPage,
  font: PDFFont,
  valores: string[],
  y: number,
  alto: number,
  background?: ReturnType<typeof rgb>
) {
  const columnas = [36, 250, 330, 390, 445, 500, 545];
  const anchos = [206, 70, 60, 55, 55, 45, 28];

  if (background) {
    page.drawRectangle({
      x: 32,
      y: y - alto + 6,
      width: 532,
      height: alto,
      color: background,
    });
  }

  valores.forEach((valor, indice) => {
    dibujarTextoAjustado(
      page,
      font,
      valor,
      columnas[indice],
      y - 12,
      anchos[indice],
      8,
      COLOR_TEXTO
    );
  });

  page.drawLine({
    start: { x: 32, y: y - alto + 6 },
    end: { x: 564, y: y - alto + 6 },
    color: COLOR_LINEA,
    thickness: 0.7,
  });

  return y - alto;
}

export async function generarPdfCertificado(payload: PayloadPdfCertificado) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page = pdf.addPage([595.28, 841.89]);
  let y = 804;

  const nuevaPagina = () => {
    page = pdf.addPage([595.28, 841.89]);
    y = 804;
  };

  page.drawText("Harinas Elizondo", {
    x: 36,
    y,
    size: 20,
    font: fontBold,
    color: COLOR_TEXTO,
  });
  y -= 24;

  page.drawText("Certificado de calidad", {
    x: 36,
    y,
    size: 12,
    font,
    color: COLOR_MUTED,
  });
  y -= 28;

  page.drawText(payload.folio, {
    x: 36,
    y,
    size: 16,
    font: fontBold,
    color: COLOR_TEXTO,
  });
  y -= 30;

  const bloques = [
    ["Cliente", payload.cliente],
    ["Lote", payload.lote],
    ["Inspección", payload.secuencia],
    ["Orden de compra", payload.numeroOrdenCompra || "-"],
    ["Factura", payload.numeroFactura || "-"],
    ["Fecha de envío", payload.fechaEnvio || "-"],
    ["Fecha de caducidad", payload.fechaCaducidad || "-"],
    ["Cantidad solicitada", payload.cantidadSolicitada || "-"],
    ["Cantidad total entrega", payload.cantidadTotalEntrega || "-"],
  ];

  for (let indice = 0; indice < bloques.length; indice += 3) {
    const grupo = bloques.slice(indice, indice + 3);
    grupo.forEach(([titulo, valor], columna) => {
      const x = 36 + columna * 176;
      page.drawText(titulo, {
        x,
        y,
        size: 9,
        font: fontBold,
        color: COLOR_MUTED,
      });
      dibujarTextoAjustado(page, font, valor, x, y - 14, 160, 10);
    });
    y -= 42;
  }

  y -= 8;
  page.drawText("Resultados", {
    x: 36,
    y,
    size: 12,
    font: fontBold,
    color: COLOR_TEXTO,
  });
  y -= 18;

  y = filaTabla(
    page,
    fontBold,
    ["Parámetro", "Valor", "Unidad", "Mín", "Máx", "Desv.", "Estado"],
    y,
    24,
    COLOR_HEADER
  );

  for (const resultado of payload.resultados) {
    if (y < 70) {
      nuevaPagina();
      y = filaTabla(
        page,
        fontBold,
        ["Parámetro", "Valor", "Unidad", "Mín", "Máx", "Desv.", "Estado"],
        y,
        24,
        COLOR_HEADER
      );
    }

    const parametro = resultado.claveParametro
      ? `${resultado.nombreParametro} (${resultado.claveParametro})`
      : resultado.nombreParametro;
    y = filaTabla(
      page,
      font,
      [
        parametro,
        resultado.valor,
        resultado.unidadMedida || "-",
        resultado.limMin,
        resultado.limMax,
        resultado.desviacion,
        resultado.estado,
      ],
      y,
      32
    );
  }

  if (payload.observaciones) {
    if (y < 120) {
      nuevaPagina();
    }

    y -= 20;
    page.drawText("Observaciones", {
      x: 36,
      y,
      size: 12,
      font: fontBold,
      color: COLOR_TEXTO,
    });
    y -= 16;
    dibujarTextoAjustado(page, font, payload.observaciones, 36, y, 520, 10);
  }

  return await pdf.save();
}
