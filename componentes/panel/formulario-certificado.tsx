"use client";

import { useActionState, useMemo, useState } from "react";
import { Badge, Button } from "@radix-ui/themes";
import {
  crear_certificado,
  type EstadoFormularioCertificado,
} from "@/app/(privado)/certificados/acciones";
import type { InspeccionConRelaciones } from "@/lib/tipos-dominio";

const estadoInicial: EstadoFormularioCertificado = {};

export function FormularioCertificado({
  inspeccionPreseleccionadaId,
  inspeccionesDisponibles,
  onCancelar,
}: {
  inspeccionPreseleccionadaId?: number | null;
  inspeccionesDisponibles: InspeccionConRelaciones[];
  onCancelar: () => void;
}) {
  const [estado, ejecutar] = useActionState(crear_certificado, estadoInicial);
  const [idInspeccion, setIdInspeccion] = useState(
    inspeccionPreseleccionadaId ? String(inspeccionPreseleccionadaId) : ""
  );

  const inspeccionSeleccionada = useMemo(
    () =>
      inspeccionesDisponibles.find(
        (inspeccion) => String(inspeccion.id_inspeccion) === idInspeccion
      ),
    [idInspeccion, inspeccionesDisponibles]
  );

  const totalFuera =
    inspeccionSeleccionada?.resultados_analisis.filter(
      (resultado) => resultado.dentro_especificacion === false
    ).length ?? 0;

  return (
    <article className="tarjeta-suave rounded-[28px] p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Emitir certificado
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Selecciona una inspección con cliente, captura datos de embarque y
            genera un snapshot inmutable de resultados para impresión.
          </p>
        </div>
        <Badge color="blue" radius="full" size="2" variant="soft">
          Emisión
        </Badge>
      </div>

      {estado.error ? (
        <div className="mt-5 rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {estado.error}
        </div>
      ) : null}

      <form action={ejecutar} className="mt-6 space-y-4" key={idInspeccion || "nuevo"}>
        <div className="grid gap-4 xl:grid-cols-3 md:grid-cols-2">
          <label className="block xl:col-span-3">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Inspección
            </span>
            <select
              className="campo-formulario"
              name="id_inspeccion"
              onChange={(event) => setIdInspeccion(event.target.value)}
              required
              value={idInspeccion}
            >
              <option value="">Selecciona una inspección</option>
              {inspeccionesDisponibles.map((inspeccion) => (
                <option
                  key={inspeccion.id_inspeccion}
                  value={inspeccion.id_inspeccion}
                >
                  {inspeccion.lotes_produccion?.numero_lote || "Sin lote"} · Secuencia{" "}
                  {inspeccion.secuencia} · {inspeccion.clientes?.nombre || "Sin cliente"}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-[22px] border border-slate-200/80 bg-white/80 p-4">
            <p className="text-sm font-medium text-slate-500">Cliente</p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {inspeccionSeleccionada?.clientes?.nombre || "-"}
            </p>
          </div>

          <div className="rounded-[22px] border border-slate-200/80 bg-white/80 p-4">
            <p className="text-sm font-medium text-slate-500">Lote</p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {inspeccionSeleccionada?.lotes_produccion?.numero_lote || "-"}
            </p>
          </div>

          <div className="rounded-[22px] border border-slate-200/80 bg-white/80 p-4">
            <p className="text-sm font-medium text-slate-500">Resultados</p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {inspeccionSeleccionada?.resultados_analisis.length ?? 0}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {totalFuera > 0 ? `${totalFuera} fuera de especificación` : "Todos en rango o sin límite"}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Orden de compra
            </span>
            <input className="campo-formulario" name="numero_orden_compra" type="text" />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Cantidad solicitada
            </span>
            <input
              className="campo-formulario"
              min="0"
              name="cantidad_solicitada"
              step="0.01"
              type="number"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Cantidad total entrega
            </span>
            <input
              className="campo-formulario"
              min="0"
              name="cantidad_total_entrega"
              step="0.01"
              type="number"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Factura
            </span>
            <input className="campo-formulario" name="numero_factura" type="text" />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Fecha de envío
            </span>
            <input className="campo-formulario" name="fecha_envio" type="date" />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Fecha de caducidad
            </span>
            <input
              className="campo-formulario"
              defaultValue={inspeccionSeleccionada?.lotes_produccion?.fecha_caducidad ?? ""}
              name="fecha_caducidad"
              type="date"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Correo cliente
            </span>
            <input
              className="campo-formulario"
              defaultValue={inspeccionSeleccionada?.clientes?.correo_contacto_cliente ?? ""}
              name="correo_cliente"
              type="email"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Correo almacén
            </span>
            <input
              className="campo-formulario"
              defaultValue={inspeccionSeleccionada?.clientes?.correo_almacenista ?? ""}
              name="correo_almacen"
              type="email"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-600">
            Observaciones del certificado
          </span>
          <textarea
            className="campo-formulario min-h-24 resize-y"
            name="observaciones"
            placeholder="Notas de embarque, aclaraciones comerciales o comentarios del certificado."
          />
        </label>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button disabled={!idInspeccion} size="3" type="submit">
            Emitir certificado
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
