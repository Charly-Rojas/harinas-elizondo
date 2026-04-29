"use client";

import Image from "next/image";
import Link from "next/link";
import { Card } from "@radix-ui/themes";
import { useActionState, useState, type FormEvent } from "react";
import {
  restablecer_contrasena,
  type EstadoFormularioAutenticacion,
} from "@/app/acciones/autenticacion";
import { BotonEnvio } from "@/componentes/autenticacion/boton-envio";

const estadoInicial: EstadoFormularioAutenticacion = {};

export function FormularioRestablecer() {
  const [estado, accion] = useActionState(
    restablecer_contrasena,
    estadoInicial
  );
  const [errorCliente, setErrorCliente] = useState<string | null>(null);

  function validarCoincidencia(event: FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const contrasena = String(formData.get("contrasena") ?? "").trim();
    const confirmar = String(formData.get("confirmar") ?? "").trim();

    if (contrasena !== confirmar) {
      event.preventDefault();
      setErrorCliente("Las contraseñas no coinciden.");
      return;
    }

    setErrorCliente(null);
  }

  return (
    <Card className="w-full max-w-[520px] rounded-[32px] p-3 shadow-none md:p-4">
      <div className="rounded-[28px] bg-white/80 p-5 md:p-7">
        <div className="flex flex-col gap-6">
          <div className="flex justify-center">
            <Image
              alt="Harinas Elizondo"
              height={54}
              priority
              src="/logo_horizontal.png"
              style={{ height: "auto", width: "210px" }}
              width={210}
            />
          </div>

          <div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              Nueva contraseña
            </h2>
          </div>
        </div>

        {errorCliente ? (
          <div className="mt-5 rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorCliente}
          </div>
        ) : null}

        {!errorCliente && estado.error ? (
          <div className="mt-5 rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {estado.error}
          </div>
        ) : null}

        {estado.exito ? (
          <div className="mt-5 rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {estado.exito}
          </div>
        ) : null}

        <form
          action={accion}
          className="mt-6 space-y-4"
          onSubmit={validarCoincidencia}
        >
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Nueva contraseña
            </span>
            <input
              className="campo-formulario"
              minLength={6}
              name="contrasena"
              required
              type="password"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Confirmar contraseña
            </span>
            <input
              className="campo-formulario"
              minLength={6}
              name="confirmar"
              required
              type="password"
            />
          </label>

          <div className="pt-2">
            <BotonEnvio
              texto="Guardar contraseña"
              textoPendiente="Guardando..."
            />
          </div>
        </form>

        {estado.exito ? (
          <Link
            className="mt-4 block text-center text-sm text-indigo-600 hover:text-indigo-800"
            href="/"
          >
            Ir al inicio
          </Link>
        ) : null}
      </div>
    </Card>
  );
}
