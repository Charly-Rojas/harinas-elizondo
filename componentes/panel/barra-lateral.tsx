"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconoHome, IconoClientes, IconoSettings } from "@/componentes/panel/iconos";

const enlaces = [
  {
    href: "/",
    etiqueta: "Home",
    icono: IconoHome,
  },
  {
    href: "/clientes",
    etiqueta: "Clientes",
    icono: IconoClientes,
  },
  {
    href: "/settings",
    etiqueta: "Settings",
    icono: IconoSettings,
  },
];

export function BarraLateral() {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden w-[260px] shrink-0 overflow-hidden rounded-[32px] px-5 py-6 lg:flex lg:flex-col">
        <div className="border-b border-slate-200/80 pb-5">
          <Image
            alt="Harinas Elizondo"
            className="h-auto w-[170px]"
            height={44}
            priority
            src="/logo_horizontal.png"
            width={170}
          />
        </div>

        <nav className="mt-6 flex flex-col gap-2">
          {enlaces.map((enlace) => {
            const activo =
              enlace.href === "/"
                ? pathname === "/"
                : pathname.startsWith(enlace.href);
            const Icono = enlace.icono;

            return (
                <Link
                className={`flex items-center gap-3 rounded-[22px] px-4 py-3 text-sm font-medium transition ${
                  activo
                  ? "!bg-indigo-950 !text-white shadow-lg shadow-slate-900/15"
                  : "text-slate-500 hover:!bg-white hover:!text-slate-900"
                }`}
                href={enlace.href}
                key={enlace.href}
                >
                <Icono className={activo ? "!text-white" : "text-slate-400"} />
                <span>{enlace.etiqueta}</span>
                </Link>
            );
          })}
        </nav>

    
      </aside>

      <nav className="superficie-panel flex items-center gap-2 overflow-x-auto rounded-[28px] p-2 lg:hidden">
        {enlaces.map((enlace) => {
          const activo =
            enlace.href === "/" ? pathname === "/" : pathname.startsWith(enlace.href);
          const Icono = enlace.icono;

          return (
            <Link
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                activo
                  ? "bg-slate-950 text-white"
                  : "bg-white/80 text-slate-600"
              }`}
              href={enlace.href}
              key={enlace.href}
            >
              <Icono className={activo ? "text-white" : "text-slate-400"} />
              <span>{enlace.etiqueta}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
