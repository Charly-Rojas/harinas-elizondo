"use client";

import Image from "next/image";
import { Card } from "@radix-ui/themes";
import { useActionState, useMemo, useState } from "react";
import {
  iniciar_sesion,
  registrar_usuario,
  solicitar_recuperacion,
  type EstadoFormularioAutenticacion,
} from "@/app/acciones/autenticacion";
import { BotonEnvio } from "@/componentes/autenticacion/boton-envio";

const estadoInicial: EstadoFormularioAutenticacion = {};

export function FormularioAutenticacion({
  errorInicial,
}: {
  errorInicial?: string;
}) {
  const [modo, setModo] = useState<"login" | "registro" | "recuperar">(
    "login"
  );
  const [estadoLogin, accionLogin] = useActionState(
    iniciar_sesion,
    estadoInicial
  );
  const [estadoRegistro, accionRegistro] = useActionState(
    registrar_usuario,
    estadoInicial
  );
  const [estadoRecuperacion, accionRecuperacion] = useActionState(
    solicitar_recuperacion,
    estadoInicial
  );

  const estadoVisible = useMemo(() => {
    if (errorInicial && modo === "login") {
      return { error: errorInicial };
    }

    if (modo === "registro") {
      return estadoRegistro;
    }

    if (modo === "recuperar") {
      return estadoRecuperacion;
    }

    return estadoLogin;
  }, [estadoLogin, estadoRecuperacion, estadoRegistro, errorInicial, modo]);

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
                {modo === "login"
                  ? "Iniciar sesión"
                  : modo === "registro"
                    ? "Crear cuenta"
                    : "Recuperar contraseña"}
              </h2>
              {modo === "recuperar" ? (
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Ingresa tu correo y te enviaremos un enlace para restablecer
                  tu contraseña
                </p>
              ) : null}
            </div>

            {modo !== "recuperar" && (
              <div className="rounded-full border border-slate-200 bg-slate-50 p-1">
                <button
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    modo === "login"
                      ? "bg-indigo-950 text-white"
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
                      ? "bg-indigo-950 text-white"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  onClick={() => setModo("registro")}
                  type="button"
                >
                  Registro
                </button>
              </div>
            )}
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
                placeholder="********"
                required
                type="password"
              />
            </label>
            <div className="pt-2">
              <BotonEnvio texto="Entrar" textoPendiente="Entrando..." />
            </div>
            <button
              className="mt-3 block cursor-pointer text-center text-sm text-indigo-600 hover:text-indigo-800"
              onClick={() => setModo("recuperar")}
              type="button"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </form>
        ) : modo === "registro" ? (
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
        ) : (
          <form action={accionRecuperacion} className="mt-6 space-y-4">
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
            <div className="pt-2">
              <BotonEnvio texto="Enviar enlace" textoPendiente="Enviando..." />
            </div>
            <button
              className="mt-3 block cursor-pointer text-center text-sm text-indigo-600 hover:text-indigo-800"
              onClick={() => setModo("login")}
              type="button"
            >
              Volver al login
            </button>
          </form>
        )}
      </div>
    </Card>
  );
}
