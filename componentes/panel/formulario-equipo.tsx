"use client";

import { useActionState } from "react";
import { Badge, Button } from "@radix-ui/themes";
import {
  crear_equipo,
  editar_equipo,
  type EstadoFormularioEquipo,
} from "@/app/(privado)/equipos/acciones";
import {
  obtenerValor,
  tieneErrorCampo,
} from "@/lib/form-state";
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

      {estado.formError ? (
        <div className="mt-5 rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {estado.formError}
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
              aria-invalid={tieneErrorCampo(estado.fieldErrors, "clave")}
              className="campo-formulario"
              defaultValue={obtenerValor(
                estado.values,
                "clave",
                equipo?.clave ?? ""
              )}
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
              aria-invalid={tieneErrorCampo(estado.fieldErrors, "tipo")}
              className="campo-formulario"
              defaultValue={obtenerValor(
                estado.values,
                "tipo",
                equipo?.tipo ?? "otro"
              )}
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
              defaultValue={obtenerValor(
                estado.values,
                "descripcion_corta",
                equipo?.descripcion_corta ?? ""
              )}
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
            aria-invalid={tieneErrorCampo(estado.fieldErrors, "descripcion_larga")}
            className="campo-formulario min-h-28 resize-y"
            defaultValue={obtenerValor(
              estado.values,
              "descripcion_larga",
              equipo?.descripcion_larga ?? ""
            )}
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
              defaultValue={obtenerValor(
                estado.values,
                "marca",
                equipo?.marca ?? ""
              )}
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
              defaultValue={obtenerValor(
                estado.values,
                "modelo",
                equipo?.modelo ?? ""
              )}
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
              defaultValue={obtenerValor(
                estado.values,
                "serie",
                equipo?.serie ?? ""
              )}
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
              defaultValue={obtenerValor(
                estado.values,
                "proveedor",
                equipo?.proveedor ?? ""
              )}
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
              aria-invalid={tieneErrorCampo(estado.fieldErrors, "fecha_adquisicion")}
              className="campo-formulario"
              defaultValue={obtenerValor(
                estado.values,
                "fecha_adquisicion",
                equipo?.fecha_adquisicion ?? ""
              )}
              name="fecha_adquisicion"
              type="date"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Garantía (meses)
            </span>
            <input
              aria-invalid={tieneErrorCampo(estado.fieldErrors, "garantia_meses")}
              className="campo-formulario"
              defaultValue={obtenerValor(
                estado.values,
                "garantia_meses",
                equipo?.garantia_meses?.toString() ?? ""
              )}
              min="0"
              name="garantia_meses"
              placeholder="24"
              type="number"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Vigencia de garantía
            </span>
            <input
              className="campo-formulario"
              defaultValue={obtenerValor(
                estado.values,
                "vigencia_garantia",
                equipo?.vigencia_garantia ?? ""
              )}
              disabled
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
              defaultValue={obtenerValor(
                estado.values,
                "ubicacion",
                equipo?.ubicacion ?? ""
              )}
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
              defaultValue={obtenerValor(
                estado.values,
                "responsable",
                equipo?.responsable ?? ""
              )}
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
              defaultValue={obtenerValor(
                estado.values,
                "mantenimiento",
                equipo?.mantenimiento ?? ""
              )}
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
