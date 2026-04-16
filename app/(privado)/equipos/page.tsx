"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Badge, Button } from "@radix-ui/themes";
import { cambiar_status_equipo } from "@/app/(privado)/equipos/acciones";
import { FormularioEquipo } from "@/componentes/panel/formulario-equipo";
import { IconoBuscar } from "@/componentes/panel/iconos";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import type {
  EquipoConRelaciones,
  ParametroCalidad,
  TipoEquipo,
} from "@/lib/tipos-dominio";

type Vista = "lista" | "crear" | "editar";

const opcionesFiltro: Array<{ valor: "todos" | TipoEquipo; etiqueta: string }> = [
  { valor: "todos", etiqueta: "Todos" },
  { valor: "alveografo", etiqueta: "Alveógrafo" },
  { valor: "farinografo", etiqueta: "Farinógrafo" },
  { valor: "otro", etiqueta: "Otro" },
];

function colorTipo(tipo: TipoEquipo) {
  if (tipo === "alveografo") return "indigo";
  if (tipo === "farinografo") return "orange";
  return "gray";
}

export default function PaginaEquipos() {
  const [equipos, setEquipos] = useState<EquipoConRelaciones[]>([]);
  const [parametros, setParametros] = useState<ParametroCalidad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState<Vista>("lista");
  const [busqueda, setBusqueda] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<"todos" | TipoEquipo>("todos");
  const [equipoEditar, setEquipoEditar] = useState<EquipoConRelaciones | undefined>();
  const [pendiente, iniciarTransicion] = useTransition();

  async function cargarDatos() {
    setCargando(true);
    const supabase = crearClienteNavegador();

    const [{ data: equiposData }, { data: parametrosData }] = await Promise.all([
      supabase
        .from("equipos_laboratorio")
        .select("*, equipos_parametros(*, parametros_calidad(*))")
        .order("clave", { ascending: true }),
      supabase
        .from("parametros_calidad")
        .select("*")
        .order("nombre", { ascending: true }),
    ]);

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

  function abrirEdicion(equipo: EquipoConRelaciones) {
    setEquipoEditar(equipo);
    setVista("editar");
  }

  function cerrarFormulario() {
    setVista("lista");
    setEquipoEditar(undefined);
    cargarDatos();
  }

  function manejarCambioStatus(idEquipo: number, status: "activo" | "inactivo") {
    iniciarTransicion(async () => {
      const fd = new FormData();
      fd.set("id_equipo", String(idEquipo));
      fd.set("status", status);
      await cambiar_status_equipo(fd);
      await cargarDatos();
    });
  }

  const filtrados = useMemo(() => {
    return equipos.filter((equipo) => {
      const coincideBusqueda =
        equipo.clave.toLowerCase().includes(busqueda.toLowerCase()) ||
        equipo.descripcion_larga.toLowerCase().includes(busqueda.toLowerCase()) ||
        equipo.marca?.toLowerCase().includes(busqueda.toLowerCase()) ||
        equipo.ubicacion?.toLowerCase().includes(busqueda.toLowerCase()) ||
        false;

      const coincideTipo =
        tipoFiltro === "todos" || equipo.tipo === tipoFiltro;

      return coincideBusqueda && coincideTipo;
    });
  }, [busqueda, equipos, tipoFiltro]);

  const totalActivos = equipos.filter((equipo) => equipo.status === "activo").length;

  if (vista === "crear") {
    return (
      <FormularioEquipo
        onCancelar={cerrarFormulario}
        parametrosDisponibles={parametros}
      />
    );
  }

  if (vista === "editar" && equipoEditar) {
    return (
      <FormularioEquipo
        equipo={equipoEditar}
        key={equipoEditar.id_equipo}
        onCancelar={cerrarFormulario}
        parametrosDisponibles={parametros}
      />
    );
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm leading-6 text-slate-500">
          Administra equipos de laboratorio, su ubicación y los parámetros de
          calidad que pueden medir.
        </p>
        <Button onClick={() => setVista("crear")} size="3">
          + Nuevo equipo
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="tarjeta-suave rounded-[24px] p-5">
          <p className="text-sm font-medium text-slate-500">Total</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {equipos.length}
          </p>
        </div>
        <div className="tarjeta-suave rounded-[24px] p-5">
          <p className="text-sm font-medium text-slate-500">Activos</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {totalActivos}
          </p>
        </div>
        <div className="tarjeta-suave rounded-[24px] p-5">
          <p className="text-sm font-medium text-slate-500">Alveógrafos</p>
          <p className="mt-2 text-3xl font-bold text-indigo-600">
            {
              equipos.filter((equipo) => equipo.tipo === "alveografo").length
            }
          </p>
        </div>
        <div className="tarjeta-suave rounded-[24px] p-5">
          <p className="text-sm font-medium text-slate-500">Farinógrafos</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {
              equipos.filter((equipo) => equipo.tipo === "farinografo").length
            }
          </p>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="tarjeta-suave flex items-center gap-3 rounded-[24px] px-4 py-3">
          <IconoBuscar className="text-slate-400" />
          <input
            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar por clave, descripción, marca o ubicación..."
            type="text"
            value={busqueda}
          />
        </div>

        <select
          className="campo-formulario"
          onChange={(event) =>
            setTipoFiltro(event.target.value as "todos" | TipoEquipo)
          }
          value={tipoFiltro}
        >
          {opcionesFiltro.map((opcion) => (
            <option key={opcion.valor} value={opcion.valor}>
              {opcion.etiqueta}
            </option>
          ))}
        </select>
      </div>

      <article className="tarjeta-suave overflow-hidden rounded-[28px]">
        {cargando ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-slate-400">Cargando equipos...</p>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-sm text-slate-500">
              {busqueda || tipoFiltro !== "todos"
                ? "No se encontraron equipos con esos filtros."
                : "Aún no hay equipos registrados."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 p-4 md:hidden">
              {filtrados.map((equipo) => (
                <article
                  className="rounded-[22px] border border-slate-200/80 bg-white/80 p-4"
                  key={equipo.id_equipo}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs uppercase tracking-wide text-slate-400">
                        {equipo.clave}
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-slate-900">
                        {equipo.descripcion_corta || equipo.descripcion_larga}
                      </h3>
                    </div>
                    <Badge
                      color={equipo.status === "activo" ? "green" : "red"}
                      radius="full"
                      variant="soft"
                    >
                      {equipo.status}
                    </Badge>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge
                      color={colorTipo(equipo.tipo)}
                      radius="full"
                      variant="soft"
                    >
                      {equipo.tipo}
                    </Badge>
                    <Badge color="gray" radius="full" variant="soft">
                      {equipo.equipos_parametros.length} parámetros
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-500">
                    {equipo.marca || equipo.modelo ? (
                      <p>
                        {equipo.marca || "Sin marca"}
                        {equipo.modelo ? ` / ${equipo.modelo}` : ""}
                      </p>
                    ) : null}
                    {equipo.ubicacion ? <p>{equipo.ubicacion}</p> : null}
                    {equipo.responsable ? <p>Resp.: {equipo.responsable}</p> : null}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      onClick={() => abrirEdicion(equipo)}
                      size="2"
                      variant="soft"
                    >
                      Editar
                    </Button>
                    {equipo.status === "activo" ? (
                      <Button
                        color="red"
                        disabled={pendiente}
                        onClick={() =>
                          manejarCambioStatus(equipo.id_equipo, "inactivo")
                        }
                        size="2"
                        variant="soft"
                      >
                        Inactivar
                      </Button>
                    ) : (
                      <Button
                        color="jade"
                        disabled={pendiente}
                        onClick={() =>
                          manejarCambioStatus(equipo.id_equipo, "activo")
                        }
                        size="2"
                        variant="soft"
                      >
                        Activar
                      </Button>
                    )}
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/50">
                    <th className="px-5 py-3.5 font-semibold text-slate-500">
                      Clave
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-slate-500">
                      Equipo
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-slate-500">
                      Tipo
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-slate-500">
                      Ubicación
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-slate-500">
                      Parámetros
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
                  {filtrados.map((equipo) => (
                    <tr
                      className="border-b border-slate-100 transition hover:bg-slate-50/50"
                      key={equipo.id_equipo}
                    >
                      <td className="px-5 py-4 font-mono text-slate-600">
                        {equipo.clave}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {equipo.descripcion_corta || equipo.descripcion_larga}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {equipo.marca || "Sin marca"}
                          {equipo.modelo ? ` / ${equipo.modelo}` : ""}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          color={colorTipo(equipo.tipo)}
                          radius="full"
                          size="1"
                          variant="soft"
                        >
                          {equipo.tipo}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {equipo.ubicacion || "-"}
                      </td>
                      <td className="px-5 py-4">
                        <Badge color="gray" radius="full" size="1" variant="soft">
                          {equipo.equipos_parametros.length} parámetros
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          color={equipo.status === "activo" ? "green" : "red"}
                          radius="full"
                          size="1"
                          variant="soft"
                        >
                          {equipo.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => abrirEdicion(equipo)}
                            size="1"
                            variant="soft"
                          >
                            Editar
                          </Button>
                          {equipo.status === "activo" ? (
                            <Button
                              color="red"
                              disabled={pendiente}
                              onClick={() =>
                                manejarCambioStatus(equipo.id_equipo, "inactivo")
                              }
                              size="1"
                              variant="soft"
                            >
                              Inactivar
                            </Button>
                          ) : (
                            <Button
                              color="jade"
                              disabled={pendiente}
                              onClick={() =>
                                manejarCambioStatus(equipo.id_equipo, "activo")
                              }
                              size="1"
                              variant="soft"
                            >
                              Activar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </article>
    </section>
  );
}
