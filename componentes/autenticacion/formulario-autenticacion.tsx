"use client";

import Image from "next/image";
import { Card } from "@radix-ui/themes";
import { useActionState, useMemo, useState } from "react";
import {
  iniciar_sesion,
  registrar_usuario,
  type EstadoFormularioAutenticacion,
} from "@/app/acciones/autenticacion";
import { BotonEnvio } from "@/componentes/autenticacion/boton-envio";

const estadoInicial: EstadoFormularioAutenticacion = {};

export function FormularioAutenticacion({
  errorInicial,
}: {
  errorInicial?: string;
}) {
  const [modo, setModo] = useState<"login" | "registro">("login");
  const [estadoLogin, accionLogin] = useActionState(
    iniciar_sesion,
    estadoInicial
  );
  const [estadoRegistro, accionRegistro] = useActionState(
    registrar_usuario,
    estadoInicial
  );

  const estadoVisible = useMemo(() => {
    if (errorInicial) {
      return { error: errorInicial };
    }

    return modo === "login" ? estadoLogin : estadoRegistro;
  }, [estadoLogin, estadoRegistro, modo, errorInicial]);

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

          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                {modo === "login" ? "Iniciar sesión" : "Crear cuenta"}
              </h2>
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 p-1">
              <button
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  modo === "login"
                    ? "bg-slate-950 text-white"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                onClick={() => setModo("login")}
                type="button"
              >
                Login
              </button>
              <button
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  modo === "registro"
                    ? "bg-slate-950 text-white"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                onClick={() => setModo("registro")}
                type="button"
              >
                Registro
              </button>
            </div>
          </div>

        </div>

        {estadoVisible.error ? (
          <div className="mt-5 rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {estadoVisible.error}
          </div>
        ) : null}

        {estadoVisible.exito ? (
          <div className="mt-5 rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {estadoVisible.exito}
          </div>
        ) : null}

        {modo === "login" ? (
          <form action={accionLogin} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">
                Correo
              </span>
              <input
                className="campo-formulario"
                name="correo"
                placeholder="tu@correo.com"
                required
                type="email"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">
                Contraseña
              </span>
              <input
                className="campo-formulario"
                name="contrasena"
                placeholder="••••••••"
                required
                type="password"
              />
            </label>
            <div className="pt-2">
              <BotonEnvio texto="Entrar" textoPendiente="Entrando..." />
            </div>
          </form>
        ) : (
          <form action={accionRegistro} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">
                Nombre
              </span>
              <input
                className="campo-formulario"
                name="nombre"
                placeholder="Nombre visible"
                required
                type="text"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">
                Correo
              </span>
              <input
                className="campo-formulario"
                name="correo"
                placeholder="tu@correo.com"
                required
                type="email"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">
                Contraseña
              </span>
              <input
                className="campo-formulario"
                minLength={6}
                name="contrasena"
                placeholder="Mínimo 6 caracteres"
                required
                type="password"
              />
            </label>
            <div className="pt-2">
              <BotonEnvio texto="Crear cuenta" textoPendiente="Creando..." />
            </div>
          </form>
        )}
      </div>
    </Card>
  );
}
