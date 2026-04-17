import Link from "next/link";
import {
  IconoClientes,
  IconoEquipos,
  IconoInspecciones,
  IconoLotes,
  IconoParametros,
  IconoProductos,
  IconoSettings,
} from "@/componentes/panel/iconos";

export default function PaginaHome() {
  return (
    <section className="flex min-h-full flex-col gap-5">
      

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-7">
        <Link
          className="tarjeta-suave rounded-[24px] p-5 transition hover:-translate-y-0.5"
          href="/clientes"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <IconoClientes />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Clientes
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Alta, actualización de datos y control de clientes con certificado.
          </p>
        </Link>

        <Link
          className="tarjeta-suave rounded-[24px] p-5 transition hover:-translate-y-0.5"
          href="/productos"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
            <IconoProductos />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Productos
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Catálogo de productos para asociar lotes y mantener consistencia.
          </p>
        </Link>

        <Link
          className="tarjeta-suave rounded-[24px] p-5 transition hover:-translate-y-0.5"
          href="/equipos"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <IconoEquipos />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Equipos
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Gestión de alveógrafos, farinógrafos y sus configuraciones.
          </p>
        </Link>

        <Link
          className="tarjeta-suave rounded-[24px] p-5 transition hover:-translate-y-0.5"
          href="/parametros"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <IconoParametros />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Parámetros
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Catálogo base de factores, unidades y origen de medición.
          </p>
        </Link>

        <Link
          className="tarjeta-suave rounded-[24px] p-5 transition hover:-translate-y-0.5"
          href="/lotes"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
            <IconoLotes />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Lotes
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Registro de lotes de producción para base analítica y trazabilidad.
          </p>
        </Link>

        <Link
          className="tarjeta-suave rounded-[24px] p-5 transition hover:-translate-y-0.5"
          href="/inspecciones"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <IconoInspecciones />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Inspecciones
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Captura de resultados por parámetro y evaluación contra límites.
          </p>
        </Link>

        <Link
          className="tarjeta-suave rounded-[24px] p-5 transition hover:-translate-y-0.5"
          href="/settings"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <IconoSettings />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Settings
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Administración de usuarios, aprobaciones y permisos.
          </p>
        </Link>
      </div>
    </section>
  );
}
