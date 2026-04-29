"use client";

import Link from "next/link";
import { createElement, useEffect, useState } from "react";
import { Badge, Button } from "@radix-ui/themes";
import { usePathname } from "next/navigation";
import { cerrar_sesion } from "@/app/acciones/autenticacion";
import {
  IconoCampana,
  IconoCerrar,
  IconoGreatBall,
  IconoMasterBall,
  IconoMenu,
  IconoPokeballNormal,
  IconoPremierBall,
  IconoSafariBall,
  IconoSalir,
  IconoUltraBall,
} from "@/componentes/panel/iconos";
import {
  enlacesPanel,
  obtenerContextoRuta,
  rutaActiva,
} from "@/componentes/panel/navegacion-panel";
import type { RolUsuario } from "@/lib/tipos";

function obtenerColorRol(rol: RolUsuario) {
  if (rol === "superadmin") return "indigo";
  if (rol === "admin") return "blue";
  return "gray";
}

function obtenerIconoRol(rol: RolUsuario) {
  const iconos: Record<RolUsuario, React.ComponentType<{ className?: string }>> =
    {
      superadmin: IconoMasterBall,
      admin: IconoUltraBall,
      gte_calidad: IconoGreatBall,
      gte_plantas: IconoSafariBall,
      dir_operaciones: IconoPremierBall,
      operador: IconoPokeballNormal,
    };

  return iconos[rol] || IconoPokeballNormal;
}

export function EncabezadoPanel({
  correo,
  nombre,
  rol,
}: {
  correo: string;
  nombre: string;
  rol: RolUsuario;
}) {
  const pathname = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { seccion, titulo } = obtenerContextoRuta(pathname);
  const iconoPokeball = obtenerIconoRol(rol);

  useEffect(() => {
    if (!menuAbierto) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuAbierto]);

  useEffect(() => {
    if (!menuAbierto) {
      return;
    }

    function manejarEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuAbierto(false);
      }
    }

    window.addEventListener("keydown", manejarEscape);
    return () => window.removeEventListener("keydown", manejarEscape);
  }, [menuAbierto]);

  return (
    <>
      <header className="border-b border-slate-200/75 px-4 py-4 md:px-6">
        <div className="flex items-start justify-between gap-3 xl:hidden">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">{seccion}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              {titulo}
            </h2>
          </div>

          <button
            aria-controls="menu-mobile-panel"
            aria-expanded={menuAbierto}
            aria-label={menuAbierto ? "Cerrar navegación" : "Abrir navegación"}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:text-slate-950"
            onClick={() => setMenuAbierto((abierto) => !abierto)}
            type="button"
          >
            {menuAbierto ? <IconoCerrar /> : <IconoMenu />}
          </button>
        </div>

        <div className="mt-4 flex justify-end xl:mt-0 xl:flex-row xl:items-center xl:justify-between">
          <div className="hidden xl:block">
            <p className="text-sm font-medium text-slate-500">{seccion}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              {titulo}
            </h2>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <button
                className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:text-slate-900"
                type="button"
              >
                <IconoCampana className="text-current" />
              </button>

              <div className="hidden min-w-0 items-center gap-3 rounded-[20px] border border-slate-200/70 bg-white/70 px-3 py-2 md:flex">
                <div className="flex h-10 w-10 items-center justify-center">
                  {createElement(iconoPokeball, { className: "h-8 w-8" })}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {nombre}
                  </p>
                  <p className="truncate text-xs text-slate-500">{correo}</p>
                </div>
                <Badge
                  color={obtenerColorRol(rol)}
                  radius="full"
                  size="1"
                  variant="soft"
                >
                  {rol}
                </Badge>
              </div>

              <form action={cerrar_sesion} className="hidden md:block">
                <Button size="3" type="submit" variant="soft">
                  <IconoSalir className="mr-1" />
                  Salir
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {menuAbierto ? (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]"
            onClick={() => setMenuAbierto(false)}
            type="button"
          />

          <aside
            className="absolute right-0 top-0 flex h-full w-[min(88vw,360px)] flex-col border-l border-slate-200/70 bg-[#f8f8f8] p-4 shadow-2xl"
            id="menu-mobile-panel"
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Navegación</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  Harinas Elizondo
                </p>
              </div>

              <button
                aria-label="Cerrar navegación"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"
                onClick={() => setMenuAbierto(false)}
                type="button"
              >
                <IconoCerrar />
              </button>
            </div>

            <nav className="mt-5 flex flex-col gap-2">
              {enlacesPanel.map((enlace) => {
                const activo = rutaActiva(pathname, enlace.href);
                const Icono = enlace.icono;

                return (
                  <Link
                    className={`flex items-center gap-3 rounded-[20px] px-4 py-3 text-sm font-medium transition ${
                      activo
                        ? "!bg-indigo-950 !text-white shadow-lg shadow-slate-900/15"
                        : "bg-white text-slate-600"
                    }`}
                    href={enlace.href}
                    key={enlace.href}
                    onClick={() => setMenuAbierto(false)}
                  >
                    <Icono className={activo ? "!text-white" : "text-slate-400"} />
                    <span className={activo ? "!text-white" : undefined}>
                      {enlace.etiqueta}
                    </span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-5 rounded-[24px] border border-slate-200/80 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center">
                  {createElement(iconoPokeball, { className: "h-10 w-10" })}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {nombre}
                  </p>
                  <p className="truncate text-xs text-slate-500">{correo}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <Badge
                  color={obtenerColorRol(rol)}
                  radius="full"
                  size="1"
                  variant="soft"
                >
                  {rol}
                </Badge>

                <form action={cerrar_sesion}>
                  <Button size="2" type="submit" variant="soft">
                    <IconoSalir className="mr-1" />
                    Salir
                  </Button>
                </form>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
