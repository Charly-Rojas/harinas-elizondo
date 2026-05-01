"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  IconoCampana,
  IconoCertificados,
  IconoClientes,
  IconoInspecciones,
  IconoLotes,
} from "@/componentes/panel/iconos";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import type {
  CertificadoCalidad,
  EstadoCertificado,
  EstadoEnvioCertificado,
  EstadoInspeccion,
  Inspeccion,
  LoteProduccion,
  Producto,
} from "@/lib/tipos-dominio";
import type { Cliente } from "@/lib/tipos-clientes";

type ResumenDashboard = {
  clientesActivos: number;
  lotesRegistrados: number;
  inspeccionesMes: number;
  certificadosEmitidosMes: number;
  certificadosPendientesEnvio: number;
};

type InspeccionReciente = Pick<
  Inspeccion,
  "id_inspeccion" | "fecha_inspeccion" | "secuencia" | "status"
> & {
  lotes_produccion?: Pick<LoteProduccion, "numero_lote"> | null;
  clientes?: Pick<Cliente, "id_cliente" | "nombre"> | null;
};

type CertificadoReciente = Pick<
  CertificadoCalidad,
  "id_certificado" | "folio" | "status_certificado" | "status_envio"
> & {
  clientes?: Pick<Cliente, "id_cliente" | "nombre"> | null;
  lotes_produccion?:
    | (Pick<LoteProduccion, "numero_lote"> & {
        productos?: Pick<Producto, "nombre"> | null;
      })
    | null;
};

const RESUMEN_INICIAL: ResumenDashboard = {
  clientesActivos: 0,
  lotesRegistrados: 0,
  inspeccionesMes: 0,
  certificadosEmitidosMes: 0,
  certificadosPendientesEnvio: 0,
};

function obtenerPrimerDiaMesActual() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  return `${anio}-${mes}-01`;
}

function formatearFecha(fecha: string | null | undefined) {
  if (!fecha) {
    return "--/--/----";
  }

  const valorBase = fecha.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valorBase);

  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }

  const fechaParseada = new Date(fecha);

  if (Number.isNaN(fechaParseada.getTime())) {
    return "--/--/----";
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(fechaParseada);
}

function clasesEstadoInspeccion(status: EstadoInspeccion) {
  switch (status) {
    case "borrador":
      return "border-slate-200 bg-slate-100 text-slate-600";
    case "cerrada":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "aprobada":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "cancelada":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

function clasesEstadoCertificado(status: EstadoCertificado) {
  switch (status) {
    case "borrador":
      return "border-slate-200 bg-slate-100 text-slate-600";
    case "emitido":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "cancelado":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

function clasesEstadoEnvio(status: EstadoEnvioCertificado) {
  switch (status) {
    case "pendiente":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "enviado":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "fallido":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

export default function PaginaHome() {
  const [resumen, setResumen] = useState<ResumenDashboard>(RESUMEN_INICIAL);
  const [inspeccionesRecientes, setInspeccionesRecientes] = useState<
    InspeccionReciente[]
  >([]);
  const [certificadosRecientes, setCertificadosRecientes] = useState<
    CertificadoReciente[]
  >([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function cargarDashboard() {
      setCargando(true);
      setErrorCarga(null);

      try {
        const supabase = crearClienteNavegador();
        const primerDiaMesActual = obtenerPrimerDiaMesActual();

        const [
          clientesActivosQuery,
          lotesRegistradosQuery,
          inspeccionesMesQuery,
          certificadosEmitidosMesQuery,
          certificadosPendientesEnvioQuery,
          inspeccionesRecientesQuery,
          certificadosRecientesQuery,
        ] = await Promise.all([
          supabase
            .from("clientes")
            .select("id_cliente", { count: "exact", head: true })
            .eq("status", "activo"),
          supabase
            .from("lotes_produccion")
            .select("id_lote", { count: "exact", head: true }),
          supabase
            .from("inspecciones")
            .select("id_inspeccion", { count: "exact", head: true })
            .gte("fecha_inspeccion", primerDiaMesActual),
          supabase
            .from("certificados_calidad")
            .select("id_certificado", { count: "exact", head: true })
            .eq("status_certificado", "emitido")
            .gte("emitido_en", primerDiaMesActual),
          supabase
            .from("certificados_calidad")
            .select("id_certificado", { count: "exact", head: true })
            .eq("status_envio", "pendiente"),
          supabase
            .from("inspecciones")
            .select(
              "id_inspeccion, fecha_inspeccion, secuencia, status, lotes_produccion(numero_lote), clientes(id_cliente, nombre)"
            )
            .order("fecha_inspeccion", { ascending: false })
            .limit(8),
          supabase
            .from("certificados_calidad")
            .select(
              "id_certificado, folio, status_certificado, status_envio, clientes(id_cliente, nombre), lotes_produccion(numero_lote, productos(nombre))"
            )
            .order("creado_en", { ascending: false })
            .limit(5),
        ]);

        if (cancelado) {
          return;
        }

        const errores = [
          clientesActivosQuery.error,
          lotesRegistradosQuery.error,
          inspeccionesMesQuery.error,
          certificadosEmitidosMesQuery.error,
          certificadosPendientesEnvioQuery.error,
          inspeccionesRecientesQuery.error,
          certificadosRecientesQuery.error,
        ].filter(Boolean);

        if (errores.length > 0) {
          setErrorCarga(
            "No se pudo actualizar toda la informacion del dashboard. Se muestran los datos disponibles."
          );
        }

        setResumen({
          clientesActivos: clientesActivosQuery.count ?? 0,
          lotesRegistrados: lotesRegistradosQuery.count ?? 0,
          inspeccionesMes: inspeccionesMesQuery.count ?? 0,
          certificadosEmitidosMes: certificadosEmitidosMesQuery.count ?? 0,
          certificadosPendientesEnvio: certificadosPendientesEnvioQuery.count ?? 0,
        });
        setInspeccionesRecientes(
          (inspeccionesRecientesQuery.data ?? []) as InspeccionReciente[]
        );
        setCertificadosRecientes(
          (certificadosRecientesQuery.data ?? []) as CertificadoReciente[]
        );
      } catch {
        if (!cancelado) {
          setErrorCarga(
            "No se pudo cargar el dashboard en este momento. Intenta recargar la pagina."
          );
          setResumen(RESUMEN_INICIAL);
          setInspeccionesRecientes([]);
          setCertificadosRecientes([]);
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    }

    void cargarDashboard();

    return () => {
      cancelado = true;
    };
  }, []);

  const tarjetasKpi = [
    {
      colorFondo: "bg-indigo-50",
      colorIcono: "text-indigo-600",
      colorNumero: "text-indigo-700",
      etiqueta: "Clientes activos",
      icono: IconoClientes,
      valor: resumen.clientesActivos,
    },
    {
      colorFondo: "bg-emerald-50",
      colorIcono: "text-emerald-600",
      colorNumero: "text-emerald-700",
      etiqueta: "Lotes registrados",
      icono: IconoLotes,
      valor: resumen.lotesRegistrados,
    },
    {
      colorFondo: "bg-sky-50",
      colorIcono: "text-sky-600",
      colorNumero: "text-sky-700",
      etiqueta: "Inspecciones este mes",
      icono: IconoInspecciones,
      valor: resumen.inspeccionesMes,
    },
    {
      colorFondo: "bg-violet-50",
      colorIcono: "text-violet-600",
      colorNumero: "text-violet-700",
      etiqueta: "Certificados emitidos este mes",
      icono: IconoCertificados,
      valor: resumen.certificadosEmitidosMes,
    },
    {
      colorFondo: "bg-amber-50",
      colorIcono: "text-amber-600",
      colorNumero: "text-amber-700",
      etiqueta: "Certificados pendientes de envio",
      icono: IconoCampana,
      valor: resumen.certificadosPendientesEnvio,
    },
  ];

  return (
    <section className="flex min-h-full flex-col gap-5">
      <header className="superficie-panel relative overflow-hidden rounded-[32px] p-6 md:p-7">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_62%)] lg:block" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-500">
              Sistema de calidad
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
              Dashboard de control de calidad de harinas
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Consulta el estado operativo del laboratorio, la trazabilidad de
              lotes y la emision documental desde una sola vista.
            </p>
          </div>

          <div className="tarjeta-suave relative h-40 w-40 overflow-hidden rounded-[28px] bg-white/70 md:h-48 md:w-48">
            <div className="absolute inset-0 bg-violet-300/25 blur-3xl" />
            <div className="relative h-full w-full overflow-hidden rounded-[inherit]">
              <video
                aria-label="Gengar chef animado"
                autoPlay
                className="h-full w-full object-cover"
                loop
                muted
                playsInline
                preload="metadata"
              >
                <source src="/gengar_chef.mp4" type="video/mp4" />
                Tu navegador no soporta video HTML5.
              </video>
            </div>
          </div>
        </div>
      </header>

      {cargando ? (
        <article className="superficie-panel rounded-[28px] p-8 md:p-10">
          <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
            <div>
              <p className="text-base font-semibold text-slate-900">
                Cargando dashboard...
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Consultando indicadores, inspecciones y certificados recientes.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, indice) => (
              <div
                className="tarjeta-suave rounded-[24px] p-5"
                key={`skeleton-kpi-${indice}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="h-11 w-11 rounded-2xl bg-slate-100" />
                  <div className="h-5 w-5 rounded-full bg-slate-100" />
                </div>
                <div className="mt-8 h-9 w-20 rounded-xl bg-slate-100" />
                <div className="mt-3 h-4 w-32 rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        </article>
      ) : (
        <>
          {errorCarga ? (
            <div className="tarjeta-suave rounded-[24px] border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-800">
              {errorCarga}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {tarjetasKpi.map((tarjeta) => {
              const Icono = tarjeta.icono;

              return (
                <article
                  className="tarjeta-suave rounded-[24px] p-5"
                  key={tarjeta.etiqueta}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tarjeta.colorFondo} ${tarjeta.colorIcono}`}
                    >
                      <Icono />
                    </div>
                  </div>

                  <p className={`mt-8 text-3xl font-bold ${tarjeta.colorNumero}`}>
                    {tarjeta.valor.toLocaleString("es-MX")}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">{tarjeta.etiqueta}</p>
                </article>
              );
            })}
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,1fr)]">
            <article className="tarjeta-suave overflow-hidden rounded-[28px]">
              <div className="border-b border-slate-200/80 px-5 py-4 md:px-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Actividad reciente
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Ultimas 8 inspecciones registradas con trazabilidad de lote
                      y cliente.
                    </p>
                  </div>
                  <Link
                    className="text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
                    href="/inspecciones"
                  >
                    Ver modulo completo
                  </Link>
                </div>
              </div>

              {inspeccionesRecientes.length === 0 ? (
                <div className="px-6 py-14 text-center text-sm text-slate-500">
                  Sin inspecciones registradas recientemente.
                </div>
              ) : (
                <>
                  <div className="grid gap-3 p-4 md:hidden">
                    {inspeccionesRecientes.map((inspeccion) => (
                      <article
                        className="rounded-[22px] border border-slate-200/80 bg-white/80 p-4"
                        key={inspeccion.id_inspeccion}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                              {formatearFecha(inspeccion.fecha_inspeccion)}
                            </p>
                            <h3 className="mt-2 text-base font-semibold text-slate-900">
                              Secuencia {inspeccion.secuencia}
                            </h3>
                          </div>
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium capitalize ${clasesEstadoInspeccion(inspeccion.status)}`}
                          >
                            {inspeccion.status}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-2 text-sm text-slate-500">
                          <p>
                            <span className="font-medium text-slate-700">Lote:</span>{" "}
                            {inspeccion.lotes_produccion?.numero_lote || "Sin lote"}
                          </p>
                          <p>
                            <span className="font-medium text-slate-700">Cliente:</span>{" "}
                            {inspeccion.clientes?.nombre || "Sin cliente"}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200/80 bg-slate-50/60">
                          <th className="px-6 py-3.5 font-semibold text-slate-500">
                            Fecha
                          </th>
                          <th className="px-6 py-3.5 font-semibold text-slate-500">
                            Secuencia
                          </th>
                          <th className="px-6 py-3.5 font-semibold text-slate-500">
                            Lote
                          </th>
                          <th className="px-6 py-3.5 font-semibold text-slate-500">
                            Cliente
                          </th>
                          <th className="px-6 py-3.5 text-right font-semibold text-slate-500">
                            Estado
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {inspeccionesRecientes.map((inspeccion) => (
                          <tr
                            className="border-b border-slate-100 transition hover:bg-slate-50/50"
                            key={inspeccion.id_inspeccion}
                          >
                            <td className="px-6 py-4 text-slate-600">
                              {formatearFecha(inspeccion.fecha_inspeccion)}
                            </td>
                            <td className="px-6 py-4 font-mono text-sm text-slate-900">
                              {inspeccion.secuencia}
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                              {inspeccion.lotes_produccion?.numero_lote || "Sin lote"}
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-medium text-slate-900">
                                {inspeccion.clientes?.nombre || "Sin cliente"}
                              </p>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium capitalize ${clasesEstadoInspeccion(inspeccion.status)}`}
                              >
                                {inspeccion.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </article>

            <div className="flex">
              <article className="tarjeta-suave rounded-[28px] p-5 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Certificados recientes
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Ultimos 5 movimientos documentales del area de calidad.
                    </p>
                  </div>
                  <Link
                    className="text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
                    href="/certificados"
                  >
                    Ver todos
                  </Link>
                </div>

                {certificadosRecientes.length === 0 ? (
                  <div className="py-10 text-sm text-slate-500">
                    Sin certificados recientes.
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {certificadosRecientes.map((certificado) => (
                      <div
                        className="rounded-[22px] border border-slate-200/80 bg-white/80 p-4"
                        key={certificado.id_certificado}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-mono text-sm font-semibold text-slate-900">
                              {certificado.folio || "Sin folio"}
                            </p>
                            <p className="mt-1 truncate text-sm text-slate-500">
                              {certificado.clientes?.nombre || "Sin cliente"}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {certificado.lotes_produccion?.productos?.nombre ||
                                "Producto sin asignar"}
                            </p>
                          </div>

                          <div className="flex flex-wrap justify-end gap-2">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium capitalize ${clasesEstadoCertificado(certificado.status_certificado)}`}
                            >
                              {certificado.status_certificado}
                            </span>
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium capitalize ${clasesEstadoEnvio(certificado.status_envio)}`}
                            >
                              {certificado.status_envio}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-500">
                          <span>
                            Lote {certificado.lotes_produccion?.numero_lote || "sin asignar"}
                          </span>
                          <Link
                            className="font-medium text-indigo-600 transition hover:text-indigo-700"
                            href={`/certificados/${certificado.id_certificado}`}
                          >
                            Abrir
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
