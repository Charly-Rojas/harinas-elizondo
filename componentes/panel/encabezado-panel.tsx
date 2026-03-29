"use client";

import { Avatar, Badge, Button } from "@radix-ui/themes";
import { usePathname } from "next/navigation";
import { cerrar_sesion } from "@/app/acciones/autenticacion";
import {
  IconoCampana,
  IconoSalir,
} from "@/componentes/panel/iconos";
import type { RolUsuario } from "@/lib/tipos";

function iniciales(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}

function obtenerColorRol(rol: RolUsuario) {
  if (rol === "superadmin") return "indigo";
  if (rol === "admin") return "blue";
  return "gray";
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
  const esSettings = pathname.startsWith("/settings");
  const esClientes = pathname.startsWith("/clientes");
  const seccion = esSettings ? "Settings" : esClientes ? "Clientes" : "Home";
  const titulo = esSettings
    ? "Configuración"
    : esClientes
      ? "Gestión de clientes"
      : "Dashboard";

  return (
    <header className="border-b border-slate-200/75 px-4 py-4 md:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {seccion}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {titulo}
          </h2>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          

          <div className="flex items-center gap-2 md:justify-end">
            <button
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:text-slate-900"
              type="button"
            >
              <IconoCampana className="text-current" />
            </button>

            <div className="flex items-center gap-3 px-3 py-2 ">
              <Avatar
                color="indigo"
                fallback={iniciales(nombre) || "HE"}
                radius="full"
                size="2"
              />
              <div className="hidden min-w-0 md:block">
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

            <form action={cerrar_sesion}>
              <Button size="3" type="submit" variant="soft">
                <IconoSalir className="mr-1" />
                Salir
              </Button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}
