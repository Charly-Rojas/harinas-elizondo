"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { enlacesPanel, rutaActiva } from "@/componentes/panel/navegacion-panel";

export function BarraLateral() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[276px] shrink-0 overflow-hidden rounded-[32px] px-5 py-6 xl:sticky xl:top-5 xl:flex xl:self-start xl:flex-col">
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
        {enlacesPanel.map((enlace) => {
          const activo = rutaActiva(pathname, enlace.href);
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
  );
}
