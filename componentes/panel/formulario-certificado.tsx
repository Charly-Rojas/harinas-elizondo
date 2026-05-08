"use client";

import { useActionState, useMemo, useState } from "react";
import { Badge, Button } from "@radix-ui/themes";
import {
  crear_certificado,
  type EstadoFormularioCertificado,
} from "@/app/(privado)/certificados/acciones";
import {
  obtenerErrorCampo,
  obtenerValor,
  tieneErrorCampo,
} from "@/lib/form-state";
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
  const [idInspeccionManual, setIdInspeccionManual] = useState<string | null>(
    null
  );
  const idInspeccion =
    idInspeccionManual ??
    estado.values?.id_inspeccion ??
    (inspeccionPreseleccionadaId ? String(inspeccionPreseleccionadaId) : "");

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
  const domiciliosEntrega = inspeccionSeleccionada?.clientes?.direcciones ?? [];

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

      {estado.formError ? (
        <div className="mt-5 rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {estado.formError}
        </div>
      ) : null}

      <form action={ejecutar} className="mt-6 space-y-4" key={idInspeccion || "nuevo"}>
        <div className="grid gap-4 xl:grid-cols-3 md:grid-cols-2">
          <label className="block xl:col-span-3">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Inspección
            </span>
            <select
              aria-invalid={tieneErrorCampo(estado.fieldErrors, "id_inspeccion")}
              className="campo-formulario"
              name="id_inspeccion"
              onChange={(event) => setIdInspeccionManual(event.target.value)}
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
            {obtenerErrorCampo(estado.fieldErrors, "id_inspeccion") ? (
              <span className="mt-2 block text-xs text-red-600">
                {obtenerErrorCampo(estado.fieldErrors, "id_inspeccion")}
              </span>
            ) : null}
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
              Número de pedido de cliente
            </span>
            <input
              className="campo-formulario"
              defaultValue={obtenerValor(
                estado.values,
                "numero_pedido_cliente",
                ""
              )}
              name="numero_pedido_cliente"
              type="text"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Cantidad solicitada
            </span>
            <input
              className="campo-formulario"
              defaultValue={obtenerValor(
                estado.values,
                "cantidad_solicitada",
                ""
              )}
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
              defaultValue={obtenerValor(
                estado.values,
                "cantidad_total_entrega",
                ""
              )}
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
            <input
              className="campo-formulario"
              defaultValue={obtenerValor(estado.values, "numero_factura", "")}
              name="numero_factura"
              type="text"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Fecha de envío
            </span>
            <input
              className="campo-formulario"
              defaultValue={obtenerValor(estado.values, "fecha_envio", "")}
              name="fecha_envio"
              type="date"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Fecha de producción
            </span>
            <input
              className="campo-formulario"
              defaultValue={obtenerValor(
                estado.values,
                "fecha_produccion",
                inspeccionSeleccionada?.lotes_produccion?.fecha_produccion ?? ""
              )}
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
              defaultValue={obtenerValor(
                estado.values,
                "fecha_caducidad",
                inspeccionSeleccionada?.lotes_produccion?.fecha_caducidad ?? ""
              )}
              name="fecha_caducidad"
              type="date"
            />
          </label>

          <label className="block xl:col-span-3">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Domicilio de entrega adicional
            </span>
            <select
              aria-invalid={tieneErrorCampo(
                estado.fieldErrors,
                "id_direccion_entrega"
              )}
              className="campo-formulario"
              defaultValue={obtenerValor(
                estado.values,
                "id_direccion_entrega",
                ""
              )}
              name="id_direccion_entrega"
            >
              <option value="">Sin domicilio de entrega adicional</option>
              {domiciliosEntrega.map((direccion) => (
                <option key={direccion.id_direccion} value={direccion.id_direccion}>
                  {direccion.etiqueta} · {direccion.direccion}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Correo cliente
            </span>
            <input
              className="campo-formulario"
              defaultValue={obtenerValor(
                estado.values,
                "correo_cliente",
                inspeccionSeleccionada?.clientes?.correo_contacto_cliente ?? ""
              )}
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
              defaultValue={obtenerValor(
                estado.values,
                "correo_almacen",
                inspeccionSeleccionada?.clientes?.correo_almacenista ?? ""
              )}
              name="correo_almacen"
              type="email"
            />
          </label>
        </div>

        {inspeccionSeleccionada?.clientes?.domicilio_fiscal ? (
          <div className="rounded-[22px] border border-slate-200/80 bg-slate-50/80 p-4 text-sm text-slate-600">
            <p className="font-medium text-slate-900">Domicilio fiscal</p>
            <p className="mt-1">{inspeccionSeleccionada.clientes.domicilio_fiscal}</p>
          </div>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-600">
            Observaciones del certificado
          </span>
          <textarea
            className="campo-formulario min-h-24 resize-y"
            defaultValue={obtenerValor(estado.values, "observaciones", "")}
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
