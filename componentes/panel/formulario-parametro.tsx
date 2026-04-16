"use client";

import { useActionState } from "react";
import { Badge, Button } from "@radix-ui/themes";
import {
  crear_parametro,
  editar_parametro,
  type EstadoFormularioParametro,
} from "@/app/(privado)/parametros/acciones";
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

      {estado.error ? (
        <div className="mt-5 rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {estado.error}
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
              className="campo-formulario"
              defaultValue={parametro?.clave ?? ""}
              name="clave"
              placeholder="ALV_W"
              required
              style={{ textTransform: "uppercase" }}
              type="text"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Nombre
            </span>
            <input
              className="campo-formulario"
              defaultValue={parametro?.nombre ?? ""}
              name="nombre"
              placeholder="Fuerza panadera"
              required
              type="text"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Unidad de medida
            </span>
            <input
              className="campo-formulario"
              defaultValue={parametro?.unidad_medida ?? ""}
              name="unidad_medida"
              placeholder="W"
              type="text"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Equipo de origen
            </span>
            <select
              className="campo-formulario"
              defaultValue={parametro?.equipo_origen ?? "otro"}
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
              defaultValue={parametro?.descripcion ?? ""}
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
