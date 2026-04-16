"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button } from "@radix-ui/themes";
import { FormularioInspeccion } from "@/componentes/panel/formulario-inspeccion";
import { IconoBuscar } from "@/componentes/panel/iconos";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import type {
  EquipoConRelaciones,
  InspeccionConRelaciones,
  LoteConRelaciones,
  ParametroCalidad,
} from "@/lib/tipos-dominio";
import type { Cliente } from "@/lib/tipos-clientes";

type Vista = "lista" | "crear" | "editar" | "ajuste";
type ClienteLigero = Pick<Cliente, "id_cliente" | "nombre" | "solicita_certificado">;

export default function PaginaInspecciones() {
  const [inspecciones, setInspecciones] = useState<InspeccionConRelaciones[]>([]);
  const [lotes, setLotes] = useState<LoteConRelaciones[]>([]);
  const [clientes, setClientes] = useState<ClienteLigero[]>([]);
  const [equipos, setEquipos] = useState<EquipoConRelaciones[]>([]);
  const [parametros, setParametros] = useState<ParametroCalidad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState<Vista>("lista");
  const [busqueda, setBusqueda] = useState("");
  const [inspeccionEditar, setInspeccionEditar] = useState<
    InspeccionConRelaciones | undefined
  >();
  const [inspeccionAjuste, setInspeccionAjuste] = useState<
    InspeccionConRelaciones | undefined
  >();

  async function cargarDatos() {
    setCargando(true);
    const supabase = crearClienteNavegador();

    const [
      { data: inspeccionesData },
      { data: lotesData },
      { data: clientesData },
      { data: equiposData },
      { data: parametrosData },
    ] = await Promise.all([
      supabase
        .from("inspecciones")
        .select(
          "*, lotes_produccion(*), clientes(id_cliente, nombre), resultados_analisis(*, parametros_calidad(*), equipos_laboratorio(*))"
        )
        .order("fecha_inspeccion", { ascending: false }),
      supabase
        .from("lotes_produccion")
        .select("*, productos(*), inspecciones(*)")
        .order("creado_en", { ascending: false }),
      supabase
        .from("clientes")
        .select("id_cliente, nombre, solicita_certificado")
        .eq("status", "activo")
        .order("nombre", { ascending: true }),
      supabase
        .from("equipos_laboratorio")
        .select("*, equipos_parametros(*, parametros_calidad(*))")
        .order("clave", { ascending: true }),
      supabase
        .from("parametros_calidad")
        .select("*")
        .eq("activo", true)
        .order("nombre", { ascending: true }),
    ]);

    setInspecciones((inspeccionesData ?? []) as InspeccionConRelaciones[]);
    setLotes((lotesData ?? []) as LoteConRelaciones[]);
    setClientes((clientesData ?? []) as ClienteLigero[]);
    setEquipos((equiposData ?? []) as EquipoConRelaciones[]);
    setParametros((parametrosData ?? []) as ParametroCalidad[]);
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
    setInspeccionEditar(undefined);
    setInspeccionAjuste(undefined);
    cargarDatos();
  }

  function abrirEdicion(inspeccion: InspeccionConRelaciones) {
    setInspeccionEditar(inspeccion);
    setVista("editar");
  }

  function abrirAjuste(inspeccion: InspeccionConRelaciones) {
    setInspeccionAjuste(inspeccion);
    setVista("ajuste");
  }

  const filtrados = useMemo(() => {
    return inspecciones.filter((inspeccion) => {
      const texto = busqueda.toLowerCase();
      return (
        inspeccion.secuencia.toLowerCase().includes(texto) ||
        inspeccion.lotes_produccion?.numero_lote?.toLowerCase().includes(texto) ||
        inspeccion.clientes?.nombre?.toLowerCase().includes(texto) ||
        inspeccion.status.toLowerCase().includes(texto) ||
        false
      );
    });
  }, [busqueda, inspecciones]);

  const totalFuera = inspecciones.filter((inspeccion) =>
    inspeccion.resultados_analisis.some(
      (resultado) => resultado.dentro_especificacion === false
    )
  ).length;
  const totalAjustes = inspecciones.filter((inspeccion) => inspeccion.es_ajuste).length;

  if (vista === "crear") {
    return (
      <FormularioInspeccion
        clientesDisponibles={clientes}
        equiposDisponibles={equipos}
        lotesDisponibles={lotes}
        onCancelar={cerrarFormulario}
        parametrosDisponibles={parametros}
      />
    );
  }

  if (vista === "editar" && inspeccionEditar) {
    return (
      <FormularioInspeccion
        clientesDisponibles={clientes}
        equiposDisponibles={equipos}
        inspeccion={inspeccionEditar}
        key={inspeccionEditar.id_inspeccion}
        lotesDisponibles={lotes}
        onCancelar={cerrarFormulario}
        parametrosDisponibles={parametros}
      />
    );
  }

  if (vista === "ajuste" && inspeccionAjuste) {
    return (
      <FormularioInspeccion
        clientesDisponibles={clientes}
        equiposDisponibles={equipos}
        inspeccionBase={inspeccionAjuste}
        key={`ajuste-${inspeccionAjuste.id_inspeccion}`}
        lotesDisponibles={lotes}
        onCancelar={cerrarFormulario}
        parametrosDisponibles={parametros}
      />
    );
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm leading-6 text-slate-500">
          Registra inspecciones por lote, captura resultados por parámetro y
          valida el cumplimiento contra límites del cliente o del equipo.
          Desde aquí también puedes generar ajustes trazables y enviar una
          inspección al flujo de certificado.
        </p>
        <Button onClick={() => setVista("crear")} size="3">
          + Nueva inspección
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="tarjeta-suave rounded-[24px] p-5">
          <p className="text-sm font-medium text-slate-500">Total</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {inspecciones.length}
          </p>
        </div>
        <div className="tarjeta-suave rounded-[24px] p-5">
          <p className="text-sm font-medium text-slate-500">Borrador</p>
          <p className="mt-2 text-3xl font-bold text-indigo-600">
            {inspecciones.filter((inspeccion) => inspeccion.status === "borrador").length}
          </p>
        </div>
        <div className="tarjeta-suave rounded-[24px] p-5">
          <p className="text-sm font-medium text-slate-500">Ajustes</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {totalAjustes}
          </p>
        </div>
        <div className="tarjeta-suave rounded-[24px] p-5">
          <p className="text-sm font-medium text-slate-500">Fuera de rango</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{totalFuera}</p>
        </div>
      </div>

      <div className="tarjeta-suave flex items-center gap-3 rounded-[24px] px-4 py-3">
        <IconoBuscar className="text-slate-400" />
        <input
          className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Buscar por lote, secuencia, cliente o estado..."
          type="text"
          value={busqueda}
        />
      </div>

      <article className="tarjeta-suave overflow-hidden rounded-[28px]">
        {cargando ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-slate-400">Cargando inspecciones...</p>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-sm text-slate-500">
              {busqueda
                ? "No se encontraron inspecciones con esa búsqueda."
                : "Aún no hay inspecciones registradas."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 p-4 md:hidden">
              {filtrados.map((inspeccion) => {
                const fuera = inspeccion.resultados_analisis.filter(
                  (resultado) => resultado.dentro_especificacion === false
                ).length;

                return (
                  <article
                    className="rounded-[22px] border border-slate-200/80 bg-white/80 p-4"
                    key={inspeccion.id_inspeccion}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-xs uppercase tracking-wide text-slate-400">
                          {inspeccion.lotes_produccion?.numero_lote || "Sin lote"}
                        </p>
                        <h3 className="mt-1 text-base font-semibold text-slate-900">
                          Secuencia {inspeccion.secuencia}
                        </h3>
                      </div>
                      <Badge
                        color={fuera > 0 ? "red" : "jade"}
                        radius="full"
                        variant="soft"
                      >
                        {fuera > 0 ? `${fuera} fuera` : "En rango"}
                      </Badge>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge color="violet" radius="full" variant="soft">
                        {inspeccion.status}
                      </Badge>
                      {inspeccion.es_ajuste ? (
                        <Badge color="amber" radius="full" variant="soft">
                          Ajuste
                        </Badge>
                      ) : null}
                      <Badge color="gray" radius="full" variant="soft">
                        {inspeccion.resultados_analisis.length} resultados
                      </Badge>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-slate-500">
                      {inspeccion.clientes?.nombre ? (
                        <p>{inspeccion.clientes.nombre}</p>
                      ) : (
                        <p>Sin cliente asociado</p>
                      )}
                      {inspeccion.es_ajuste && inspeccion.id_inspeccion_base ? (
                        <p>Ajuste sobre inspección base #{inspeccion.id_inspeccion_base}</p>
                      ) : null}
                      <p>{new Date(inspeccion.fecha_inspeccion).toLocaleString("es-MX")}</p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        onClick={() => abrirEdicion(inspeccion)}
                        size="2"
                        variant="soft"
                      >
                        Editar
                      </Button>
                      <Button
                        onClick={() => abrirAjuste(inspeccion)}
                        size="2"
                        variant="soft"
                      >
                        Ajuste
                      </Button>
                      <Link
                        className="inline-flex min-h-9 items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white"
                        href={`/certificados?nueva=${inspeccion.id_inspeccion}`}
                      >
                        Certificar
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/50">
                    <th className="px-5 py-3.5 font-semibold text-slate-500">
                      Lote
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-slate-500">
                      Secuencia
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-slate-500">
                      Cliente
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-slate-500">
                      Resultados
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-slate-500">
                      Cumplimiento
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-slate-500">
                      Estado
                    </th>
                    <th className="px-5 py-3.5 text-right font-semibold text-slate-500">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((inspeccion) => {
                    const fuera = inspeccion.resultados_analisis.filter(
                      (resultado) => resultado.dentro_especificacion === false
                    ).length;

                    return (
                      <tr
                        className="border-b border-slate-100 transition hover:bg-slate-50/50"
                        key={inspeccion.id_inspeccion}
                      >
                        <td className="px-5 py-4 font-mono text-slate-600">
                          {inspeccion.lotes_produccion?.numero_lote || "-"}
                        </td>
                        <td className="px-5 py-4">
                          <Badge color="violet" radius="full" size="1" variant="soft">
                            {inspeccion.secuencia}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">
                            {inspeccion.clientes?.nombre || "Sin cliente"}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {new Date(inspeccion.fecha_inspeccion).toLocaleString("es-MX")}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <Badge color="gray" radius="full" size="1" variant="soft">
                            {inspeccion.resultados_analisis.length}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          <Badge
                            color={fuera > 0 ? "red" : "jade"}
                            radius="full"
                            size="1"
                            variant="soft"
                          >
                            {fuera > 0 ? `${fuera} fuera` : "Dentro de rango"}
                          </Badge>
                          {inspeccion.es_ajuste ? (
                            <Badge color="amber" radius="full" size="1" variant="soft">
                              Ajuste
                            </Badge>
                          ) : null}
                        </td>
                        <td className="px-5 py-4">
                          <Badge color="violet" radius="full" size="1" variant="soft">
                            {inspeccion.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              onClick={() => abrirEdicion(inspeccion)}
                              size="1"
                              variant="soft"
                            >
                              Editar
                            </Button>
                            <Button
                              onClick={() => abrirAjuste(inspeccion)}
                              size="1"
                              variant="soft"
                            >
                              Ajuste
                            </Button>
                            <Link
                              className="inline-flex min-h-8 items-center justify-center rounded-full bg-slate-950 px-3 text-xs font-medium text-white"
                              href={`/certificados?nueva=${inspeccion.id_inspeccion}`}
                            >
                              Certificar
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
