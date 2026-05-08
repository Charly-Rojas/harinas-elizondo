export type DireccionEstructurada = {
  calle: string;
  numero_exterior: string;
  numero_interior: string;
  colonia: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  pais: string;
};

export type DireccionEntregaCaptura = DireccionEstructurada & {
  etiqueta: string;
};

export const direccionVacia: DireccionEstructurada = {
  calle: "",
  numero_exterior: "",
  numero_interior: "",
  colonia: "",
  ciudad: "",
  estado: "",
  codigo_postal: "",
  pais: "Mexico",
};

export const direccionEntregaVacia: DireccionEntregaCaptura = {
  etiqueta: "",
  ...direccionVacia,
};

export function limpiarTexto(valor: unknown) {
  return String(valor ?? "").trim();
}

export function normalizarDireccionEntrada(
  entrada: Partial<DireccionEstructurada> | null | undefined
): DireccionEstructurada {
  return {
    calle: limpiarTexto(entrada?.calle),
    numero_exterior: limpiarTexto(entrada?.numero_exterior),
    numero_interior: limpiarTexto(entrada?.numero_interior),
    colonia: limpiarTexto(entrada?.colonia),
    ciudad: limpiarTexto(entrada?.ciudad),
    estado: limpiarTexto(entrada?.estado),
    codigo_postal: limpiarTexto(entrada?.codigo_postal),
    pais: limpiarTexto(entrada?.pais) || "Mexico",
  };
}

export function normalizarDireccionEntregaEntrada(
  entrada: Partial<DireccionEntregaCaptura> | null | undefined
): DireccionEntregaCaptura {
  return {
    etiqueta: limpiarTexto(entrada?.etiqueta),
    ...normalizarDireccionEntrada(entrada),
  };
}

export function direccionCompleta(direccion: Partial<DireccionEstructurada> | null | undefined) {
  const valor = normalizarDireccionEntrada(direccion);

  return Boolean(
    valor.calle &&
      valor.colonia &&
      valor.ciudad &&
      valor.estado &&
      valor.codigo_postal
  );
}

export function formatearDireccion(direccion: Partial<DireccionEstructurada> | null | undefined) {
  const valor = normalizarDireccionEntrada(direccion);
  const partes: string[] = [];

  if (valor.calle) {
    partes.push(
      valor.numero_exterior
        ? `${valor.calle} #${valor.numero_exterior}`
        : valor.calle
    );
  }

  if (valor.numero_interior) {
    partes.push(`Int #${valor.numero_interior}`);
  }

  if (valor.colonia) {
    partes.push(`Col. ${valor.colonia}`);
  }

  if (valor.ciudad) {
    partes.push(valor.ciudad);
  }

  if (valor.estado) {
    partes.push(valor.estado);
  }

  if (valor.codigo_postal) {
    partes.push(valor.codigo_postal);
  }

  if (valor.pais) {
    partes.push(valor.pais);
  }

  return partes.join(", ");
}

export function parsearDireccionLegacy(valor: string | null | undefined) {
  if (!valor) {
    return { ...direccionVacia };
  }

  const partes = valor.split(",").map((parte) => parte.trim());
  if (partes.length < 4) {
    return { ...direccionVacia, calle: valor };
  }

  let indice = 0;
  let calle = partes[indice] ?? "";
  let numero_exterior = "";
  const matchExterior = calle.match(/^(.+?)\s+#(.+)$/);

  if (matchExterior) {
    calle = matchExterior[1].trim();
    numero_exterior = matchExterior[2].trim();
  }

  indice += 1;

  let numero_interior = "";
  if (partes[indice]?.startsWith("Int #")) {
    numero_interior = partes[indice].substring(5).trim();
    indice += 1;
  }

  let colonia = "";
  if (partes[indice]?.startsWith("Col. ")) {
    colonia = partes[indice].substring(5).trim();
    indice += 1;
  } else {
    return { ...direccionVacia, calle: valor };
  }

  const ciudad = partes[indice++] ?? "";
  const estado = partes[indice++] ?? "";
  const codigo_postal = partes[indice++] ?? "";
  const pais = partes[indice++] ?? "Mexico";

  return normalizarDireccionEntrada({
    calle,
    numero_exterior,
    numero_interior,
    colonia,
    ciudad,
    estado,
    codigo_postal,
    pais,
  });
}
