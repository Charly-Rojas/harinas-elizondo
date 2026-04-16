"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Badge, Button } from "@radix-ui/themes";
import { cambiar_estado_parametro } from "@/app/(privado)/parametros/acciones";
import { FormularioParametro } from "@/componentes/panel/formulario-parametro";
import { IconoBuscar } from "@/componentes/panel/iconos";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import type { ParametroCalidad, TipoEquipo } from "@/lib/tipos-dominio";

type Vista = "lista" | "crear" | "editar";

const opcionesEquipo: Array<{ valor: "todos" | TipoEquipo; etiqueta: string }> = [
  { valor: "todos", etiqueta: "Todos" },
  { valor: "alveografo", etiqueta: "Alveógrafo" },
  { valor: "farinografo", etiqueta: "Farinógrafo" },
  { valor: "otro", etiqueta: "Otro" },
];

function colorEquipo(tipo: TipoEquipo) {
  if (tipo === "alveografo") return "indigo";
  if (tipo === "farinografo") return "orange";
  return "gray";
}

export default function PaginaParametros() {
  const [parametros, setParametros] = useState<ParametroCalidad[]>([]);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState<Vista>("lista");
  const [busqueda, setBusqueda] = useState("");
  const [equipoFiltro, setEquipoFiltro] = useState<"todos" | TipoEquipo>("todos");
  const [parametroEditar, setParametroEditar] = useState<
    ParametroCalidad | undefined
  >();
  const [pendiente, iniciarTransicion] = useTransition();

  async function cargarParametros() {
    setCargando(true);
    const supabase = crearClienteNavegador();
    const { data } = await supabase
      .from("parametros_calidad")
      .select("*")
      .order("nombre", { ascending: true });

    setParametros((data ?? []) as ParametroCalidad[]);
    setCargando(false);
  }

  useEffect(() => {
    cargarParametros();
  }, []);

  function cerrarFormulario() {
    setVista("lista");
    setParametroEditar(undefined);
    cargarParametros();
  }

  function abrirEdicion(parametro: ParametroCalidad) {
    setParametroEditar(parametro);
    setVista("editar");
  }

  function manejarCambioEstado(idParametro: number, activo: boolean) {
    iniciarTransicion(async () => {
      const fd = new FormData();
      fd.set("id_parametro", String(idParametro));
      fd.set("activo", String(activo));
      await cambiar_estado_parametro(fd);
      await cargarParametros();
    });
  }

  const filtrados = useMemo(() => {
    return parametros.filter((parametro) => {
      const coincideBusqueda =
        parametro.clave.toLowerCase().includes(busqueda.toLowerCase()) ||
        parametro.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        parametro.unidad_medida?.toLowerCase().includes(busqueda.toLowerCase()) ||
        false;

      const coincideEquipo =
        equipoFiltro === "todos" || parametro.equipo_origen === equipoFiltro;

      return coincideBusqueda && coincideEquipo;
    });
  }, [busqueda, equipoFiltro, parametros]);

  const totalActivos = parametros.filter((parametro) => parametro.activo).length;

  if (vista === "crear") {
    return <FormularioParametro onCancelar={cerrarFormulario} />;
  }

  if (vista === "editar" && parametroEditar) {
    return (
      <FormularioParametro
        key={parametroEditar.id_parametro}
        onCancelar={cerrarFormulario}
        parametro={parametroEditar}
      />
    );
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm leading-6 text-slate-500">
          Mantén el catálogo de factores de calidad que alimentarán equipos,
          inspecciones y certificados.
        </p>
        <Button onClick={() => setVista("crear")} size="3">
          + Nuevo parámetro
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="tarjeta-suave rounded-[24px] p-5">
          <p className="text-sm font-medium text-slate-500">Total</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {parametros.length}
          </p>
        </div>
        <div className="tarjeta-suave rounded-[24px] p-5">
          <p className="text-sm font-medium text-slate-500">Activos</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {totalActivos}
          </p>
        </div>
        <div className="tarjeta-suave rounded-[24px] p-5">
          <p className="text-sm font-medium text-slate-500">Alveógrafo</p>
          <p className="mt-2 text-3xl font-bold text-indigo-600">
            {
              parametros.filter(
                (parametro) => parametro.equipo_origen === "alveografo"
              ).length
            }
          </p>
        </div>
        <div className="tarjeta-suave rounded-[24px] p-5">
          <p className="text-sm font-medium text-slate-500">Farinógrafo</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {
              parametros.filter(
                (parametro) => parametro.equipo_origen === "farinografo"
              ).length
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
            placeholder="Buscar por clave, nombre o unidad..."
            type="text"
            value={busqueda}
          />
        </div>

        <select
          className="campo-formulario"
          onChange={(event) =>
            setEquipoFiltro(event.target.value as "todos" | TipoEquipo)
          }
          value={equipoFiltro}
        >
          {opcionesEquipo.map((opcion) => (
            <option key={opcion.valor} value={opcion.valor}>
              {opcion.etiqueta}
            </option>
          ))}
        </select>
      </div>

      <article className="tarjeta-suave overflow-hidden rounded-[28px]">
        {cargando ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-slate-400">Cargando parámetros...</p>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-sm text-slate-500">
              {busqueda || equipoFiltro !== "todos"
                ? "No se encontraron parámetros con esos filtros."
                : "Aún no hay parámetros registrados."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 p-4 md:hidden">
              {filtrados.map((parametro) => (
                <article
                  className="rounded-[22px] border border-slate-200/80 bg-white/80 p-4"
                  key={parametro.id_parametro}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs uppercase tracking-wide text-slate-400">
                        {parametro.clave}
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-slate-900">
                        {parametro.nombre}
                      </h3>
                    </div>
                    <Badge
                      color={parametro.activo ? "green" : "gray"}
                      radius="full"
                      variant="soft"
                    >
                      {parametro.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge
                      color={colorEquipo(parametro.equipo_origen)}
                      radius="full"
                      variant="soft"
                    >
                      {parametro.equipo_origen}
                    </Badge>
                    {parametro.unidad_medida ? (
                      <Badge color="gray" radius="full" variant="soft">
                        {parametro.unidad_medida}
                      </Badge>
                    ) : null}
                  </div>

                  {parametro.descripcion ? (
                    <p className="mt-4 text-sm leading-6 text-slate-500">
                      {parametro.descripcion}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      onClick={() => abrirEdicion(parametro)}
                      size="2"
                      variant="soft"
                    >
                      Editar
                    </Button>
                    <Button
                      color={parametro.activo ? "red" : "green"}
                      disabled={pendiente}
                      onClick={() =>
                        manejarCambioEstado(
                          parametro.id_parametro,
                          !parametro.activo
                        )
                      }
                      size="2"
                      variant="soft"
                    >
                      {parametro.activo ? "Inactivar" : "Activar"}
                    </Button>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/50">
                    <th className="px-5 py-3.5 font-semibold text-slate-500">
                      Clave
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-slate-500">
                      Nombre
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-slate-500">
                      Equipo
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-slate-500">
                      Unidad
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
                  {filtrados.map((parametro) => (
                    <tr
                      className="border-b border-slate-100 transition hover:bg-slate-50/50"
                      key={parametro.id_parametro}
                    >
                      <td className="px-5 py-4 font-mono text-slate-600">
                        {parametro.clave}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {parametro.nombre}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {parametro.descripcion || "Sin descripción"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          color={colorEquipo(parametro.equipo_origen)}
                          radius="full"
                          size="1"
                          variant="soft"
                        >
                          {parametro.equipo_origen}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {parametro.unidad_medida || "-"}
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          color={parametro.activo ? "green" : "gray"}
                          radius="full"
                          size="1"
                          variant="soft"
                        >
                          {parametro.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => abrirEdicion(parametro)}
                            size="1"
                            variant="soft"
                          >
                            Editar
                          </Button>
                          <Button
                            color={parametro.activo ? "red" : "green"}
                            disabled={pendiente}
                            onClick={() =>
                              manejarCambioEstado(
                                parametro.id_parametro,
                                !parametro.activo
                              )
                            }
                            size="1"
                            variant="soft"
                          >
                            {parametro.activo ? "Inactivar" : "Activar"}
                          </Button>
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
