"use client";

import { useActionState } from "react";
import { Badge, Button } from "@radix-ui/themes";
import {
  crear_equipo,
  editar_equipo,
  type EstadoFormularioEquipo,
} from "@/app/(privado)/equipos/acciones";
import type {
  EquipoConRelaciones,
  TipoEquipo,
} from "@/lib/tipos-dominio";

const estadoInicial: EstadoFormularioEquipo = {};

const tiposEquipo: Array<{ valor: TipoEquipo; etiqueta: string }> = [
  { valor: "alveografo", etiqueta: "Alveógrafo" },
  { valor: "farinografo", etiqueta: "Farinógrafo" },
  { valor: "otro", etiqueta: "Otro" },
];

export function FormularioEquipo({
  equipo,
  onCancelar,
}: {
  equipo?: EquipoConRelaciones;
  onCancelar: () => void;
}) {
  const esEdicion = Boolean(equipo);
  const accion = esEdicion ? editar_equipo : crear_equipo;
  const [estado, ejecutar] = useActionState(accion, estadoInicial);

  return (
    <article className="tarjeta-suave rounded-[28px] p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {esEdicion ? "Editar equipo" : "Nuevo equipo"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Captura los datos generales del equipo.
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
