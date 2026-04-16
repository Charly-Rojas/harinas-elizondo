"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requiere_sesion } from "@/lib/autorizacion";
import { registrarAuditoria } from "@/lib/auditoria";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { OrigenLimites } from "@/lib/tipos-dominio";

export type EstadoFormularioInspeccion = {
  error?: string;
};

type ResultadoFormulario = {
  id_parametro: number;
  id_equipo: number | null;
  valor: number | null;
  observaciones: string | null;
};

function limpiar(valor: FormDataEntryValue | null) {
  return String(valor ?? "").trim();
}

function numeroOpcional(valor: string) {
  if (!valor) return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function parsearResultados(formData: FormData) {
  const bruto = limpiar(formData.get("resultados_json"));

  if (!bruto) {
    return {
      error: "Debes capturar al menos un resultado.",
      resultados: [] as ResultadoFormulario[],
    };
  }

  try {
    const datos = JSON.parse(bruto);

    if (!Array.isArray(datos)) {
      return {
        error: "El formato de resultados es inválido.",
        resultados: [] as ResultadoFormulario[],
      };
    }

    const resultados = datos
      .map((fila) => ({
        id_parametro: Number(limpiar(fila?.id_parametro)),
        id_equipo: numeroOpcional(limpiar(fila?.id_equipo)),
        valor: numeroOpcional(limpiar(fila?.valor)),
        observaciones: limpiar(fila?.observaciones) || null,
      }))
      .filter((fila) => fila.id_parametro && fila.valor !== null);

    if (!resultados.length) {
      return {
        error: "Debes capturar al menos un resultado válido.",
        resultados: [] as ResultadoFormulario[],
      };
    }

    const usados = new Set<number>();

    for (const resultado of resultados) {
      if (usados.has(resultado.id_parametro)) {
        return {
          error: "No puedes repetir el mismo parámetro en una inspección.",
          resultados: [] as ResultadoFormulario[],
        };
      }
      usados.add(resultado.id_parametro);
    }

    return { error: null, resultados };
  } catch {
    return {
      error: "No fue posible leer los resultados capturados.",
      resultados: [] as ResultadoFormulario[],
    };
  }
}

function evaluarResultado(
  valor: number | null,
  limMin: number | null,
  limMax: number | null
) {
  if (valor === null) {
    return {
      desviacion: null,
      dentro_especificacion: null as boolean | null,
    };
  }

  if (limMin !== null && valor < limMin) {
    return {
      desviacion: Number((valor - limMin).toFixed(4)),
      dentro_especificacion: false,
    };
  }

  if (limMax !== null && valor > limMax) {
    return {
      desviacion: Number((valor - limMax).toFixed(4)),
      dentro_especificacion: false,
    };
  }

  if (limMin !== null || limMax !== null) {
    return {
      desviacion: 0,
      dentro_especificacion: true,
    };
  }

  return {
    desviacion: null,
    dentro_especificacion: null as boolean | null,
  };
}

async function construirResultadosPersistencia(
  supabase: Awaited<ReturnType<typeof crearClienteServidor>>,
  idCliente: number | null,
  resultados: ResultadoFormulario[],
  usuarioId: string
) {
  const idsParametros = [...new Set(resultados.map((resultado) => resultado.id_parametro))];
  const idsEquipos = [
    ...new Set(
      resultados
        .map((resultado) => resultado.id_equipo)
        .filter((id): id is number => id !== null)
    ),
  ];

  const [{ data: parametros }, { data: refsCliente }, { data: equiposParametros }] =
    await Promise.all([
      supabase
        .from("parametros_calidad")
        .select("id_parametro, clave, unidad_medida")
        .in("id_parametro", idsParametros),
      idCliente
        ? supabase
            .from("param_ref_cliente")
            .select("clave_parametro, lim_min, lim_max")
            .eq("id_cliente", idCliente)
            .eq("activo", true)
        : Promise.resolve({ data: [] }),
      idsEquipos.length
        ? supabase
            .from("equipos_parametros")
            .select(
              "id_equipo, id_parametro, lim_min_internacional, lim_max_internacional"
            )
            .in("id_equipo", idsEquipos)
            .in("id_parametro", idsParametros)
        : Promise.resolve({ data: [] }),
    ]);

  const parametrosPorId = new Map(
    (parametros ?? []).map((parametro) => [parametro.id_parametro, parametro])
  );
  const refsPorClave = new Map(
    (refsCliente ?? []).map((ref) => [ref.clave_parametro, ref])
  );
  const equiposParametrosMap = new Map(
    (equiposParametros ?? []).map((fila) => [
      `${fila.id_equipo}:${fila.id_parametro}`,
      fila,
    ])
  );

  return resultados.map((resultado) => {
    const parametro = parametrosPorId.get(resultado.id_parametro);
    const refCliente = parametro ? refsPorClave.get(parametro.clave) : undefined;
    const refEquipo =
      resultado.id_equipo !== null
        ? equiposParametrosMap.get(`${resultado.id_equipo}:${resultado.id_parametro}`)
        : undefined;

    const lim_min_aplicado =
      refCliente?.lim_min ?? refEquipo?.lim_min_internacional ?? null;
    const lim_max_aplicado =
      refCliente?.lim_max ?? refEquipo?.lim_max_internacional ?? null;
    const origen_limites: OrigenLimites = refCliente
      ? "cliente"
      : refEquipo
        ? "internacional"
        : "interno";
    const evaluacion = evaluarResultado(
      resultado.valor,
      lim_min_aplicado,
      lim_max_aplicado
    );

    return {
      id_parametro: resultado.id_parametro,
      id_equipo: resultado.id_equipo,
      valor: resultado.valor,
      unidad_medida: parametro?.unidad_medida ?? null,
      lim_min_aplicado,
      lim_max_aplicado,
      origen_limites,
      desviacion: evaluacion.desviacion,
      dentro_especificacion: evaluacion.dentro_especificacion,
      observaciones: resultado.observaciones,
      capturado_por: usuarioId,
      actualizado_por: usuarioId,
    };
  });
}

async function siguienteSecuenciaLote(
  supabase: Awaited<ReturnType<typeof crearClienteServidor>>,
  idLote: number
) {
  const { data, error } = await supabase.rpc("siguiente_secuencia_inspeccion", {
    p_id_lote: idLote,
  });

  if (error) {
    throw error;
  }

  return data as string | null;
}

async function insertarResultadosInspeccion(
  supabase: Awaited<ReturnType<typeof crearClienteServidor>>,
  idInspeccion: number,
  idCliente: number | null,
  resultados: ResultadoFormulario[],
  usuarioId: string
) {
  const resultadosPersistencia = await construirResultadosPersistencia(
    supabase,
    idCliente,
    resultados,
    usuarioId
  );

  const { error } = await supabase.from("resultados_analisis").insert(
    resultadosPersistencia.map((resultado) => ({
      ...resultado,
      id_inspeccion: idInspeccion,
    }))
  );

  if (error) {
    throw error;
  }
}

export async function crear_inspeccion(
  _estado: EstadoFormularioInspeccion,
  formData: FormData
): Promise<EstadoFormularioInspeccion> {
  const usuario = await requiere_sesion();

  const id_lote = parseInt(limpiar(formData.get("id_lote")), 10);
  const id_cliente = numeroOpcional(limpiar(formData.get("id_cliente")));
  const observaciones = limpiar(formData.get("observaciones")) || null;

  if (!id_lote) {
    return { error: "Debes seleccionar un lote." };
  }

  const { error: errorResultados, resultados } = parsearResultados(formData);
  if (errorResultados) {
    return { error: errorResultados };
  }

  const supabase = await crearClienteServidor();

  let secuencia: string | null = null;

  try {
    secuencia = await siguienteSecuenciaLote(supabase, id_lote);
  } catch (errorSecuencia) {
    console.error("[inspecciones][secuencia]", errorSecuencia);
    return { error: "No fue posible calcular la secuencia de inspección." };
  }

  if (!secuencia) {
    return {
      error: "El lote ya alcanzó la secuencia máxima de inspecciones (Z).",
    };
  }

  const { data: inspeccion, error } = await supabase
    .from("inspecciones")
    .insert({
      id_lote,
      id_cliente,
      secuencia,
      tipo_origen: "medicion",
      es_ajuste: false,
      observaciones,
      status: "borrador",
      creada_por: usuario.usuario.id,
      actualizada_por: usuario.usuario.id,
    })
    .select("id_inspeccion")
    .single();

  if (error || !inspeccion) {
    console.error("[inspecciones][crear]", error);
    return { error: "No fue posible crear la inspección." };
  }

  try {
    await insertarResultadosInspeccion(
      supabase,
      inspeccion.id_inspeccion,
      id_cliente,
      resultados,
      usuario.usuario.id
    );
  } catch (errorResultadosInsert) {
    console.error("[inspecciones][resultados_crear]", errorResultadosInsert);
    return {
      error:
        "La inspección se creó, pero falló el guardado de resultados.",
    };
  }

  revalidatePath("/inspecciones");
  redirect("/inspecciones");
}

export async function editar_inspeccion(
  _estado: EstadoFormularioInspeccion,
  formData: FormData
): Promise<EstadoFormularioInspeccion> {
  const usuario = await requiere_sesion();

  const id_inspeccion = parseInt(limpiar(formData.get("id_inspeccion")), 10);
  const id_lote = parseInt(limpiar(formData.get("id_lote")), 10);
  const id_cliente = numeroOpcional(limpiar(formData.get("id_cliente")));
  const observaciones = limpiar(formData.get("observaciones")) || null;

  if (!id_inspeccion || !id_lote) {
    return { error: "Inspección inválida." };
  }

  const { error: errorResultados, resultados } = parsearResultados(formData);
  if (errorResultados) {
    return { error: errorResultados };
  }

  const supabase = await crearClienteServidor();

  const { data: inspeccionActual } = await supabase
    .from("inspecciones")
    .select("status")
    .eq("id_inspeccion", id_inspeccion)
    .maybeSingle();

  if (!inspeccionActual) {
    return { error: "No se encontró la inspección seleccionada." };
  }

  if (inspeccionActual.status !== "borrador") {
    return {
      error:
        "Solo se pueden editar inspecciones en borrador. Para corregir una inspección ya consolidada, crea un ajuste trazable.",
    };
  }

  const { error } = await supabase
    .from("inspecciones")
    .update({
      id_lote,
      id_cliente,
      observaciones,
      actualizada_por: usuario.usuario.id,
    })
    .eq("id_inspeccion", id_inspeccion);

  if (error) {
    console.error("[inspecciones][editar]", error);
    return { error: "No fue posible actualizar la inspección." };
  }

  try {
    await supabase
      .from("resultados_analisis")
      .delete()
      .eq("id_inspeccion", id_inspeccion);

    await insertarResultadosInspeccion(
      supabase,
      id_inspeccion,
      id_cliente,
      resultados,
      usuario.usuario.id
    );
  } catch (errorResultadosInsert) {
    console.error("[inspecciones][resultados_editar]", errorResultadosInsert);
    return {
      error:
        "La inspección se actualizó, pero falló la captura de resultados.",
    };
  }

  revalidatePath("/inspecciones");
  redirect("/inspecciones");
}

export async function crear_ajuste_inspeccion(
  _estado: EstadoFormularioInspeccion,
  formData: FormData
): Promise<EstadoFormularioInspeccion> {
  const usuario = await requiere_sesion();

  const id_inspeccion_base = parseInt(limpiar(formData.get("id_inspeccion_base")), 10);
  const id_lote = parseInt(limpiar(formData.get("id_lote")), 10);
  const id_cliente = numeroOpcional(limpiar(formData.get("id_cliente")));
  const motivo_ajuste = limpiar(formData.get("motivo_ajuste"));
  const observaciones = limpiar(formData.get("observaciones")) || null;

  if (!id_inspeccion_base || !id_lote) {
    return { error: "Debes seleccionar una inspección base válida." };
  }

  if (!motivo_ajuste) {
    return { error: "Debes capturar el motivo del ajuste." };
  }

  const { error: errorResultados, resultados } = parsearResultados(formData);
  if (errorResultados) {
    return { error: errorResultados };
  }

  const supabase = await crearClienteServidor();

  const { data: inspeccionBase } = await supabase
    .from("inspecciones")
    .select("id_inspeccion, id_lote, id_cliente, secuencia, status")
    .eq("id_inspeccion", id_inspeccion_base)
    .maybeSingle();

  if (!inspeccionBase) {
    return { error: "No se encontró la inspección base seleccionada." };
  }

  if (inspeccionBase.id_lote !== id_lote) {
    return { error: "El ajuste debe conservar el mismo lote de la inspección base." };
  }

  let secuencia: string | null = null;

  try {
    secuencia = await siguienteSecuenciaLote(supabase, id_lote);
  } catch (errorSecuencia) {
    console.error("[inspecciones][ajuste][secuencia]", errorSecuencia);
    return { error: "No fue posible calcular la secuencia del ajuste." };
  }

  if (!secuencia) {
    return {
      error: "El lote ya alcanzó la secuencia máxima de inspecciones (Z).",
    };
  }

  const { data: ajuste, error } = await supabase
    .from("inspecciones")
    .insert({
      id_lote,
      id_cliente,
      secuencia,
      tipo_origen: "ajuste",
      es_ajuste: true,
      id_inspeccion_base,
      motivo_ajuste,
      observaciones,
      status: "borrador",
      creada_por: usuario.usuario.id,
      actualizada_por: usuario.usuario.id,
    })
    .select("id_inspeccion")
    .single();

  if (error || !ajuste) {
    console.error("[inspecciones][ajuste][crear]", error);
    return { error: "No fue posible crear el ajuste." };
  }

  try {
    await insertarResultadosInspeccion(
      supabase,
      ajuste.id_inspeccion,
      id_cliente,
      resultados,
      usuario.usuario.id
    );

    await registrarAuditoria(supabase, {
      entidad: "inspecciones",
      entidadId: String(ajuste.id_inspeccion),
      accion: "crear_ajuste",
      descripcion: `Ajuste ${secuencia} creado sobre inspección ${inspeccionBase.secuencia}.`,
      motivo: motivo_ajuste,
      valoresAnteriores: {
        id_inspeccion_base,
        secuencia_base: inspeccionBase.secuencia,
        status_base: inspeccionBase.status,
      },
      valoresNuevos: {
        id_inspeccion: ajuste.id_inspeccion,
        secuencia,
        id_lote,
        id_cliente,
        resultados: resultados.length,
      },
      usuarioId: usuario.usuario.id,
    });
  } catch (errorResultadosInsert) {
    console.error("[inspecciones][ajuste][resultados]", errorResultadosInsert);
    return {
      error: "El ajuste se creó, pero falló el guardado de resultados.",
    };
  }

  revalidatePath("/inspecciones");
  redirect("/inspecciones");
}
