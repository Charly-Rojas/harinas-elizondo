"use client";

import { useEffect, useState, useTransition } from "react";
import { Badge, Button } from "@radix-ui/themes";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import { cambiar_status_cliente } from "@/app/(privado)/clientes/acciones";
import { FormularioCliente } from "@/componentes/panel/formulario-cliente";
import { IconoBuscar } from "@/componentes/panel/iconos";
import type { Cliente } from "@/lib/tipos-clientes";

type Vista = "lista" | "crear" | "editar";

export default function PaginaClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [vista, setVista] = useState<Vista>("lista");
  const [clienteEditar, setClienteEditar] = useState<Cliente | undefined>();
  const [pendiente, iniciarTransicion] = useTransition();

  async function cargarClientes() {
    setCargando(true);
    const supabase = crearClienteNavegador();
    const { data } = await supabase
      .from("clientes")
      .select("*")
      .order("nombre", { ascending: true });
    setClientes((data ?? []) as Cliente[]);
    setCargando(false);
  }

  useEffect(() => {
    cargarClientes();
  }, []);

  function abrirEdicion(cliente: Cliente) {
    setClienteEditar(cliente);
    setVista("editar");
  }

  function cerrarFormulario() {
    setVista("lista");
    setClienteEditar(undefined);
    cargarClientes();
  }

  function manejarCambioStatus(idCliente: number, nuevoStatus: string) {
    iniciarTransicion(async () => {
      const fd = new FormData();
      fd.set("id_cliente", String(idCliente));
      fd.set("nuevo_status", nuevoStatus);
      await cambiar_status_cliente(fd);
      await cargarClientes();
    });
  }

  const filtrados = clientes.filter((c) => {
    const texto = busqueda.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(texto) ||
      c.rfc.toLowerCase().includes(texto) ||
      String(c.id_cliente).includes(texto)
    );
  });

  const totalActivos = clientes.filter((c) => c.status === "activo").length;
  const totalCertificado = clientes.filter((c) => c.solicita_certificado).length;

  // ─── Vista de formulario ───
  if (vista === "crear") {
    return <FormularioCliente onCancelar={cerrarFormulario} />;
  }

  if (vista === "editar" && clienteEditar) {
    return (
      <FormularioCliente
        cliente={clienteEditar}
        onCancelar={cerrarFormulario}
      />
    );
  }

  // ─── Vista de lista ───
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm leading-6 text-slate-500">
          Gestiona los clientes registrados con su información fiscal y
          preferencias de certificado.
        </p>
        <Button onClick={() => setVista("crear")} size="3">
          + Nuevo cliente
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="tarjeta-suave rounded-[24px] p-5">
          <p className="text-sm font-medium text-slate-500">Total</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {clientes.length}
          </p>
        </div>
        <div className="tarjeta-suave rounded-[24px] p-5">
          <p className="text-sm font-medium text-slate-500">Activos</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {totalActivos}
          </p>
        </div>
        <div className="tarjeta-suave rounded-[24px] p-5">
          <p className="text-sm font-medium text-slate-500">Con certificado</p>
          <p className="mt-2 text-3xl font-bold text-indigo-600">
            {totalCertificado}
          </p>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="tarjeta-suave flex items-center gap-3 rounded-[24px] px-4 py-3">
        <IconoBuscar className="text-slate-400" />
        <input
          className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, RFC o ID SAP..."
          type="text"
          value={busqueda}
        />
      </div>

      {/* Tabla */}
      <article className="tarjeta-suave overflow-hidden rounded-[28px]">
        {cargando ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-slate-400">Cargando clientes...</p>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-sm text-slate-500">
              {busqueda
                ? "No se encontraron clientes con esa búsqueda."
                : "Aún no hay clientes registrados."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/50">
                  <th className="px-5 py-3.5 font-semibold text-slate-500">
                    ID SAP
                  </th>
                  <th className="px-5 py-3.5 font-semibold text-slate-500">
                    Cliente
                  </th>
                  <th className="hidden px-5 py-3.5 font-semibold text-slate-500 md:table-cell">
                    RFC
                  </th>
                  <th className="hidden px-5 py-3.5 font-semibold text-slate-500 lg:table-cell">
                    Certificado
                  </th>
                  <th className="px-5 py-3.5 font-semibold text-slate-500">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-right font-semibold text-slate-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((cliente) => (
                  <tr
                    className="border-b border-slate-100 transition hover:bg-slate-50/50"
                    key={cliente.id_cliente}
                  >
                    <td className="px-5 py-4 font-mono text-slate-600">
                      {cliente.id_cliente}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {cliente.nombre}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {cliente.domicilio_fiscal}
                      </p>
                    </td>
                    <td className="hidden px-5 py-4 font-mono text-slate-600 md:table-cell">
                      {cliente.rfc}
                    </td>
                    <td className="hidden px-5 py-4 lg:table-cell">
                      {cliente.solicita_certificado ? (
                        <Badge
                          color="green"
                          radius="full"
                          size="1"
                          variant="soft"
                        >
                          Sí
                        </Badge>
                      ) : (
                        <Badge
                          color="gray"
                          radius="full"
                          size="1"
                          variant="soft"
                        >
                          No
                        </Badge>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        color={
                          cliente.status === "activo" ? "green" : "red"
                        }
                        radius="full"
                        size="1"
                        variant="soft"
                      >
                        {cliente.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          onClick={() => abrirEdicion(cliente)}
                          size="1"
                          variant="soft"
                        >
                          Editar
                        </Button>
                        {cliente.status === "activo" ? (
                          <Button
                            color="red"
                            disabled={pendiente}
                            onClick={() =>
                              manejarCambioStatus(
                                cliente.id_cliente,
                                "inactivo"
                              )
                            }
                            size="1"
                            variant="soft"
                          >
                            Inactivar
                          </Button>
                        ) : (
                          <Button
                            color="green"
                            disabled={pendiente}
                            onClick={() =>
                              manejarCambioStatus(
                                cliente.id_cliente,
                                "activo"
                              )
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
        )}
      </article>
    </section>
  );
}
