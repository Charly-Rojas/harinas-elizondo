import type { NextRequest } from "next/server";
import { normalizarRespuestaPostalia } from "@/lib/postalia";

const CANDIDATOS_BASE = [
  "https://postalia.com.mx/api/codigo-postal",
  "https://postalia.com.mx/api/codigos-postales",
  "https://postalia.com.mx/api/sepomex/codigo-postal",
];

function construirHeaders(token: string) {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function intentarPostalia(token: string, codigo: string) {
  const candidatos = [
    ...(process.env.POSTALIA_BASE_URL?.trim()
      ? [process.env.POSTALIA_BASE_URL.trim()]
      : []),
    ...CANDIDATOS_BASE,
  ];

  for (const base of candidatos) {
    const urls = [`${base}/${codigo}`, `${base}?codigo_postal=${codigo}`];

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          headers: construirHeaders(token),
          cache: "no-store",
        });

        if (!response.ok) {
          continue;
        }

        const payload = await response.json();
        const normalizado = normalizarRespuestaPostalia(codigo, payload);

        if (normalizado) {
          return normalizado;
        }
      } catch {
        continue;
      }
    }
  }

  return null;
}

export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/postalia/codigo-postal/[codigo]">
) {
  const { codigo } = await ctx.params;
  const limpio = String(codigo ?? "").trim();

  if (!/^\d{5}$/.test(limpio)) {
    return Response.json(
      { error: "El codigo postal debe tener 5 digitos." },
      { status: 400 }
    );
  }

  const token = process.env.POSTALIA?.trim();

  if (!token) {
    return Response.json(
      { error: "POSTALIA no esta configurado en el servidor." },
      { status: 503 }
    );
  }

  const data = await intentarPostalia(token, limpio);

  if (!data) {
    return Response.json(
      { error: "No se encontro informacion para ese codigo postal." },
      { status: 404 }
    );
  }

  return Response.json(data, {
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}
