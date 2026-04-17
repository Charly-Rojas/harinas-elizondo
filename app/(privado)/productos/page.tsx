"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Badge, Button } from "@radix-ui/themes";
import { cambiar_estado_producto } from "@/app/(privado)/productos/acciones";
import { FormularioProducto } from "@/componentes/panel/formulario-producto";
import { IconoBuscar } from "@/componentes/panel/iconos";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import type { LoteProduccion, Producto } from "@/lib/tipos-dominio";

type Vista = "lista" | "crear" | "editar";
type LoteLigero = Pick<LoteProduccion, "id_lote" | "id_producto">;

export default function PaginaProductos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [lotes, setLotes] = useState<LoteLigero[]>([]);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState<Vista>("lista");
  const [busqueda, setBusqueda] = useState("");
  const [productoEditar, setProductoEditar] = useState<Producto | undefined>();
  const [pendiente, iniciarTransicion] = useTransition();

  async function obtenerDatos() {
    const supabase = crearClienteNavegador();

    const [{ data: productosData }, { data: lotesData }] = await Promise.all([
      supabase.from("productos").select("*").order("nombre", { ascending: true }),
      supabase.from("lotes_produccion").select("id_lote, id_producto"),
    ]);

    return {
      productos: (productosData ?? []) as Producto[],
      lotes: (lotesData ?? []) as LoteLigero[],
    };
  }

  async function cargarDatos() {
    setCargando(true);
    const datos = await obtenerDatos();
    setProductos(datos.productos);
    setLotes(datos.lotes);
    setCargando(false);
  }

  useEffect(() => {
    let cancelado = false;

    void obtenerDatos().then((datos) => {
      if (cancelado) return;
      setProductos(datos.productos);
      setLotes(datos.lotes);
      setCargando(false);
    });

    return () => {
      cancelado = true;
    };
  }, []);

  function cerrarFormulario() {
    setVista("lista");
    setProductoEditar(undefined);
    void cargarDatos();
  }

  function abrirEdicion(producto: Producto) {
    setProductoEditar(producto);
    setVista("editar");
  }

  function manejarCambioEstado(idProducto: number, activo: boolean) {
    iniciarTransicion(async () => {
      const fd = new FormData();
      fd.set("id_producto", String(idProducto));
      fd.set("activo", String(activo));
      await cambiar_estado_producto(fd);
      await cargarDatos();
    });
  }

  const usoPorProducto = useMemo(() => {
    const mapa = new Map<number, number>();
    for (const lote of lotes) {
      if (!lote.id_producto) continue;
      mapa.set(lote.id_producto, (mapa.get(lote.id_producto) ?? 0) + 1);
    }
    return mapa;
  }, [lotes]);

  const filtrados = useMemo(() => {
    const texto = busqueda.toLowerCase();
    return productos.filter((producto) => {
      return (
        producto.clave.toLowerCase().includes(texto) ||
        producto.nombre.toLowerCase().includes(texto) ||
        producto.descripcion?.toLowerCase().includes(texto) ||
        false
      );
    });
  }, [busqueda, productos]);

  const totalActivos = productos.filter((producto) => producto.activo).length;
  const totalInactivos = productos.length - totalActivos;
  const totalConLotes = productos.filter(
    (producto) => (usoPorProducto.get(producto.id_producto) ?? 0) > 0
  ).length;

  if (vista === "crear") {
    return <FormularioProducto onCancelar={cerrarFormulario} />;
  }

  if (vista === "editar" && productoEditar) {
    return (
      <FormularioProducto
        key={productoEditar.id_producto}
        onCancelar={cerrarFormulario}
        producto={productoEditar}
      />
    );
  }

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm leading-6 text-slate-500">
          Mantén el catálogo de productos que se asociarán a lotes,
          inspecciones y certificados.
        </p>
        <Button onClick={() => setVista("crear")} size="3">
          + Nuevo producto
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="tarjeta-suave rounded-[24px] p-5">
          <p className="text-sm font-medium text-slate-500">Total</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {productos.length}
          </p>
        </div>
        <div className="tarjeta-suave rounded-[24px] p-5">
          <p className="text-sm font-medium text-slate-500">Activos</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {totalActivos}
          </p>
        </div>
        <div className="tarjeta-suave rounded-[24px] p-5">
          <p className="text-sm font-medium text-slate-500">Inactivos</p>
          <p className="mt-2 text-3xl font-bold text-slate-600">
            {totalInactivos}
          </p>
        </div>
        <div className="tarjeta-suave rounded-[24px] p-5">
          <p className="text-sm font-medium text-slate-500">Con lotes</p>
          <p className="mt-2 text-3xl font-bold text-violet-600">
            {totalConLotes}
          </p>
        </div>
      </div>

      <div className="tarjeta-suave flex items-center gap-3 rounded-[24px] px-4 py-3">
        <IconoBuscar className="text-slate-400" />
        <input
          className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Buscar por clave, nombre o descripción..."
          type="text"
          value={busqueda}
        />
      </div>

      <article className="tarjeta-suave overflow-hidden rounded-[28px]">
        {cargando ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-slate-400">Cargando productos...</p>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-sm text-slate-500">
              {busqueda
                ? "No se encontraron productos con esa búsqueda."
                : "Aún no hay productos registrados."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 p-4 md:hidden">
              {filtrados.map((producto) => (
                <article
                  className="rounded-[22px] border border-slate-200/80 bg-white/80 p-4"
                  key={producto.id_producto}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs uppercase tracking-wide text-slate-400">
                        {producto.clave}
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-slate-900">
                        {producto.nombre}
                      </h3>
                    </div>
                    <Badge
                      color={producto.activo ? "green" : "gray"}
                      radius="full"
                      variant="soft"
                    >
                      {producto.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge color="violet" radius="full" variant="soft">
                      {usoPorProducto.get(producto.id_producto) ?? 0} lotes
                    </Badge>
                  </div>

                  {producto.descripcion ? (
                    <p className="mt-4 text-sm leading-6 text-slate-500">
                      {producto.descripcion}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      onClick={() => abrirEdicion(producto)}
                      size="2"
                      variant="soft"
                    >
                      Editar
                    </Button>
                    <Button
                      color={producto.activo ? "gray" : "jade"}
                      disabled={pendiente}
                      onClick={() =>
                        manejarCambioEstado(producto.id_producto, !producto.activo)
                      }
                      size="2"
                      variant="soft"
                    >
                      {producto.activo ? "Inactivar" : "Activar"}
                    </Button>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/50">
                    <th className="px-5 py-3.5 font-semibold text-slate-500">
                      Clave
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-slate-500">
                      Nombre
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-slate-500">
                      Descripción
                    </th>
                    <th className="px-5 py-3.5 font-semibold text-slate-500">
                      Lotes
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
                  {filtrados.map((producto) => (
                    <tr
                      className="border-b border-slate-100 transition hover:bg-slate-50/50"
                      key={producto.id_producto}
                    >
                      <td className="px-5 py-4 font-mono text-slate-600">
                        {producto.clave}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {producto.nombre}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {producto.descripcion || "-"}
                      </td>
                      <td className="px-5 py-4">
                        <Badge color="violet" radius="full" size="1" variant="soft">
                          {usoPorProducto.get(producto.id_producto) ?? 0}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          color={producto.activo ? "green" : "gray"}
                          radius="full"
                          size="1"
                          variant="soft"
                        >
                          {producto.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => abrirEdicion(producto)}
                            size="1"
                            variant="soft"
                          >
                            Editar
                          </Button>
                          <Button
                            color={producto.activo ? "gray" : "jade"}
                            disabled={pendiente}
                            onClick={() =>
                              manejarCambioEstado(
                                producto.id_producto,
                                !producto.activo
                              )
                            }
                            size="1"
                            variant="soft"
                          >
                            {producto.activo ? "Inactivar" : "Activar"}
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
