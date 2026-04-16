"use client";

import { useActionState, useMemo, useState } from "react";
import { Badge, Button } from "@radix-ui/themes";
import {
  crear_equipo,
  editar_equipo,
  type EstadoFormularioEquipo,
} from "@/app/(privado)/equipos/acciones";
import type {
  EquipoConRelaciones,
  ParametroCalidad,
  TipoEquipo,
} from "@/lib/tipos-dominio";

const estadoInicial: EstadoFormularioEquipo = {};

type AsociacionEquipoFila = {
  id_parametro: string;
  desviacion_permitida: string;
  lim_min_internacional: string;
  lim_max_internacional: string;
  especificacion_interna: string;
};

type OpcionParametro = Pick<ParametroCalidad, "id_parametro" | "clave" | "nombre" | "activo">;

const tiposEquipo: Array<{ valor: TipoEquipo; etiqueta: string }> = [
  { valor: "alveografo", etiqueta: "Alveógrafo" },
  { valor: "farinografo", etiqueta: "Farinógrafo" },
  { valor: "otro", etiqueta: "Otro" },
];

export function FormularioEquipo({
  equipo,
  onCancelar,
  parametrosDisponibles,
}: {
  equipo?: EquipoConRelaciones;
  onCancelar: () => void;
  parametrosDisponibles: OpcionParametro[];
}) {
  const esEdicion = Boolean(equipo);
  const accion = esEdicion ? editar_equipo : crear_equipo;
  const [estado, ejecutar] = useActionState(accion, estadoInicial);
  const asociacionesIniciales = useMemo<AsociacionEquipoFila[]>(
    () =>
      equipo?.equipos_parametros?.length
        ? equipo.equipos_parametros.map((asociacion) => ({
            id_parametro: String(asociacion.id_parametro),
            desviacion_permitida:
              asociacion.desviacion_permitida?.toString() ?? "",
            lim_min_internacional:
              asociacion.lim_min_internacional?.toString() ?? "",
            lim_max_internacional:
              asociacion.lim_max_internacional?.toString() ?? "",
            especificacion_interna: asociacion.especificacion_interna ?? "",
          }))
        : [],
    [equipo]
  );
  const [asociaciones, setAsociaciones] = useState<AsociacionEquipoFila[]>(
    asociacionesIniciales
  );

  function actualizarFila(
    indice: number,
    campo: keyof AsociacionEquipoFila,
    valor: string
  ) {
    setAsociaciones((actuales) =>
      actuales.map((fila, i) =>
        i === indice ? { ...fila, [campo]: valor } : fila
      )
    );
  }

  function agregarFila() {
    setAsociaciones((actuales) => [
      ...actuales,
      {
        id_parametro: "",
        desviacion_permitida: "",
        lim_min_internacional: "",
        lim_max_internacional: "",
        especificacion_interna: "",
      },
    ]);
  }

  function eliminarFila(indice: number) {
    setAsociaciones((actuales) => actuales.filter((_, i) => i !== indice));
  }

  return (
    <article className="tarjeta-suave rounded-[28px] p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {esEdicion ? "Editar equipo" : "Nuevo equipo"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Captura datos generales del equipo y su configuración base de
            parámetros.
          </p>
        </div>
        <Badge color="jade" radius="full" size="2" variant="soft">
          {esEdicion ? "Edición" : "Alta"}
        </Badge>
      </div>

      {estado.error ? (
        <div className="mt-5 rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {estado.error}
        </div>
      ) : null}

      <form action={ejecutar} className="mt-6 space-y-4">
        <input
          name="asociaciones_json"
          type="hidden"
          value={JSON.stringify(asociaciones)}
        />

        {esEdicion ? (
          <input name="id_equipo" type="hidden" value={equipo!.id_equipo} />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Clave
            </span>
            <input
              className="campo-formulario"
              defaultValue={equipo?.clave ?? ""}
              name="clave"
              placeholder="EQL-ALV-01"
              required
              style={{ textTransform: "uppercase" }}
              type="text"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Tipo de equipo
            </span>
            <select
              className="campo-formulario"
              defaultValue={equipo?.tipo ?? "otro"}
              name="tipo"
            >
              {tiposEquipo.map((tipo) => (
                <option key={tipo.valor} value={tipo.valor}>
                  {tipo.etiqueta}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Descripción corta
            </span>
            <input
              className="campo-formulario"
              defaultValue={equipo?.descripcion_corta ?? ""}
              name="descripcion_corta"
              placeholder="Alveógrafo principal"
              type="text"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-600">
            Descripción larga
          </span>
          <textarea
            className="campo-formulario min-h-28 resize-y"
            defaultValue={equipo?.descripcion_larga ?? ""}
            name="descripcion_larga"
            placeholder="Equipo para análisis reológico de harina y masa."
            required
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Marca
            </span>
            <input
              className="campo-formulario"
              defaultValue={equipo?.marca ?? ""}
              name="marca"
              placeholder="Chopin"
              type="text"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Modelo
            </span>
            <input
              className="campo-formulario"
              defaultValue={equipo?.modelo ?? ""}
              name="modelo"
              placeholder="AlveoLab"
              type="text"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Serie
            </span>
            <input
              className="campo-formulario"
              defaultValue={equipo?.serie ?? ""}
              name="serie"
              placeholder="ALV-2450"
              type="text"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Proveedor
            </span>
            <input
              className="campo-formulario"
              defaultValue={equipo?.proveedor ?? ""}
              name="proveedor"
              placeholder="Tecnosa"
              type="text"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Fecha de adquisición
            </span>
            <input
              className="campo-formulario"
              defaultValue={equipo?.fecha_adquisicion ?? ""}
              name="fecha_adquisicion"
              type="date"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Garantía
            </span>
            <input
              className="campo-formulario"
              defaultValue={equipo?.garantia ?? ""}
              name="garantia"
              placeholder="24 meses"
              type="text"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Vigencia de garantía
            </span>
            <input
              className="campo-formulario"
              defaultValue={equipo?.vigencia_garantia ?? ""}
              name="vigencia_garantia"
              type="date"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Ubicación
            </span>
            <input
              className="campo-formulario"
              defaultValue={equipo?.ubicacion ?? ""}
              name="ubicacion"
              placeholder="Laboratorio central"
              type="text"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Responsable
            </span>
            <input
              className="campo-formulario"
              defaultValue={equipo?.responsable ?? ""}
              name="responsable"
              placeholder="Jefe de laboratorio"
              type="text"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Mantenimiento
            </span>
            <input
              className="campo-formulario"
              defaultValue={equipo?.mantenimiento ?? ""}
              name="mantenimiento"
              placeholder="Calibración trimestral"
              type="text"
            />
          </label>
        </div>

        <section className="rounded-[24px] border border-slate-200/80 bg-white/70 p-4 md:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Parámetros asociados
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Define qué parámetros mide el equipo y sus límites base.
              </p>
            </div>
            <Button onClick={agregarFila} size="2" type="button" variant="soft">
              + Asociar parámetro
            </Button>
          </div>

          {asociaciones.length === 0 ? (
            <div className="mt-4 rounded-[18px] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-500">
              Aún no hay parámetros asociados a este equipo.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {asociaciones.map((asociacion, indice) => (
                <div
                  className="rounded-[20px] border border-slate-200/80 bg-white p-4"
                  key={`${asociacion.id_parametro}-${indice}`}
                >
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <label className="block">
                      <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                        Parámetro
                      </span>
                      <select
                        className="campo-formulario"
                        onChange={(event) =>
                          actualizarFila(indice, "id_parametro", event.target.value)
                        }
                        value={asociacion.id_parametro}
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
                        Desviación
                      </span>
                      <input
                        className="campo-formulario"
                        onChange={(event) =>
                          actualizarFila(
                            indice,
                            "desviacion_permitida",
                            event.target.value
                          )
                        }
                        placeholder="0.5000"
                        step="0.0001"
                        type="number"
                        value={asociacion.desviacion_permitida}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                        Límite mínimo
                      </span>
                      <input
                        className="campo-formulario"
                        onChange={(event) =>
                          actualizarFila(
                            indice,
                            "lim_min_internacional",
                            event.target.value
                          )
                        }
                        placeholder="180"
                        step="0.0001"
                        type="number"
                        value={asociacion.lim_min_internacional}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                        Límite máximo
                      </span>
                      <input
                        className="campo-formulario"
                        onChange={(event) =>
                          actualizarFila(
                            indice,
                            "lim_max_internacional",
                            event.target.value
                          )
                        }
                        placeholder="240"
                        step="0.0001"
                        type="number"
                        value={asociacion.lim_max_internacional}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                        Especificación interna
                      </span>
                      <div className="flex gap-2">
                        <input
                          className="campo-formulario"
                          onChange={(event) =>
                            actualizarFila(
                              indice,
                              "especificacion_interna",
                              event.target.value
                            )
                          }
                          placeholder="Norma interna FHESA"
                          type="text"
                          value={asociacion.especificacion_interna}
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
            {esEdicion ? "Guardar cambios" : "Registrar equipo"}
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
