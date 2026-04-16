"use client";

import { useActionState, useMemo, useState } from "react";
import { Badge, Button } from "@radix-ui/themes";
import {
  crear_ajuste_inspeccion,
  crear_inspeccion,
  editar_inspeccion,
  type EstadoFormularioInspeccion,
} from "@/app/(privado)/inspecciones/acciones";
import type {
  EquipoConRelaciones,
  InspeccionConRelaciones,
  LoteConRelaciones,
  ParametroCalidad,
} from "@/lib/tipos-dominio";
import type { Cliente } from "@/lib/tipos-clientes";

const estadoInicial: EstadoFormularioInspeccion = {};

type ClienteLigero = Pick<Cliente, "id_cliente" | "nombre" | "solicita_certificado">;
type ResultadoFila = {
  id_parametro: string;
  id_equipo: string;
  valor: string;
  observaciones: string;
  dentro_especificacion?: boolean | null;
};

export function FormularioInspeccion({
  inspeccion,
  inspeccionBase,
  onCancelar,
  lotesDisponibles,
  clientesDisponibles,
  equiposDisponibles,
  parametrosDisponibles,
}: {
  inspeccion?: InspeccionConRelaciones;
  inspeccionBase?: InspeccionConRelaciones;
  onCancelar: () => void;
  lotesDisponibles: LoteConRelaciones[];
  clientesDisponibles: ClienteLigero[];
  equiposDisponibles: EquipoConRelaciones[];
  parametrosDisponibles: ParametroCalidad[];
}) {
  const modo = inspeccion ? "editar" : inspeccionBase ? "ajuste" : "crear";
  const esEdicion = modo === "editar";
  const esAjuste = modo === "ajuste";
  const origen = inspeccion ?? inspeccionBase;
  const accion =
    modo === "editar"
      ? editar_inspeccion
      : modo === "ajuste"
        ? crear_ajuste_inspeccion
        : crear_inspeccion;
  const [estado, ejecutar] = useActionState(accion, estadoInicial);
  const resultadosIniciales = useMemo<ResultadoFila[]>(
    () =>
      origen?.resultados_analisis?.length
        ? origen.resultados_analisis.map((resultado) => ({
            id_parametro: String(resultado.id_parametro),
            id_equipo: resultado.id_equipo ? String(resultado.id_equipo) : "",
            valor: resultado.valor?.toString() ?? "",
            observaciones: resultado.observaciones ?? "",
            dentro_especificacion: resultado.dentro_especificacion,
          }))
        : [],
    [origen]
  );
  const [resultados, setResultados] = useState<ResultadoFila[]>(resultadosIniciales);

  function actualizarFila(
    indice: number,
    campo: keyof ResultadoFila,
    valor: string
  ) {
    setResultados((actuales) =>
      actuales.map((fila, i) =>
        i === indice ? { ...fila, [campo]: valor } : fila
      )
    );
  }

  function agregarFila() {
    setResultados((actuales) => [
      ...actuales,
      {
        id_parametro: "",
        id_equipo: "",
        valor: "",
        observaciones: "",
      },
    ]);
  }

  function eliminarFila(indice: number) {
    setResultados((actuales) => actuales.filter((_, i) => i !== indice));
  }

  return (
    <article className="tarjeta-suave rounded-[28px] p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {esEdicion
              ? "Editar inspección"
              : esAjuste
                ? "Nuevo ajuste trazable"
                : "Nueva inspección"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {esAjuste
              ? "Crea una nueva inspección derivada sin sobrescribir la original y conserva el motivo del ajuste."
              : "Registra el análisis del lote, captura resultados por parámetro y compara contra límites disponibles."}
          </p>
        </div>
        <Badge color="violet" radius="full" size="2" variant="soft">
          {esEdicion
            ? `Secuencia ${inspeccion?.secuencia ?? "-"}`
            : esAjuste
              ? `Ajuste sobre ${inspeccionBase?.secuencia ?? "-"}`
              : "Secuencia automática"}
        </Badge>
      </div>

      {estado.error ? (
        <div className="mt-5 rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {estado.error}
        </div>
      ) : null}

      <form action={ejecutar} className="mt-6 space-y-4">
        <input
          name="resultados_json"
          type="hidden"
          value={JSON.stringify(resultados)}
        />

        {esEdicion ? (
          <input
            name="id_inspeccion"
            type="hidden"
            value={inspeccion!.id_inspeccion}
          />
        ) : null}

        {esAjuste ? (
          <input
            name="id_inspeccion_base"
            type="hidden"
            value={inspeccionBase!.id_inspeccion}
          />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Lote
            </span>
            <select
              className="campo-formulario"
              defaultValue={origen?.id_lote ?? ""}
              name="id_lote"
              required
            >
              <option value="">Selecciona un lote</option>
              {lotesDisponibles.map((lote) => (
                <option key={lote.id_lote} value={lote.id_lote}>
                  {lote.numero_lote} - {lote.productos?.nombre || lote.variedad || "Sin producto"}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Cliente
            </span>
            <select
              className="campo-formulario"
              defaultValue={origen?.id_cliente ?? ""}
              name="id_cliente"
            >
              <option value="">Sin cliente asociado</option>
              {clientesDisponibles.map((cliente) => (
                <option key={cliente.id_cliente} value={cliente.id_cliente}>
                  {cliente.id_cliente} - {cliente.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="block xl:col-span-1 md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Observaciones
            </span>
            <textarea
              className="campo-formulario min-h-28 resize-y"
              defaultValue={origen?.observaciones ?? ""}
              name="observaciones"
              placeholder="Contexto del análisis, notas del lote o condiciones especiales."
            />
          </label>
        </div>

        {esAjuste ? (
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Motivo del ajuste
            </span>
            <textarea
              className="campo-formulario min-h-24 resize-y"
              defaultValue={inspeccionBase?.motivo_ajuste ?? ""}
              name="motivo_ajuste"
              placeholder="Explica por qué se corrige o repite el análisis y qué cambió respecto a la inspección base."
              required
            />
          </label>
        ) : null}

        <section className="rounded-[24px] border border-slate-200/80 bg-white/70 p-4 md:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Resultados del análisis
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Cada fila corresponde a un parámetro medido en el lote.
              </p>
            </div>
            <Button onClick={agregarFila} size="2" type="button" variant="soft">
              + Agregar resultado
            </Button>
          </div>

          {resultados.length === 0 ? (
            <div className="mt-4 rounded-[18px] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-500">
              Aún no has capturado resultados para esta inspección.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {resultados.map((resultado, indice) => (
                <div
                  className={`rounded-[20px] border p-4 ${
                    resultado.dentro_especificacion === false
                      ? "border-red-200 bg-red-50/70"
                      : resultado.dentro_especificacion === true
                        ? "border-emerald-200 bg-emerald-50/70"
                        : "border-slate-200/80 bg-white"
                  }`}
                  key={`${resultado.id_parametro}-${indice}`}
                >
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <label className="block">
                      <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                        Parámetro
                      </span>
                      <select
                        className="campo-formulario"
                        onChange={(event) =>
                          actualizarFila(indice, "id_parametro", event.target.value)
                        }
                        value={resultado.id_parametro}
                      >
                        <option value="">Selecciona un parámetro</option>
                        {parametrosDisponibles.map((parametro) => (
                          <option
                            key={parametro.id_parametro}
                            value={parametro.id_parametro}
                          >
                            {parametro.clave} - {parametro.nombre}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                        Equipo
                      </span>
                      <select
                        className="campo-formulario"
                        onChange={(event) =>
                          actualizarFila(indice, "id_equipo", event.target.value)
                        }
                        value={resultado.id_equipo}
                      >
                        <option value="">Sin equipo específico</option>
                        {equiposDisponibles.map((equipo) => (
                          <option key={equipo.id_equipo} value={equipo.id_equipo}>
                            {equipo.clave} -{" "}
                            {equipo.descripcion_corta || equipo.descripcion_larga}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                        Valor
                      </span>
                      <input
                        className="campo-formulario"
                        onChange={(event) =>
                          actualizarFila(indice, "valor", event.target.value)
                        }
                        placeholder="0.0000"
                        step="0.0001"
                        type="number"
                        value={resultado.valor}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                        Observaciones
                      </span>
                      <div className="flex gap-2">
                        <input
                          className="campo-formulario"
                          onChange={(event) =>
                            actualizarFila(
                              indice,
                              "observaciones",
                              event.target.value
                            )
                          }
                          placeholder="Notas del resultado"
                          type="text"
                          value={resultado.observaciones}
                        />
                        <Button
                          color="red"
                          onClick={() => eliminarFila(indice)}
                          type="button"
                          variant="soft"
                        >
                          Quitar
                        </Button>
                      </div>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button size="3" type="submit">
            {esEdicion
              ? "Guardar cambios"
              : esAjuste
                ? "Registrar ajuste"
                : "Registrar inspección"}
          </Button>
          <Button
            color="gray"
            onClick={onCancelar}
            size="3"
            type="button"
            variant="soft"
          >
            Cancelar
          </Button>
        </div>
      </form>
    </article>
  );
}
