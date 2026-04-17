"use client";

import { useActionState } from "react";
import { Badge, Button } from "@radix-ui/themes";
import {
  crear_producto,
  editar_producto,
  type EstadoFormularioProducto,
} from "@/app/(privado)/productos/acciones";
import type { Producto } from "@/lib/tipos-dominio";

const estadoInicial: EstadoFormularioProducto = {};

export function FormularioProducto({
  onCancelar,
  producto,
}: {
  onCancelar: () => void;
  producto?: Producto;
}) {
  const esEdicion = Boolean(producto);
  const accion = esEdicion ? editar_producto : crear_producto;
  const [estado, ejecutar] = useActionState(accion, estadoInicial);

  return (
    <article className="tarjeta-suave rounded-[28px] p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {esEdicion ? "Editar producto" : "Nuevo producto"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Define el catálogo de productos que podrán asociarse a los lotes de
            producción.
          </p>
        </div>
        <Badge color="violet" radius="full" size="2" variant="soft">
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
            name="id_producto"
            type="hidden"
            value={producto!.id_producto}
          />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Clave
            </span>
            <input
              className="campo-formulario"
              defaultValue={producto?.clave ?? ""}
              name="clave"
              placeholder="HR000"
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
              defaultValue={producto?.nombre ?? ""}
              name="nombre"
              placeholder="Harina 000"
              required
              type="text"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-600">
            Descripción
          </span>
          <textarea
            className="campo-formulario min-h-28 resize-y"
            defaultValue={producto?.descripcion ?? ""}
            name="descripcion"
            placeholder="Información operativa del producto, uso o clasificación."
          />
        </label>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button size="3" type="submit">
            {esEdicion ? "Guardar cambios" : "Registrar producto"}
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
