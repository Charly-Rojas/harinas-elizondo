"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Button } from "@radix-ui/themes";
import { FormularioLote } from "@/componentes/panel/formulario-lote";
import { IconoBuscar } from "@/componentes/panel/iconos";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import type { LoteConRelaciones, ProductoLigero } from "@/lib/tipos-dominio";

type Vista = "lista" | "crear" | "editar";

export default function PaginaLotes() {
  const [lotes, setLotes] = useState<LoteConRelaciones[]>([]);
  const [productos, setProductos] = useState<ProductoLigero[]>([]);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState<Vista>("lista");
  const [busqueda, setBusqueda] = useState("");
  const [loteEditar, setLoteEditar] = useState<LoteConRelaciones | undefined>();

  async function cargarDatos() {
    setCargando(true);
    const supabase = crearClienteNavegador();

    const [{ data: lotesData }, { data: productosData }] = await Promise.all([
      supabase
        .from("lotes_produccion")
        .select("*, productos(*), inspecciones(*)")
        .order("creado_en", { ascending: false }),
      supabase
        .from("productos")
        .select("id_producto, clave, nombre, activo")
        .eq("activo", true)
        .order("nombre", { ascending: true }),
    ]);

    setLotes((lotesData ?? []) as LoteConRelaciones[]);
    setProductos((productosData ?? []) as ProductoLigero[]);
    setCargando(false);
  }

  useEffect(() => {
    async function inicializar() {
      await cargarDatos();
    }

    void inicializar();
  }, []);

  function abrirEdicion(lote: LoteConRelaciones) {
    setLoteEditar(lote);
    setVista("editar");
  }

  function cerrarFormulario() {
    setVista("lista");
    setLoteEditar(undefined);
    cargarDatos();
  }

  const filtrados = useMemo(() => {
    return lotes.filter((lote) => {
      const texto = busqueda.toLowerCase();
      return (
        lote.numero_lote.toLowerCase().includes(texto) ||
        lote.variedad?.toLowerCase().includes(texto) ||
        lote.productos?.nombre?.toLowerCase().includes(texto) ||
        false
      );
    });
  }, [busqueda, lotes]);

  if (vista === "crear") {
    return (
      <FormularioLote
        onCancelar={cerrarFormulario}
        productosDisponibles={productos}
      />
    );
  }

  if (vista === "editar" && loteEditar) {
    return (
      <FormularioLote
        key={loteEditar.id_lote}
        lote={loteEditar}
        onCancelar={cerrarFormulario}
        productosDisponibles={productos}
      />
    );
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm leading-6 text-slate-500">
          Registra los lotes de producción que servirán como base para las
          inspecciones y los certificados.
        </p>
        <Button onClick={() => setVista("crear")} size="3">
          + Nuevo lote
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="tarjeta-suave rounded-[24px] p-5">
          <p className="text-sm font-medium text-slate-500">Total</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {lotes.length}
          </p>
        </div>
        <div className="tarjeta-suave rounded-[24px] p-5">
          <p className="text-sm font-medium text-slate-500">Con inspecciones</p>
          <p className="mt-2 text-3xl font-bold text-indigo-600">
            {lotes.filter((lote) => (lote.inspecciones?.length ?? 0) > 0).length}
          </p>
        </div>
        <div className="tarjeta-suave rounded-[24px] p-5">
          <p className="text-sm font-medium text-slate-500">Sin inspecciones</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {lotes.filter((lote) => (lote.inspecciones?.length ?? 0) === 0).length}
          </p>
        </div>
        <div className="tarjeta-suave rounded-[24px] p-5">
          <p className="text-sm font-medium text-slate-500">Productos activos</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {productos.length}
          </p>
        </div>
      </div>

      <div className="tarjeta-suave flex items-center gap-3 rounded-[24px] px-4 py-3">
        <IconoBuscar className="text-slate-400" />
        <input
          className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Buscar por lote, variedad o producto..."
          type="text"
          value={busqueda}
        />
      </div>

      <article className="tarjeta-suave overflow-hidden rounded-[28px]">
        {cargando ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-slate-400">Cargando lotes...</p>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-sm text-slate-500">
              {busqueda
                ? "No se encontraron lotes con esa búsqueda."
                : "Aún no hay lotes registrados."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 p-4 md:hidden">
              {filtrados.map((lote) => (
                <article
                  className="rounded-[22px] border border-slate-200/80 bg-white/80 p-4"
                  key={lote.id_lote}
                >
                  <p className="font-mono text-xs uppercase tracking-wide text-slate-400">
                    {lote.numero_lote}
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-slate-900">
                    {lote.productos?.nombre || lote.variedad || "Sin producto"}
                  </h3>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge color="blue" radius="full" variant="soft">
                      {(lote.inspecciones?.length ?? 0) > 0
                        ? `${lote.inspecciones?.length ?? 0} inspecciones`
                        : "Sin inspecciones"}
                    </Badge>
                    {lote.fecha_produccion ? (
                      <Badge color="gray" radius="full" variant="soft">
                        Prod. {lote.fecha_produccion}
                      </Badge>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      onClick={() => abrirEdicion(lote)}
                      size="2"
                      variant="soft"
                    >
                      Editar
                    </Button>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/50">
                    <th className="px-5 py-3.5 font-semibold text-slate-500">
                      Lote
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-slate-500">
                      Producto / variedad
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-slate-500">
                      Producción
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-slate-500">
                      Caducidad
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-slate-500">
                      Inspecciones
                    </th>
                    <th className="px-5 py-3.5 text-right font-semibold text-slate-500">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((lote) => (
                    <tr
                      className="border-b border-slate-100 transition hover:bg-slate-50/50"
                      key={lote.id_lote}
                    >
                      <td className="px-5 py-4 font-mono text-slate-600">
                        {lote.numero_lote}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {lote.productos?.nombre || lote.variedad || "Sin producto"}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {lote.productos?.clave || lote.variedad || "Sin clave"}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {lote.fecha_produccion || "-"}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {lote.fecha_caducidad || "-"}
                      </td>
                      <td className="px-5 py-4">
                        <Badge color="blue" radius="full" size="1" variant="soft">
                          {lote.inspecciones?.length ?? 0}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => abrirEdicion(lote)}
                            size="1"
                            variant="soft"
                          >
                            Editar
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
