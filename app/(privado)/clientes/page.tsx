"use client";

import { useEffect, useState, useTransition } from "react";
import { Badge, Button } from "@radix-ui/themes";
import { cambiar_status_cliente } from "@/app/(privado)/clientes/acciones";
import { FormularioCliente } from "@/componentes/panel/formulario-cliente";
import { IconoBuscar } from "@/componentes/panel/iconos";
import { crearClienteNavegador } from "@/lib/supabase/cliente";
import type { ClienteConRelaciones } from "@/lib/tipos-clientes";

type Vista = "lista" | "crear" | "editar" | "ver";

type ConfirmacionStatusCliente = {
  cliente: ClienteConRelaciones;
  nuevoStatus: "inactivo" | "baja";
};

function colorStatusCliente(status: ClienteConRelaciones["status"]) {
  if (status === "activo") return "green";
  if (status === "inactivo") return "orange";
  return "gray";
}

function textoStatusCliente(status: ClienteConRelaciones["status"]) {
  if (status === "baja") return "Dado de baja";
  return status;
}

function DetalleCliente({
  cliente,
  onVolver,
}: {
  cliente: ClienteConRelaciones;
  onVolver: () => void;
}) {
  return (
    <article className="flex flex-col gap-5">
      <section className="tarjeta-suave rounded-[28px] p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400">
              ID SAP {cliente.id_cliente}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              {cliente.nombre}
            </h2>
            <p className="mt-2 text-sm text-slate-500">{cliente.rfc}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              color={colorStatusCliente(cliente.status)}
              radius="full"
              size="2"
              variant="soft"
            >
              {textoStatusCliente(cliente.status)}
            </Badge>
            <Badge
              color={cliente.solicita_certificado ? "indigo" : "gray"}
              radius="full"
              size="2"
              variant="soft"
            >
              {cliente.solicita_certificado ? "Solicita certificado" : "Sin certificado"}
            </Badge>
          </div>
        </div>
      </section>

      <section className="tarjeta-suave rounded-[28px] p-5 md:p-6">
        <h3 className="text-lg font-semibold text-slate-900">Datos generales</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-[24px] border border-slate-200/80 bg-white/80 p-4">
            <p className="text-sm font-medium text-slate-500">ID SAP</p>
            <p className="mt-2 font-mono text-base text-slate-900">{cliente.id_cliente}</p>
          </div>
          <div className="rounded-[24px] border border-slate-200/80 bg-white/80 p-4">
            <p className="text-sm font-medium text-slate-500">RFC</p>
            <p className="mt-2 font-mono text-base text-slate-900">{cliente.rfc}</p>
          </div>
          <div className="rounded-[24px] border border-slate-200/80 bg-white/80 p-4 md:col-span-2 xl:col-span-1">
            <p className="text-sm font-medium text-slate-500">Contacto del certificado</p>
            <p className="mt-2 text-base text-slate-900">
              {cliente.contacto_certificado || "Sin contacto registrado"}
            </p>
          </div>
          <div className="rounded-[24px] border border-slate-200/80 bg-white/80 p-4 md:col-span-2 xl:col-span-3">
            <p className="text-sm font-medium text-slate-500">Domicilio fiscal</p>
            <p className="mt-2 text-base leading-7 text-slate-900">
              {cliente.domicilio_fiscal}
            </p>
          </div>
        </div>
      </section>

      <section className="tarjeta-suave rounded-[28px] p-5 md:p-6">
        <h3 className="text-lg font-semibold text-slate-900">Contactos y correos</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-[24px] border border-slate-200/80 bg-white/80 p-4">
            <p className="text-sm font-medium text-slate-500">Correo contacto cliente</p>
            <p className="mt-2 text-base text-slate-900">
              {cliente.correo_contacto_cliente || "No capturado"}
            </p>
          </div>
          <div className="rounded-[24px] border border-slate-200/80 bg-white/80 p-4">
            <p className="text-sm font-medium text-slate-500">Correo almacenista</p>
            <p className="mt-2 text-base text-slate-900">
              {cliente.correo_almacenista || "No capturado"}
            </p>
          </div>
          <div className="rounded-[24px] border border-slate-200/80 bg-white/80 p-4 md:col-span-2">
            <p className="text-sm font-medium text-slate-500">Correo gerente de calidad</p>
            <p className="mt-2 text-base text-slate-900">
              {cliente.correo_gte_calidad || "No capturado"}
            </p>
          </div>
        </div>
      </section>

      <section className="tarjeta-suave rounded-[28px] p-5 md:p-6">
        <h3 className="text-lg font-semibold text-slate-900">Domicilios de entrega</h3>
        {cliente.direcciones.length === 0 ? (
          <div className="mt-5 rounded-[24px] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-500">
            No hay domicilios de entrega registrados.
          </div>
        ) : (
          <div className="mt-5 grid gap-3">
            {cliente.direcciones.map((direccion) => (
              <div
                className="rounded-[24px] border border-slate-200/80 bg-white/80 p-4"
                key={direccion.id_direccion}
              >
                <p className="text-sm font-medium text-slate-500">{direccion.etiqueta}</p>
                <p className="mt-2 text-base text-slate-900">{direccion.direccion}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="tarjeta-suave rounded-[28px] p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Especificaciones del cliente
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {cliente.usa_especificaciones_cliente
                ? "Límites particulares configurados para este cliente."
                : "Este cliente usa límites generales."}
            </p>
          </div>
          <Badge
            color={cliente.usa_especificaciones_cliente ? "amber" : "gray"}
            radius="full"
            size="1"
            variant="soft"
          >
            {cliente.usa_especificaciones_cliente
              ? `${cliente.param_ref_cliente.length} parámetros`
              : "Sin parámetros"}
          </Badge>
        </div>

        {cliente.usa_especificaciones_cliente && cliente.param_ref_cliente.length > 0 ? (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/50">
                  <th className="px-4 py-3 font-semibold text-slate-500">Clave</th>
                  <th className="px-4 py-3 font-semibold text-slate-500">Nombre</th>
                  <th className="px-4 py-3 font-semibold text-slate-500">Unidad</th>
                  <th className="px-4 py-3 font-semibold text-slate-500">Lím. mín.</th>
                  <th className="px-4 py-3 font-semibold text-slate-500">Lím. máx.</th>
                </tr>
              </thead>
              <tbody>
                {cliente.param_ref_cliente.map((parametro) => (
                  <tr
                    className="border-b border-slate-100"
                    key={`${parametro.id}-${parametro.clave_parametro}`}
                  >
                    <td className="px-4 py-3 font-mono text-slate-700">
                      {parametro.clave_parametro || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-900">{parametro.nombre}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {parametro.unidad_medida || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {parametro.lim_min ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {parametro.lim_max ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <div className="flex flex-wrap gap-3">
        <Button color="gray" onClick={onVolver} size="3" variant="soft">
          Volver
        </Button>
      </div>
    </article>
  );
}

export default function PaginaClientes() {
  const [clientes, setClientes] = useState<ClienteConRelaciones[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [vista, setVista] = useState<Vista>("lista");
  const [clienteEditar, setClienteEditar] = useState<
    ClienteConRelaciones | undefined
  >();
  const [clienteDetalle, setClienteDetalle] = useState<
    ClienteConRelaciones | undefined
  >();
  const [confirmacionStatus, setConfirmacionStatus] = useState<
    ConfirmacionStatusCliente | undefined
  >();
  const [motivoStatus, setMotivoStatus] = useState("");
  const [errorMotivo, setErrorMotivo] = useState<string | null>(null);
  const [pendiente, iniciarTransicion] = useTransition();

  async function cargarClientes() {
    setCargando(true);
    const supabase = crearClienteNavegador();
    const { data } = await supabase
      .from("clientes")
      .select("*, direcciones(*), param_ref_cliente(*)")
      .order("nombre", { ascending: true });

    setClientes((data ?? []) as ClienteConRelaciones[]);
    setCargando(false);
  }

  useEffect(() => {
    async function inicializar() {
      await cargarClientes();
    }

    void inicializar();
  }, []);

  function abrirEdicion(cliente: ClienteConRelaciones) {
    setClienteEditar(cliente);
    setVista("editar");
  }

  function abrirDetalle(cliente: ClienteConRelaciones) {
    setClienteDetalle(cliente);
    setVista("ver");
  }

  function cerrarFormulario() {
    setVista("lista");
    setClienteEditar(undefined);
    setClienteDetalle(undefined);
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

  function abrirConfirmacionStatus(
    cliente: ClienteConRelaciones,
    nuevoStatus: "inactivo" | "baja"
  ) {
    setConfirmacionStatus({ cliente, nuevoStatus });
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
      fd.set("id_cliente", String(confirmacionStatus.cliente.id_cliente));
      fd.set("nuevo_status", confirmacionStatus.nuevoStatus);
      fd.set("motivo", motivo);
      await cambiar_status_cliente(fd);
      cerrarConfirmacionStatus();
      await cargarClientes();
    });
  }

  const filtrados = clientes.filter((cliente) => {
    const texto = busqueda.toLowerCase();
    return (
      cliente.nombre.toLowerCase().includes(texto) ||
      cliente.rfc.toLowerCase().includes(texto) ||
      String(cliente.id_cliente).includes(texto) ||
      cliente.contacto_certificado?.toLowerCase().includes(texto) ||
      false
    );
  });

  const totalActivos = clientes.filter((cliente) => cliente.status === "activo").length;
  const totalCertificado = clientes.filter(
    (cliente) => cliente.solicita_certificado
  ).length;
  const totalConEspecificaciones = clientes.filter(
    (cliente) => cliente.usa_especificaciones_cliente
  ).length;

  if (vista === "crear") {
    return <FormularioCliente onCancelar={cerrarFormulario} />;
  }

  if (vista === "editar" && clienteEditar) {
    return (
      <FormularioCliente
        cliente={clienteEditar}
        key={clienteEditar.id_cliente}
        onCancelar={cerrarFormulario}
      />
    );
  }

  if (vista === "ver" && clienteDetalle) {
    return (
      <DetalleCliente
        cliente={clienteDetalle}
        onVolver={() => {
          setVista("lista");
          setClienteDetalle(undefined);
        }}
      />
    );
  }

  return (
    <>
      <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm leading-6 text-slate-500">
          Gestiona clientes, contactos y especificaciones particulares de
          calidad para la emisión de certificados.
        </p>
        <Button onClick={() => setVista("crear")} size="3">
          + Nuevo cliente
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
        <div className="tarjeta-suave rounded-[24px] p-5">
          <p className="text-sm font-medium text-slate-500">
            Con especificaciones
          </p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {totalConEspecificaciones}
          </p>
        </div>
      </div>

      <div className="tarjeta-suave flex items-center gap-3 rounded-[24px] px-4 py-3">
        <IconoBuscar className="text-slate-400" />
        <input
          className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, RFC, contacto o ID SAP..."
          type="text"
          value={busqueda}
        />
      </div>

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
          <>
            <div className="grid gap-3 p-4 md:hidden">
              {filtrados.map((cliente) => (
                <article
                  className="rounded-[22px] border border-slate-200/80 bg-white/80 p-4"
                  key={cliente.id_cliente}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs uppercase tracking-wide text-slate-400">
                        ID SAP {cliente.id_cliente}
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-slate-900">
                        {cliente.nombre}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">{cliente.rfc}</p>
                    </div>
                    <Badge
                      color={cliente.status === "activo" ? "green" : "red"}
                      radius="full"
                      variant="soft"
                    >
                      {cliente.status}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-500">
                    <p>{cliente.domicilio_fiscal}</p>
                    {cliente.contacto_certificado ? (
                      <p>Contacto: {cliente.contacto_certificado}</p>
                    ) : null}
                    {cliente.correo_contacto_cliente ? (
                      <p>{cliente.correo_contacto_cliente}</p>
                    ) : null}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge color="indigo" radius="full" variant="soft">
                      {cliente.solicita_certificado
                        ? "Certificado"
                        : "Sin certificado"}
                    </Badge>
                    <Badge
                      color={
                        cliente.usa_especificaciones_cliente ? "amber" : "gray"
                      }
                      radius="full"
                      variant="soft"
                    >
                      {cliente.usa_especificaciones_cliente
                        ? `${cliente.param_ref_cliente.length} parámetros`
                        : "Límites generales"}
                    </Badge>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      onClick={() => abrirDetalle(cliente)}
                      size="2"
                      variant="outline"
                    >
                      Ver
                    </Button>
                    <Button
                      onClick={() => abrirEdicion(cliente)}
                      size="2"
                      variant="soft"
                    >
                      Editar
                    </Button>
                    {cliente.status === "baja" ? (
                      <Badge color="gray" radius="full" variant="soft">
                        Dado de baja
                      </Badge>
                    ) : cliente.status === "activo" ? (
                      <>
                      <Button
                        color="red"
                        disabled={pendiente}
                        onClick={() => abrirConfirmacionStatus(cliente, "inactivo")}
                        size="2"
                        variant="soft"
                      >
                        Inactivar
                      </Button>
                      <Button
                        color="crimson"
                        disabled={pendiente}
                        onClick={() => abrirConfirmacionStatus(cliente, "baja")}
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
                        onClick={() =>
                          manejarCambioStatus(cliente.id_cliente, "activo")
                        }
                        size="2"
                        variant="soft"
                      >
                        Activar
                      </Button>
                      <Button
                        color="crimson"
                        disabled={pendiente}
                        onClick={() => abrirConfirmacionStatus(cliente, "baja")}
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
              <table className="w-full min-w-[940px] text-left text-sm">
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
                    <th className="hidden px-5 py-3.5 font-semibold text-slate-500 xl:table-cell">
                      Especificaciones
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
                          {cliente.contacto_certificado || cliente.domicilio_fiscal}
                        </p>
                      </td>
                      <td className="hidden px-5 py-4 font-mono text-slate-600 md:table-cell">
                        {cliente.rfc}
                      </td>
                      <td className="hidden px-5 py-4 lg:table-cell">
                        <Badge
                          color={cliente.solicita_certificado ? "green" : "gray"}
                          radius="full"
                          size="1"
                          variant="soft"
                        >
                          {cliente.solicita_certificado ? "Sí" : "No"}
                        </Badge>
                      </td>
                      <td className="hidden px-5 py-4 xl:table-cell">
                        <Badge
                          color={
                            cliente.usa_especificaciones_cliente ? "amber" : "gray"
                          }
                          radius="full"
                          size="1"
                          variant="soft"
                        >
                          {cliente.usa_especificaciones_cliente
                            ? `${cliente.param_ref_cliente.length} parámetros`
                            : "Generales"}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          color={colorStatusCliente(cliente.status)}
                          radius="full"
                          size="1"
                          variant="soft"
                        >
                          {textoStatusCliente(cliente.status)}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => abrirDetalle(cliente)}
                            size="1"
                            variant="outline"
                          >
                            Ver
                          </Button>
                          <Button
                            onClick={() => abrirEdicion(cliente)}
                            size="1"
                            variant="soft"
                          >
                            Editar
                          </Button>
                          {cliente.status === "baja" ? (
                            <Badge color="gray" radius="full" size="1" variant="soft">
                              Dado de baja
                            </Badge>
                          ) : cliente.status === "activo" ? (
                            <>
                            <Button
                              color="red"
                              disabled={pendiente}
                              onClick={() => abrirConfirmacionStatus(cliente, "inactivo")}
                              size="1"
                              variant="soft"
                            >
                              Inactivar
                            </Button>
                            <Button
                              color="crimson"
                              disabled={pendiente}
                              onClick={() => abrirConfirmacionStatus(cliente, "baja")}
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
                                manejarCambioStatus(cliente.id_cliente, "activo")
                              }
                              size="1"
                              variant="soft"
                            >
                              Activar
                            </Button>
                            <Button
                              color="crimson"
                              disabled={pendiente}
                              onClick={() => abrirConfirmacionStatus(cliente, "baja")}
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
              {confirmacionStatus.nuevoStatus === "baja" ? "Dar de baja cliente" : "Inactivar cliente"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              ¿Seguro que deseas{" "}
              {confirmacionStatus.nuevoStatus === "baja" ? "dar de baja" : "inactivar"} a{" "}
              <strong className="text-slate-900">{confirmacionStatus.cliente.nombre}</strong>?
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
