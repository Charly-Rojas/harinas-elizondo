"use client";

import { useActionState } from "react";
import { Badge, Button } from "@radix-ui/themes";
import {
  crear_lote,
  editar_lote,
  type EstadoFormularioLote,
} from "@/app/(privado)/lotes/acciones";
import type { LoteConRelaciones, ProductoLigero } from "@/lib/tipos-dominio";

const estadoInicial: EstadoFormularioLote = {};

export function FormularioLote({
  lote,
  onCancelar,
  productosDisponibles,
}: {
  lote?: LoteConRelaciones;
  onCancelar: () => void;
  productosDisponibles: ProductoLigero[];
}) {
  const esEdicion = Boolean(lote);
  const accion = esEdicion ? editar_lote : crear_lote;
  const [estado, ejecutar] = useActionState(accion, estadoInicial);

  return (
    <article className="tarjeta-suave rounded-[28px] p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {esEdicion ? "Editar lote" : "Nuevo lote"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Registra el lote de producción que servirá como base para las
            inspecciones del laboratorio.
          </p>
        </div>
        <Badge color="blue" radius="full" size="2" variant="soft">
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
          <input name="id_lote" type="hidden" value={lote!.id_lote} />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Número de lote
            </span>
            <input
              className="campo-formulario"
              defaultValue={lote?.numero_lote ?? ""}
              name="numero_lote"
              placeholder="L-2026-0001"
              required
              style={{ textTransform: "uppercase" }}
              type="text"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Producto
            </span>
            <select
              className="campo-formulario"
              defaultValue={lote?.id_producto ?? ""}
              name="id_producto"
            >
              <option value="">Sin producto asignado</option>
              {productosDisponibles.map((producto) => (
                <option key={producto.id_producto} value={producto.id_producto}>
                  {producto.clave} - {producto.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Variedad
            </span>
            <input
              className="campo-formulario"
              defaultValue={lote?.variedad ?? ""}
              name="variedad"
              placeholder="Harina 000"
              type="text"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Fecha de producción
            </span>
            <input
              className="campo-formulario"
              defaultValue={lote?.fecha_produccion ?? ""}
              name="fecha_produccion"
              type="date"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Fecha de caducidad
            </span>
            <input
              className="campo-formulario"
              defaultValue={lote?.fecha_caducidad ?? ""}
              name="fecha_caducidad"
              type="date"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-600">
            Observaciones
          </span>
          <textarea
            className="campo-formulario min-h-28 resize-y"
            defaultValue={lote?.observaciones ?? ""}
            name="observaciones"
            placeholder="Datos relevantes del lote, contexto de producción o notas del laboratorio."
          />
        </label>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button size="3" type="submit">
            {esEdicion ? "Guardar cambios" : "Registrar lote"}
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
