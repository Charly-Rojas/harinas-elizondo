"use client";

import { useActionState } from "react";
import { Badge, Button } from "@radix-ui/themes";
import {
  crear_cliente,
  editar_cliente,
  type EstadoFormularioCliente,
} from "@/app/(privado)/clientes/acciones";
import type { Cliente } from "@/lib/tipos-clientes";

const estadoInicial: EstadoFormularioCliente = {};

export function FormularioCliente({
  cliente,
  onCancelar,
}: {
  cliente?: Cliente;
  onCancelar: () => void;
}) {
  const esEdicion = Boolean(cliente);
  const accion = esEdicion ? editar_cliente : crear_cliente;
  const [estado, ejecutar] = useActionState(accion, estadoInicial);

  return (
    <article className="tarjeta-suave rounded-[28px] p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {esEdicion ? "Editar cliente" : "Nuevo cliente"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {esEdicion
              ? "Modifica los datos del cliente."
              : "Registra un nuevo cliente con su ID de SAP."}
          </p>
        </div>
        <Badge color="indigo" radius="full" size="2" variant="soft">
          {esEdicion ? "Edición" : "Alta"}
        </Badge>
      </div>

      {estado.error && (
        <div className="mt-5 rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {estado.error}
        </div>
      )}

      <form action={ejecutar} className="mt-6 space-y-4">
        {/* ID oculto para edición */}
        {esEdicion && (
          <input name="id_cliente" type="hidden" value={cliente!.id_cliente} />
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {/* ID SAP - solo en creación */}
          {!esEdicion && (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">
                ID SAP (6 dígitos)
              </span>
              <input
                className="campo-formulario"
                maxLength={6}
                minLength={6}
                name="id_cliente"
                placeholder="100001"
                required
                type="number"
              />
            </label>
          )}

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Nombre / Razón social
            </span>
            <input
              className="campo-formulario"
              defaultValue={cliente?.nombre ?? ""}
              name="nombre"
              placeholder="Panadería El Buen Pan S.A. de C.V."
              required
              type="text"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              RFC
            </span>
            <input
              className="campo-formulario"
              defaultValue={cliente?.rfc ?? ""}
              maxLength={13}
              name="rfc"
              placeholder="PBP230101ABC"
              required
              style={{ textTransform: "uppercase" }}
              type="text"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-600">
            Domicilio fiscal
          </span>
          <input
            className="campo-formulario"
            defaultValue={cliente?.domicilio_fiscal ?? ""}
            name="domicilio_fiscal"
            placeholder="Av. Industrial 456, Col. Centro, CDMX"
            required
            type="text"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Correo almacenista
            </span>
            <input
              className="campo-formulario"
              defaultValue={cliente?.correo_almacenista ?? ""}
              name="correo_almacenista"
              placeholder="almacen@cliente.com"
              type="email"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Correo gerente de calidad
            </span>
            <input
              className="campo-formulario"
              defaultValue={cliente?.correo_gte_calidad ?? ""}
              name="correo_gte_calidad"
              placeholder="calidad@cliente.com"
              type="email"
            />
          </label>
        </div>

        <label className="flex items-center gap-3 rounded-[18px] border border-slate-200/80 bg-white/80 px-4 py-3.5">
          <input
            defaultChecked={cliente?.solicita_certificado ?? false}
            name="solicita_certificado"
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm font-medium text-slate-700">
            El cliente solicita certificado de calidad
          </span>
        </label>

        <div className="flex items-center gap-3 pt-2">
          <Button size="3" type="submit">
            {esEdicion ? "Guardar cambios" : "Registrar cliente"}
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
