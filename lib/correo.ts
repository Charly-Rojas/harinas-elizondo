import "server-only";

import nodemailer from "nodemailer";

type CorreoCertificadoPayload = {
  folio: string;
  cliente: string;
  lote: string;
  secuencia: string;
  destinatarios: string[];
  numeroFactura?: string | null;
  fechaEnvio?: string | null;
  totalResultados: number;
  fueraEspecificacion: number;
  pdfNombre?: string | null;
  pdfContenido?: Uint8Array | null;
};

function limpiarCorreo(valor?: string | null) {
  return String(valor ?? "").trim().toLowerCase();
}

function obtenerTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "465");
  const secure = process.env.SMTP_SECURE !== "false";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

export function correoConfigurado() {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  );
}

export function normalizarDestinatarios(destinatarios: Array<string | null | undefined>) {
  return [...new Set(destinatarios.map(limpiarCorreo).filter(Boolean))];
}

export async function verificarCorreo() {
  const transporter = obtenerTransporter();

  if (!transporter) {
    throw new Error("SMTP no configurado.");
  }

  await transporter.verify();
}

export async function enviarCorreoCertificado(
  payload: CorreoCertificadoPayload
) {
  const transporter = obtenerTransporter();

  if (!transporter) {
    return {
      enviado: false,
      razon: "SMTP no configurado.",
    };
  }

  if (!payload.destinatarios.length) {
    return {
      enviado: false,
      razon: "No hay destinatarios configurados.",
    };
  }

  const subject = `Certificado ${payload.folio} - ${payload.cliente}`;
  const resumenResultados =
    payload.fueraEspecificacion > 0
      ? `${payload.fueraEspecificacion} resultado(s) fuera de especificación`
      : "Todos los resultados se encuentran dentro de especificación o sin límite aplicable";

  const text = [
    `Se emitió el certificado ${payload.folio}.`,
    `Cliente: ${payload.cliente}`,
    `Lote: ${payload.lote}`,
    `Inspección: ${payload.secuencia}`,
    payload.numeroFactura ? `Factura: ${payload.numeroFactura}` : null,
    payload.fechaEnvio ? `Fecha de envío: ${payload.fechaEnvio}` : null,
    `Resultados capturados: ${payload.totalResultados}`,
    `Cumplimiento: ${resumenResultados}`,
    "",
    "El certificado ya se encuentra disponible en el sistema para su consulta e impresión.",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
      <h2 style="margin-bottom: 8px;">Certificado emitido: ${payload.folio}</h2>
      <p style="margin-top: 0;">Se generó un nuevo certificado de calidad para consulta e impresión.</p>
      <table style="border-collapse: collapse; width: 100%; max-width: 560px;">
        <tbody>
          <tr><td style="padding: 6px 0; font-weight: 600;">Cliente</td><td style="padding: 6px 0;">${payload.cliente}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600;">Lote</td><td style="padding: 6px 0;">${payload.lote}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600;">Inspección</td><td style="padding: 6px 0;">${payload.secuencia}</td></tr>
          ${
            payload.numeroFactura
              ? `<tr><td style="padding: 6px 0; font-weight: 600;">Factura</td><td style="padding: 6px 0;">${payload.numeroFactura}</td></tr>`
              : ""
          }
          ${
            payload.fechaEnvio
              ? `<tr><td style="padding: 6px 0; font-weight: 600;">Fecha de envío</td><td style="padding: 6px 0;">${payload.fechaEnvio}</td></tr>`
              : ""
          }
          <tr><td style="padding: 6px 0; font-weight: 600;">Resultados</td><td style="padding: 6px 0;">${payload.totalResultados}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: 600;">Cumplimiento</td><td style="padding: 6px 0;">${resumenResultados}</td></tr>
        </tbody>
      </table>
      <p style="margin-top: 20px;">El certificado ya se encuentra disponible en el sistema para su consulta e impresión.</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: payload.destinatarios.join(", "),
    subject,
    text,
    html,
    attachments:
      payload.pdfNombre && payload.pdfContenido
        ? [
            {
              filename: payload.pdfNombre,
              content: Buffer.from(payload.pdfContenido),
              contentType: "application/pdf",
            },
          ]
        : [],
  });

  return {
    enviado: true,
    razon: null,
  };
}
