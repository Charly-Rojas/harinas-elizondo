"use client";

import { useActionState } from "react";
import { Badge, Button } from "@radix-ui/themes";
import {
  crear_parametro,
  editar_parametro,
  type EstadoFormularioParametro,
} from "@/app/(privado)/parametros/acciones";
import {
  obtenerErrorCampo,
  obtenerValor,
  tieneErrorCampo,
} from "@/lib/form-state";
import type { ParametroCalidad } from "@/lib/tipos-dominio";

const estadoInicial: EstadoFormularioParametro = {};

export function FormularioParametro({
  onCancelar,
  parametro,
}: {
  onCancelar: () => void;
  parametro?: ParametroCalidad;
}) {
  const esEdicion = Boolean(parametro);
  const accion = esEdicion ? editar_parametro : crear_parametro;
  const [estado, ejecutar] = useActionState(accion, estadoInicial);

  return (
    <article className="tarjeta-suave rounded-[28px] p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {esEdicion ? "Editar parámetro" : "Nuevo parámetro"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Define factores de calidad, su unidad de medida y el equipo de
            origen asociado.
          </p>
        </div>
        <Badge color="amber" radius="full" size="2" variant="soft">
          {esEdicion ? "Edición" : "Alta"}
        </Badge>
      </div>

      {estado.formError ? (
        <div className="mt-5 rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {estado.formError}
        </div>
      ) : null}

      <form action={ejecutar} className="mt-6 space-y-4">
        {esEdicion ? (
          <input
            name="id_parametro"
            type="hidden"
            value={parametro!.id_parametro}
          />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Clave
            </span>
            <input
              aria-invalid={tieneErrorCampo(estado.fieldErrors, "clave")}
              className="campo-formulario"
              defaultValue={obtenerValor(
                estado.values,
                "clave",
                parametro?.clave ?? ""
              )}
              name="clave"
              placeholder="ALV_W"
              required
              style={{ textTransform: "uppercase" }}
              type="text"
            />
            {obtenerErrorCampo(estado.fieldErrors, "clave") ? (
              <span className="mt-2 block text-xs text-red-600">
                {obtenerErrorCampo(estado.fieldErrors, "clave")}
              </span>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Nombre
            </span>
            <input
              aria-invalid={tieneErrorCampo(estado.fieldErrors, "nombre")}
              className="campo-formulario"
              defaultValue={obtenerValor(
                estado.values,
                "nombre",
                parametro?.nombre ?? ""
              )}
              name="nombre"
              placeholder="Fuerza panadera"
              required
              type="text"
            />
            {obtenerErrorCampo(estado.fieldErrors, "nombre") ? (
              <span className="mt-2 block text-xs text-red-600">
                {obtenerErrorCampo(estado.fieldErrors, "nombre")}
              </span>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Unidad de medida
            </span>
            <input
              className="campo-formulario"
              defaultValue={obtenerValor(
                estado.values,
                "unidad_medida",
                parametro?.unidad_medida ?? ""
              )}
              name="unidad_medida"
              placeholder="W"
              type="text"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Límite mínimo global
            </span>
            <input
              aria-invalid={tieneErrorCampo(estado.fieldErrors, "lim_min_global")}
              className="campo-formulario"
              defaultValue={obtenerValor(
                estado.values,
                "lim_min_global",
                parametro?.lim_min_global?.toString() ?? ""
              )}
              name="lim_min_global"
              placeholder="0.0000"
              step="0.0001"
              type="number"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Límite máximo global
            </span>
            <input
              aria-invalid={tieneErrorCampo(estado.fieldErrors, "lim_max_global")}
              className="campo-formulario"
              defaultValue={obtenerValor(
                estado.values,
                "lim_max_global",
                parametro?.lim_max_global?.toString() ?? ""
              )}
              name="lim_max_global"
              placeholder="0.0000"
              step="0.0001"
              type="number"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Equipo de origen
            </span>
            <select
              aria-invalid={tieneErrorCampo(estado.fieldErrors, "equipo_origen")}
              className="campo-formulario"
              defaultValue={obtenerValor(
                estado.values,
                "equipo_origen",
                parametro?.equipo_origen ?? "otro"
              )}
              name="equipo_origen"
            >
              <option value="alveografo">Alveógrafo</option>
              <option value="farinografo">Farinógrafo</option>
              <option value="otro">Otro</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Descripción
            </span>
            <textarea
              className="campo-formulario min-h-28 resize-y"
              defaultValue={obtenerValor(
                estado.values,
                "descripcion",
                parametro?.descripcion ?? ""
              )}
              name="descripcion"
              placeholder="Contexto operativo del parámetro y cómo se interpreta."
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button size="3" type="submit">
            {esEdicion ? "Guardar cambios" : "Registrar parámetro"}
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
