"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button } from "@radix-ui/themes";
import { FormularioCertificado } from "@/componentes/panel/formulario-certificado";
import { IconoBuscar } from "@/componentes/panel/iconos";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import type {
  CertificadoConRelaciones,
  InspeccionConRelaciones,
} from "@/lib/tipos-dominio";

type Vista = "lista" | "crear";

export default function PaginaCertificados() {
  const searchParams = useSearchParams();
  const inspeccionPreseleccionadaId = Number(searchParams.get("nueva") || "") || null;
  const [certificados, setCertificados] = useState<CertificadoConRelaciones[]>([]);
  const [inspecciones, setInspecciones] = useState<InspeccionConRelaciones[]>([]);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState<Vista>(inspeccionPreseleccionadaId ? "crear" : "lista");
  const [busqueda, setBusqueda] = useState("");

  async function cargarDatos() {
    setCargando(true);
    const supabase = crearClienteNavegador();

    const [{ data: certificadosData }, { data: inspeccionesData }] = await Promise.all([
      supabase
        .from("certificados_calidad")
        .select(
          "*, clientes(id_cliente, nombre), lotes_produccion(id_lote, numero_lote, fecha_caducidad, productos(*)), inspecciones(id_inspeccion, secuencia, es_ajuste, id_inspeccion_base), certificado_resultados(*)"
        )
        .order("creado_en", { ascending: false }),
      supabase
        .from("inspecciones")
        .select(
          "*, lotes_produccion(*, productos(*)), clientes(id_cliente, nombre, correo_contacto_cliente, correo_almacenista), resultados_analisis(*, parametros_calidad(*), equipos_laboratorio(*))"
        )
        .not("id_cliente", "is", null)
        .order("fecha_inspeccion", { ascending: false }),
    ]);

    setCertificados((certificadosData ?? []) as CertificadoConRelaciones[]);
    setInspecciones(
      ((inspeccionesData ?? []) as InspeccionConRelaciones[]).filter(
        (inspeccion) => inspeccion.resultados_analisis.length > 0
      )
    );
    setCargando(false);
  }

  useEffect(() => {
    async function inicializar() {
      await cargarDatos();
    }

    void inicializar();
  }, []);

  function cerrarFormulario() {
    setVista("lista");
    cargarDatos();
  }

  const filtrados = useMemo(() => {
    const texto = busqueda.toLowerCase();
    return certificados.filter((certificado) => {
      return (
        certificado.folio?.toLowerCase().includes(texto) ||
        certificado.clientes?.nombre?.toLowerCase().includes(texto) ||
        certificado.lotes_produccion?.numero_lote?.toLowerCase().includes(texto) ||
        certificado.numero_factura?.toLowerCase().includes(texto) ||
        false
      );
    });
  }, [busqueda, certificados]);

  const totalPendientes = certificados.filter(
    (certificado) => certificado.status_envio === "pendiente"
  ).length;
  const totalFuera = certificados.filter((certificado) =>
    certificado.certificado_resultados.some(
      (resultado) => resultado.dentro_especificacion === false
    )
  ).length;

  if (vista === "crear") {
    return (
      <FormularioCertificado
        inspeccionPreseleccionadaId={inspeccionPreseleccionadaId}
        inspeccionesDisponibles={inspecciones}
        onCancelar={cerrarFormulario}
      />
    );
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm leading-6 text-slate-500">
          Emite certificados desde inspecciones existentes, congela el snapshot
          de resultados y prepara la salida a impresión.
        </p>
        <Button onClick={() => setVista("crear")} size="3">
          + Nuevo certificado
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="tarjeta-suave rounded-[24px] p-5">
          <p className="text-sm font-medium text-slate-500">Emitidos</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {certificados.length}
          </p>
        </div>
        <div className="tarjeta-suave rounded-[24px] p-5">
          <p className="text-sm font-medium text-slate-500">Pendientes de envío</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {totalPendientes}
          </p>
        </div>
        <div className="tarjeta-suave rounded-[24px] p-5">
          <p className="text-sm font-medium text-slate-500">Inspecciones listas</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">
            {inspecciones.length}
          </p>
        </div>
        <div className="tarjeta-suave rounded-[24px] p-5">
          <p className="text-sm font-medium text-slate-500">Con desviaciones</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{totalFuera}</p>
        </div>
      </div>

      <div className="tarjeta-suave flex items-center gap-3 rounded-[24px] px-4 py-3">
        <IconoBuscar className="text-slate-400" />
        <input
          className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Buscar por folio, cliente, lote o factura..."
          type="text"
          value={busqueda}
        />
      </div>

      <article className="tarjeta-suave overflow-hidden rounded-[28px]">
        {cargando ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-slate-400">Cargando certificados...</p>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-sm text-slate-500">
              {busqueda
                ? "No se encontraron certificados con esa búsqueda."
                : "Aún no hay certificados emitidos."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 p-4 md:hidden">
              {filtrados.map((certificado) => {
                const fuera = certificado.certificado_resultados.filter(
                  (resultado) => resultado.dentro_especificacion === false
                ).length;

                return (
                  <article
                    className="rounded-[22px] border border-slate-200/80 bg-white/80 p-4"
                    key={certificado.id_certificado}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-xs uppercase tracking-wide text-slate-400">
                          {certificado.lotes_produccion?.numero_lote || "Sin lote"}
                        </p>
                        <h3 className="mt-1 text-base font-semibold text-slate-900">
                          {certificado.folio || `Certificado #${certificado.id_certificado}`}
                        </h3>
                      </div>
                      <Badge color="blue" radius="full" variant="soft">
                        {certificado.status_certificado}
                      </Badge>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge
                        color={fuera > 0 ? "red" : "jade"}
                        radius="full"
                        variant="soft"
                      >
                        {fuera > 0 ? `${fuera} fuera` : "Snapshot válido"}
                      </Badge>
                      <Badge color="gray" radius="full" variant="soft">
                        {certificado.inspecciones?.secuencia
                          ? `Inspección ${certificado.inspecciones.secuencia}`
                          : "Sin inspección"}
                      </Badge>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-slate-500">
                      <p>{certificado.clientes?.nombre || "Sin cliente"}</p>
                      <p>{certificado.numero_factura || "Sin factura"}</p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        className="inline-flex min-h-9 items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white"
                        href={`/certificados/${certificado.id_certificado}`}
                      >
                        Ver / imprimir
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1020px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/50">
                    <th className="px-5 py-3.5 font-semibold text-slate-500">Folio</th>
                    <th className="px-5 py-3.5 font-semibold text-slate-500">Cliente</th>
                    <th className="px-5 py-3.5 font-semibold text-slate-500">Lote</th>
                    <th className="px-5 py-3.5 font-semibold text-slate-500">Inspección</th>
                    <th className="px-5 py-3.5 font-semibold text-slate-500">Factura</th>
                    <th className="px-5 py-3.5 font-semibold text-slate-500">Cumplimiento</th>
                    <th className="px-5 py-3.5 text-right font-semibold text-slate-500">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((certificado) => {
                    const fuera = certificado.certificado_resultados.filter(
                      (resultado) => resultado.dentro_especificacion === false
                    ).length;

                    return (
                      <tr
                        className="border-b border-slate-100 transition hover:bg-slate-50/50"
                        key={certificado.id_certificado}
                      >
                        <td className="px-5 py-4 font-mono text-slate-600">
                          {certificado.folio || `#${certificado.id_certificado}`}
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">
                            {certificado.clientes?.nombre || "Sin cliente"}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {certificado.lotes_produccion?.numero_lote || "-"}
                        </td>
                        <td className="px-5 py-4">
                          <Badge color="gray" radius="full" size="1" variant="soft">
                            {certificado.inspecciones?.secuencia || "-"}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {certificado.numero_factura || "-"}
                        </td>
                        <td className="px-5 py-4">
                          <Badge
                            color={fuera > 0 ? "red" : "jade"}
                            radius="full"
                            size="1"
                            variant="soft"
                          >
                            {fuera > 0 ? `${fuera} fuera` : "Snapshot válido"}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              className="inline-flex min-h-8 items-center justify-center rounded-full bg-slate-950 px-3 text-xs font-medium text-white"
                              href={`/certificados/${certificado.id_certificado}`}
                            >
                              Ver / imprimir
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </article>
    </section>
  );
}
