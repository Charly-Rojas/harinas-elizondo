"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Badge, Button } from "@radix-ui/themes";
import { cambiar_status_equipo } from "@/app/(privado)/equipos/acciones";
import { FormularioEquipo } from "@/componentes/panel/formulario-equipo";
import { IconoBuscar } from "@/componentes/panel/iconos";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import type {
  EquipoConRelaciones,
  EstadoRegistro,
  TipoEquipo,
} from "@/lib/tipos-dominio";

type Vista = "lista" | "crear" | "editar" | "ver";

type ConfirmacionStatusEquipo = {
  equipo: EquipoConRelaciones;
  nuevoStatus: "inactivo" | "baja";
};

const opcionesFiltro: Array<{ valor: "todos" | TipoEquipo; etiqueta: string }> = [
  { valor: "todos", etiqueta: "Todos" },
  { valor: "alveografo", etiqueta: "Alveografo" },
  { valor: "farinografo", etiqueta: "Farinografo" },
  { valor: "otro", etiqueta: "Otro" },
];

const opcionesStatus: Array<{ valor: "todos" | EstadoRegistro; etiqueta: string }> = [
  { valor: "todos", etiqueta: "Todos" },
  { valor: "activo", etiqueta: "Activo" },
  { valor: "inactivo", etiqueta: "Inactivo" },
  { valor: "baja", etiqueta: "Baja" },
];

function colorTipo(tipo: TipoEquipo) {
  if (tipo === "alveografo") return "indigo";
  if (tipo === "farinografo") return "orange";
  return "gray";
}

function colorStatusEquipo(status: EstadoRegistro) {
  if (status === "activo") return "green";
  if (status === "inactivo") return "orange";
  return "gray";
}

function textoStatusEquipo(status: EstadoRegistro) {
  if (status === "baja") return "Dado de baja";
  return status;
}

function DetalleEquipo({
  equipo,
  onVolver,
}: {
  equipo: EquipoConRelaciones;
  onVolver: () => void;
}) {
  return (
    <article className="flex flex-col gap-5">
      <section className="tarjeta-suave rounded-[28px] p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400">
              {equipo.clave}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              {equipo.descripcion_corta || equipo.descripcion_larga}
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge color={colorTipo(equipo.tipo)} radius="full" size="2" variant="soft">
              {equipo.tipo}
            </Badge>
            <Badge
              color={colorStatusEquipo(equipo.status)}
              radius="full"
              size="2"
              variant="soft"
            >
              {textoStatusEquipo(equipo.status)}
            </Badge>
          </div>
        </div>
      </section>

      <section className="tarjeta-suave rounded-[28px] p-5 md:p-6">
        <h3 className="text-lg font-semibold text-slate-900">Ficha del equipo</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-[24px] border border-slate-200/80 bg-white/80 p-4">
            <p className="text-sm font-medium text-slate-500">Clave</p>
            <p className="mt-2 font-mono text-base text-slate-900">{equipo.clave}</p>
          </div>
          <div className="rounded-[24px] border border-slate-200/80 bg-white/80 p-4">
            <p className="text-sm font-medium text-slate-500">Marca</p>
            <p className="mt-2 text-base text-slate-900">{equipo.marca || "No capturada"}</p>
          </div>
          <div className="rounded-[24px] border border-slate-200/80 bg-white/80 p-4">
            <p className="text-sm font-medium text-slate-500">Modelo</p>
            <p className="mt-2 text-base text-slate-900">{equipo.modelo || "No capturado"}</p>
          </div>
          <div className="rounded-[24px] border border-slate-200/80 bg-white/80 p-4">
            <p className="text-sm font-medium text-slate-500">Serie</p>
            <p className="mt-2 text-base text-slate-900">{equipo.serie || "No capturada"}</p>
          </div>
          <div className="rounded-[24px] border border-slate-200/80 bg-white/80 p-4">
            <p className="text-sm font-medium text-slate-500">Proveedor</p>
            <p className="mt-2 text-base text-slate-900">
              {equipo.proveedor || "No capturado"}
            </p>
          </div>
          <div className="rounded-[24px] border border-slate-200/80 bg-white/80 p-4">
            <p className="text-sm font-medium text-slate-500">Ubicacion</p>
            <p className="mt-2 text-base text-slate-900">{equipo.ubicacion || "No capturada"}</p>
          </div>
          <div className="rounded-[24px] border border-slate-200/80 bg-white/80 p-4">
            <p className="text-sm font-medium text-slate-500">Responsable</p>
            <p className="mt-2 text-base text-slate-900">
              {equipo.responsable || "No capturado"}
            </p>
          </div>
          <div className="rounded-[24px] border border-slate-200/80 bg-white/80 p-4">
            <p className="text-sm font-medium text-slate-500">Fecha de adquisicion</p>
            <p className="mt-2 text-base text-slate-900">
              {equipo.fecha_adquisicion || "No capturada"}
            </p>
          </div>
          <div className="rounded-[24px] border border-slate-200/80 bg-white/80 p-4">
            <p className="text-sm font-medium text-slate-500">Vigencia de garantia</p>
            <p className="mt-2 text-base text-slate-900">
              {equipo.vigencia_garantia || "No capturada"}
            </p>
          </div>
          <div className="rounded-[24px] border border-slate-200/80 bg-white/80 p-4 md:col-span-2 xl:col-span-3">
            <p className="text-sm font-medium text-slate-500">Descripcion</p>
            <p className="mt-2 text-base leading-7 text-slate-900">
              {equipo.descripcion_larga}
            </p>
          </div>
          <div className="rounded-[24px] border border-slate-200/80 bg-white/80 p-4 md:col-span-2 xl:col-span-3">
            <p className="text-sm font-medium text-slate-500">Mantenimiento</p>
            <p className="mt-2 text-base leading-7 text-slate-900">
              {equipo.mantenimiento || "No capturado"}
            </p>
          </div>
          <div className="rounded-[24px] border border-slate-200/80 bg-white/80 p-4 md:col-span-2 xl:col-span-3">
            <p className="text-sm font-medium text-slate-500">Garantia</p>
            <p className="mt-2 text-base leading-7 text-slate-900">
              {equipo.garantia || "No capturada"}
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button color="gray" onClick={onVolver} size="3" variant="soft">
          Volver
        </Button>
      </div>
    </article>
  );
}

export default function PaginaEquipos() {
  const [equipos, setEquipos] = useState<EquipoConRelaciones[]>([]);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState<Vista>("lista");
  const [busqueda, setBusqueda] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<"todos" | TipoEquipo>("todos");
  const [statusFiltro, setStatusFiltro] = useState<"todos" | EstadoRegistro>("todos");
  const [marcaFiltro, setMarcaFiltro] = useState("todas");
  const [equipoEditar, setEquipoEditar] = useState<EquipoConRelaciones | undefined>();
  const [equipoDetalle, setEquipoDetalle] = useState<EquipoConRelaciones | undefined>();
  const [confirmacionStatus, setConfirmacionStatus] = useState<
    ConfirmacionStatusEquipo | undefined
  >();
  const [motivoStatus, setMotivoStatus] = useState("");
  const [errorMotivo, setErrorMotivo] = useState<string | null>(null);
  const [pendiente, iniciarTransicion] = useTransition();

  async function cargarDatos() {
    setCargando(true);
    const supabase = crearClienteNavegador();

    const { data: equiposData } = await supabase
      .from("equipos_laboratorio")
      .select("*")
      .order("clave", { ascending: true });

    setEquipos((equiposData ?? []) as EquipoConRelaciones[]);
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

  function abrirDetalle(equipo: EquipoConRelaciones) {
    setEquipoDetalle(equipo);
    setVista("ver");
  }

  function cerrarFormulario() {
    setVista("lista");
    setEquipoEditar(undefined);
    setEquipoDetalle(undefined);
    cargarDatos();
  }

  function manejarCambioStatus(idEquipo: number, status: "activo") {
    iniciarTransicion(async () => {
      const fd = new FormData();
      fd.set("id_equipo", String(idEquipo));
      fd.set("status", status);
      await cambiar_status_equipo(fd);
      await cargarDatos();
    });
  }

  function abrirConfirmacionStatus(
    equipo: EquipoConRelaciones,
    nuevoStatus: "inactivo" | "baja"
  ) {
    setConfirmacionStatus({ equipo, nuevoStatus });
    setMotivoStatus("");
    setErrorMotivo(null);
  }

  function cerrarConfirmacionStatus() {
    setConfirmacionStatus(undefined);
    setMotivoStatus("");
    setErrorMotivo(null);
  }

  function confirmarCambioStatus() {
    if (!confirmacionStatus) return;

    const motivo = motivoStatus.trim();
    if (motivo.length < 10) {
      setErrorMotivo("El motivo es obligatorio y debe tener al menos 10 caracteres.");
      return;
    }

    iniciarTransicion(async () => {
      const fd = new FormData();
      fd.set("id_equipo", String(confirmacionStatus.equipo.id_equipo));
      fd.set("status", confirmacionStatus.nuevoStatus);
      fd.set("motivo", motivo);
      await cambiar_status_equipo(fd);
      cerrarConfirmacionStatus();
      await cargarDatos();
    });
  }

  const marcasDisponibles = useMemo(() => {
    return Array.from(
      new Set(
        equipos
          .map((equipo) => equipo.marca?.trim())
          .filter((marca): marca is string => Boolean(marca))
      )
    ).sort((a, b) => a.localeCompare(b, "es-MX"));
  }, [equipos]);

  const filtrados = useMemo(() => {
    return equipos.filter((equipo) => {
      const texto = busqueda.toLowerCase();
      const coincideBusqueda =
        equipo.clave.toLowerCase().includes(texto) ||
        equipo.descripcion_larga.toLowerCase().includes(texto) ||
        equipo.marca?.toLowerCase().includes(texto) ||
        equipo.ubicacion?.toLowerCase().includes(texto) ||
        false;

      const coincideTipo = tipoFiltro === "todos" || equipo.tipo === tipoFiltro;
      const coincideStatus =
        statusFiltro === "todos" || equipo.status === statusFiltro;
      const coincideMarca =
        marcaFiltro === "todas" || (equipo.marca?.trim() ?? "") === marcaFiltro;

      return coincideBusqueda && coincideTipo && coincideStatus && coincideMarca;
    });
  }, [busqueda, equipos, marcaFiltro, statusFiltro, tipoFiltro]);

  const totalActivos = equipos.filter((equipo) => equipo.status === "activo").length;

  if (vista === "crear") {
    return <FormularioEquipo onCancelar={cerrarFormulario} />;
  }

  if (vista === "editar" && equipoEditar) {
    return (
      <FormularioEquipo
        equipo={equipoEditar}
        key={equipoEditar.id_equipo}
        onCancelar={cerrarFormulario}
      />
    );
  }

  if (vista === "ver" && equipoDetalle) {
    return (
      <DetalleEquipo
        equipo={equipoDetalle}
        onVolver={() => {
          setVista("lista");
          setEquipoDetalle(undefined);
        }}
      />
    );
  }

  return (
    <>
      <section className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-2xl text-sm leading-6 text-slate-500">
            Administra equipos de laboratorio, su ubicacion y los parametros de
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
            <p className="text-sm font-medium text-slate-500">Alveografos</p>
            <p className="mt-2 text-3xl font-bold text-indigo-600">
              {equipos.filter((equipo) => equipo.tipo === "alveografo").length}
            </p>
          </div>
          <div className="tarjeta-suave rounded-[24px] p-5">
            <p className="text-sm font-medium text-slate-500">Farinografos</p>
            <p className="mt-2 text-3xl font-bold text-amber-600">
              {equipos.filter((equipo) => equipo.tipo === "farinografo").length}
            </p>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px_220px]">
          <div className="tarjeta-suave flex items-center gap-3 rounded-[24px] px-4 py-3">
            <IconoBuscar className="text-slate-400" />
            <input
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar por clave, descripcion, marca o ubicacion..."
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

          <select
            className="campo-formulario"
            onChange={(event) =>
              setStatusFiltro(event.target.value as "todos" | EstadoRegistro)
            }
            value={statusFiltro}
          >
            {opcionesStatus.map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.etiqueta}
              </option>
            ))}
          </select>

          <select
            className="campo-formulario"
            onChange={(event) => setMarcaFiltro(event.target.value)}
            value={marcaFiltro}
          >
            <option value="todas">Todas</option>
            {marcasDisponibles.map((marca) => (
              <option key={marca} value={marca}>
                {marca}
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
                {busqueda || tipoFiltro !== "todos" || statusFiltro !== "todos" || marcaFiltro !== "todas"
                  ? "No se encontraron equipos con esos filtros."
                  : "Aun no hay equipos registrados."}
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
                        color={colorStatusEquipo(equipo.status)}
                        radius="full"
                        variant="soft"
                      >
                        {textoStatusEquipo(equipo.status)}
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
                        onClick={() => abrirDetalle(equipo)}
                        size="2"
                        variant="outline"
                      >
                        Ver
                      </Button>
                      <Button
                        onClick={() => abrirEdicion(equipo)}
                        size="2"
                        variant="soft"
                      >
                        Editar
                      </Button>
                      {equipo.status === "baja" ? (
                        <Badge color="gray" radius="full" variant="soft">
                          Dado de baja
                        </Badge>
                      ) : equipo.status === "activo" ? (
                        <>
                          <Button
                            color="red"
                            disabled={pendiente}
                            onClick={() => abrirConfirmacionStatus(equipo, "inactivo")}
                            size="2"
                            variant="soft"
                          >
                            Inactivar
                          </Button>
                          <Button
                            color="crimson"
                            disabled={pendiente}
                            onClick={() => abrirConfirmacionStatus(equipo, "baja")}
                            size="2"
                            variant="soft"
                          >
                            Dar de baja
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            color="jade"
                            disabled={pendiente}
                            onClick={() => manejarCambioStatus(equipo.id_equipo, "activo")}
                            size="2"
                            variant="soft"
                          >
                            Activar
                          </Button>
                          <Button
                            color="crimson"
                            disabled={pendiente}
                            onClick={() => abrirConfirmacionStatus(equipo, "baja")}
                            size="2"
                            variant="soft"
                          >
                            Dar de baja
                          </Button>
                        </>
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
                        Ubicacion
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
                          <Badge
                            color={colorStatusEquipo(equipo.status)}
                            radius="full"
                            size="1"
                            variant="soft"
                          >
                            {textoStatusEquipo(equipo.status)}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              onClick={() => abrirDetalle(equipo)}
                              size="1"
                              variant="outline"
                            >
                              Ver
                            </Button>
                            <Button
                              onClick={() => abrirEdicion(equipo)}
                              size="1"
                              variant="soft"
                            >
                              Editar
                            </Button>
                            {equipo.status === "baja" ? (
                              <Badge color="gray" radius="full" size="1" variant="soft">
                                Dado de baja
                              </Badge>
                            ) : equipo.status === "activo" ? (
                              <>
                                <Button
                                  color="red"
                                  disabled={pendiente}
                                  onClick={() => abrirConfirmacionStatus(equipo, "inactivo")}
                                  size="1"
                                  variant="soft"
                                >
                                  Inactivar
                                </Button>
                                <Button
                                  color="crimson"
                                  disabled={pendiente}
                                  onClick={() => abrirConfirmacionStatus(equipo, "baja")}
                                  size="1"
                                  variant="soft"
                                >
                                  Dar de baja
                                </Button>
                              </>
                            ) : (
                              <>
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
                                <Button
                                  color="crimson"
                                  disabled={pendiente}
                                  onClick={() => abrirConfirmacionStatus(equipo, "baja")}
                                  size="1"
                                  variant="soft"
                                >
                                  Dar de baja
                                </Button>
                              </>
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

      {confirmacionStatus ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4">
          <div className="tarjeta-suave w-full max-w-xl rounded-[28px] p-5 md:p-6">
            <h2 className="text-xl font-semibold text-slate-900">
              {confirmacionStatus.nuevoStatus === "baja" ? "Dar de baja equipo" : "Inactivar equipo"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              ¿Seguro que deseas{" "}
              {confirmacionStatus.nuevoStatus === "baja" ? "dar de baja" : "inactivar"} a{" "}
              <strong className="text-slate-900">
                {confirmacionStatus.equipo.descripcion_corta ||
                  confirmacionStatus.equipo.clave}
              </strong>
              ?
            </p>

            <div className="mt-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">
                  Motivo
                </span>
                <textarea
                  className="campo-formulario min-h-28 resize-y"
                  onChange={(event) => {
                    setMotivoStatus(event.target.value);
                    if (errorMotivo) setErrorMotivo(null);
                  }}
                  placeholder="Describe el motivo del cambio de estatus..."
                  value={motivoStatus}
                />
              </label>
              {errorMotivo ? (
                <p className="mt-2 text-sm text-red-600">{errorMotivo}</p>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button disabled={pendiente} onClick={confirmarCambioStatus} size="3">
                Confirmar
              </Button>
              <Button
                color="gray"
                disabled={pendiente}
                onClick={cerrarConfirmacionStatus}
                size="3"
                variant="soft"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
