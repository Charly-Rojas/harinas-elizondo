export type RespuestaPostalia = {
  codigo_postal: string;
  ciudad: string;
  estado: string;
  colonias: string[];
};

function limpiarTexto(valor: unknown) {
  return String(valor ?? "").trim();
}

function asArray(valor: unknown) {
  return Array.isArray(valor) ? valor : [];
}

export function normalizarRespuestaPostalia(
  codigoPostal: string,
  payload: unknown
): RespuestaPostalia | null {
  const raiz =
    (payload &&
      typeof payload === "object" &&
      "data" in payload &&
      Array.isArray((payload as { data?: unknown[] }).data)
      ? (payload as { data: unknown[] }).data[0]
      : null) ||
    (Array.isArray(payload) ? payload[0] : payload);

  if (!raiz || typeof raiz !== "object") {
    return null;
  }

  const registro = raiz as Record<string, unknown>;
  const ciudad =
    limpiarTexto(registro.ciudad) ||
    limpiarTexto(registro.municipio) ||
    limpiarTexto(registro.alcaldia);
  const estado = limpiarTexto(registro.estado);
  const coloniasCrudas =
    asArray(registro.colonias).length > 0
      ? asArray(registro.colonias)
      : asArray(registro.asentamientos);

  const colonias = coloniasCrudas
    .map((item) =>
      typeof item === "string"
        ? item
        : limpiarTexto((item as Record<string, unknown>).nombre)
    )
    .map(limpiarTexto)
    .filter(Boolean);

  if (!ciudad && !estado && colonias.length === 0) {
    return null;
  }

  return {
    codigo_postal: codigoPostal,
    ciudad,
    estado,
    colonias,
  };
}
