"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Badge, Button } from "@radix-ui/themes";
import {
  crear_cliente,
  editar_cliente,
  type EstadoFormularioCliente,
} from "@/app/(privado)/clientes/acciones";
import {
  direccionEntregaVacia,
  direccionVacia,
  formatearDireccion,
  normalizarDireccionEntregaEntrada,
  normalizarDireccionEntrada,
  parsearDireccionLegacy,
  type DireccionEntregaCaptura,
  type DireccionEstructurada,
} from "@/lib/direcciones";
import {
  obtenerErrorCampo,
  obtenerValor,
  tieneErrorCampo,
} from "@/lib/form-state";
import type { ClienteConRelaciones } from "@/lib/tipos-clientes";

const estadoInicial: EstadoFormularioCliente = {};

type EspecificacionClienteFila = {
  clave_parametro: string;
  nombre: string;
  unidad_medida: string;
  lim_min: string;
  lim_max: string;
};

type ModalDireccionProps = {
  abierta: boolean;
  direccion: DireccionEntregaCaptura;
  titulo: string;
  mostrarEtiqueta?: boolean;
  cargandoCp: boolean;
  colonias: string[];
  errorCp: string | null;
  onCancel: () => void;
  onChange: (campo: keyof DireccionEntregaCaptura, valor: string) => void;
  onSubmit: () => void;
  onBuscarCp: () => void;
};

type RespuestaPostalia = {
  codigo_postal: string;
  ciudad: string;
  estado: string;
  colonias: string[];
};

function CampoError({
  fieldErrors,
  name,
}: {
  fieldErrors: EstadoFormularioCliente["fieldErrors"];
  name: string;
}) {
  const error = obtenerErrorCampo(fieldErrors, name);

  if (!error) return null;

  return <span className="mt-2 block text-xs text-red-600">{error}</span>;
}

function construirEspecificacionesIniciales(cliente?: ClienteConRelaciones) {
  return cliente?.param_ref_cliente?.length
    ? cliente.param_ref_cliente.map((fila) => ({
        clave_parametro: fila.clave_parametro ?? "",
        nombre: fila.nombre,
        unidad_medida: fila.unidad_medida ?? "",
        lim_min: fila.lim_min?.toString() ?? "",
        lim_max: fila.lim_max?.toString() ?? "",
      }))
    : [];
}

function construirDomicilioFiscalInicial(cliente?: ClienteConRelaciones) {
  if (!cliente) return { ...direccionVacia };

  if (cliente.dom_fiscal_calle || cliente.dom_fiscal_colonia) {
    return normalizarDireccionEntrada({
      calle: cliente.dom_fiscal_calle ?? "",
      numero_exterior: cliente.dom_fiscal_numero_exterior ?? "",
      numero_interior: cliente.dom_fiscal_numero_interior ?? "",
      colonia: cliente.dom_fiscal_colonia ?? "",
      ciudad: cliente.dom_fiscal_ciudad ?? "",
      estado: cliente.dom_fiscal_estado ?? "",
      codigo_postal: cliente.dom_fiscal_codigo_postal ?? "",
      pais: cliente.dom_fiscal_pais ?? "Mexico",
    });
  }

  return parsearDireccionLegacy(cliente.domicilio_fiscal);
}

function construirDomiciliosIniciales(cliente?: ClienteConRelaciones) {
  return cliente?.direcciones?.length
    ? cliente.direcciones.map((direccion) =>
        normalizarDireccionEntregaEntrada({
          etiqueta: direccion.etiqueta,
          calle: direccion.calle ?? "",
          numero_exterior: direccion.numero_exterior ?? "",
          numero_interior: direccion.numero_interior ?? "",
          colonia:
            direccion.colonia ??
            parsearDireccionLegacy(direccion.direccion).colonia,
          ciudad:
            direccion.ciudad ??
            parsearDireccionLegacy(direccion.direccion).ciudad,
          estado:
            direccion.estado ??
            parsearDireccionLegacy(direccion.direccion).estado,
          codigo_postal:
            direccion.codigo_postal ??
            parsearDireccionLegacy(direccion.direccion).codigo_postal,
          pais:
            direccion.pais ??
            parsearDireccionLegacy(direccion.direccion).pais,
        })
      )
    : [];
}

function ModalDireccion({
  abierta,
  direccion,
  titulo,
  mostrarEtiqueta = true,
  cargandoCp,
  colonias,
  errorCp,
  onCancel,
  onChange,
  onSubmit,
  onBuscarCp,
}: ModalDireccionProps) {
  if (!abierta) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-3xl rounded-[28px] bg-white p-5 shadow-2xl md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">{titulo}</h3>
            <p className="mt-1 text-sm text-slate-500">
              Usa el código postal para autocompletar estado, ciudad y colonias.
            </p>
          </div>
          <Button color="gray" onClick={onCancel} type="button" variant="soft">
            Cerrar
          </Button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {mostrarEtiqueta ? (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">
                Etiqueta
              </span>
              <input
                className="campo-formulario"
                onChange={(event) => onChange("etiqueta", event.target.value)}
                placeholder="Planta Norte"
                type="text"
                value={direccion.etiqueta}
              />
            </label>
          ) : null}

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Código postal
            </span>
            <div className="flex gap-2">
              <input
                className="campo-formulario"
                onChange={(event) => onChange("codigo_postal", event.target.value)}
                placeholder="06000"
                type="text"
                value={direccion.codigo_postal}
              />
              <Button
                disabled={cargandoCp || direccion.codigo_postal.length !== 5}
                onClick={onBuscarCp}
                type="button"
                variant="soft"
              >
                {cargandoCp ? "Buscando..." : "Buscar"}
              </Button>
            </div>
            {errorCp ? (
              <span className="mt-2 block text-xs text-amber-600">{errorCp}</span>
            ) : null}
          </label>

          <label className="block md:col-span-2 xl:col-span-1">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Calle
            </span>
            <input
              className="campo-formulario"
              onChange={(event) => onChange("calle", event.target.value)}
              placeholder="Av. Industrial"
              type="text"
              value={direccion.calle}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Número exterior
            </span>
            <input
              className="campo-formulario"
              onChange={(event) => onChange("numero_exterior", event.target.value)}
              placeholder="456"
              type="text"
              value={direccion.numero_exterior}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Número interior
            </span>
            <input
              className="campo-formulario"
              onChange={(event) => onChange("numero_interior", event.target.value)}
              placeholder="A"
              type="text"
              value={direccion.numero_interior}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Ciudad / Municipio
            </span>
            <input
              className="campo-formulario"
              onChange={(event) => onChange("ciudad", event.target.value)}
              placeholder="Monterrey"
              type="text"
              value={direccion.ciudad}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Estado
            </span>
            <input
              className="campo-formulario"
              onChange={(event) => onChange("estado", event.target.value)}
              placeholder="Nuevo Leon"
              type="text"
              value={direccion.estado}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Colonia
            </span>
            {colonias.length > 0 ? (
              <select
                className="campo-formulario"
                onChange={(event) => onChange("colonia", event.target.value)}
                value={direccion.colonia}
              >
                <option value="">Selecciona una colonia</option>
                {colonias.map((colonia) => (
                  <option key={colonia} value={colonia}>
                    {colonia}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="campo-formulario"
                onChange={(event) => onChange("colonia", event.target.value)}
                placeholder="Centro"
                type="text"
                value={direccion.colonia}
              />
            )}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              País
            </span>
            <input
              className="campo-formulario"
              onChange={(event) => onChange("pais", event.target.value)}
              placeholder="Mexico"
              type="text"
              value={direccion.pais}
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button onClick={onSubmit} size="3" type="button">
            Guardar domicilio
          </Button>
          <Button color="gray" onClick={onCancel} size="3" type="button" variant="soft">
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}

export function FormularioCliente({
  cliente,
  onCancelar,
}: {
  cliente?: ClienteConRelaciones;
  onCancelar: () => void;
}) {
  const esEdicion = Boolean(cliente);
  const accion = esEdicion ? editar_cliente : crear_cliente;
  const [estado, ejecutar] = useActionState(accion, estadoInicial);
  const [usaEspecificaciones, setUsaEspecificaciones] = useState(
    cliente?.usa_especificaciones_cliente ?? false
  );
  const [especificaciones, setEspecificaciones] = useState<EspecificacionClienteFila[]>(
    construirEspecificacionesIniciales(cliente)
  );
  const [domicilioFiscal, setDomicilioFiscal] = useState<DireccionEstructurada>(
    construirDomicilioFiscalInicial(cliente)
  );
  const [domicilios, setDomicilios] = useState<DireccionEntregaCaptura[]>(
    construirDomiciliosIniciales(cliente)
  );
  const [modalFiscalAbierto, setModalFiscalAbierto] = useState(false);
  const [modalDomicilioAbierto, setModalDomicilioAbierto] = useState(false);
  const [indiceDomicilioEditando, setIndiceDomicilioEditando] = useState<number | null>(
    null
  );
  const [borradorDomicilio, setBorradorDomicilio] =
    useState<DireccionEntregaCaptura>({ ...direccionEntregaVacia });
  const [cargandoCp, setCargandoCp] = useState(false);
  const [coloniasDisponibles, setColoniasDisponibles] = useState<string[]>([]);
  const [errorCp, setErrorCp] = useState<string | null>(null);

  const clienteInicial = useMemo(
    () => ({
      nombre: cliente?.nombre ?? "",
      rfc: cliente?.rfc ?? "",
      contacto_certificado: cliente?.contacto_certificado ?? "",
      correo_contacto_cliente: cliente?.correo_contacto_cliente ?? "",
      correo_almacenista: cliente?.correo_almacenista ?? "",
      correo_gte_calidad: cliente?.correo_gte_calidad ?? "",
      id_cliente: cliente?.id_cliente?.toString() ?? "",
    }),
    [cliente]
  );

  useEffect(() => {
    if (!estado.values) return;

    setUsaEspecificaciones(estado.values.usa_especificaciones_cliente ?? false);
    setDomicilioFiscal(
      normalizarDireccionEntrada(estado.values.domicilio_fiscal ?? direccionVacia)
    );
    setDomicilios(
      (estado.values.domicilios ?? []).map((direccion) =>
        normalizarDireccionEntregaEntrada(direccion)
      )
    );
    setEspecificaciones(estado.values.parametros_json ?? []);
  }, [estado.values]);

  function actualizarFila(
    indice: number,
    campo: keyof EspecificacionClienteFila,
    valor: string
  ) {
    setEspecificaciones((actuales) =>
      actuales.map((fila, i) => (i === indice ? { ...fila, [campo]: valor } : fila))
    );
  }

  function agregarFila() {
    setEspecificaciones((actuales) => [
      ...actuales,
      {
        clave_parametro: "",
        nombre: "",
        unidad_medida: "",
        lim_min: "",
        lim_max: "",
      },
    ]);
  }

  function eliminarFila(indice: number) {
    setEspecificaciones((actuales) => actuales.filter((_, i) => i !== indice));
  }

  function abrirNuevoDomicilio() {
    setModalDomicilioAbierto(true);
    setIndiceDomicilioEditando(null);
    setBorradorDomicilio({ ...direccionEntregaVacia });
    setColoniasDisponibles([]);
    setErrorCp(null);
  }

  function abrirDomicilio(indice: number) {
    setModalDomicilioAbierto(true);
    setIndiceDomicilioEditando(indice);
    setBorradorDomicilio(normalizarDireccionEntregaEntrada(domicilios[indice]));
    setColoniasDisponibles([]);
    setErrorCp(null);
  }

  function guardarDomicilio() {
    if (indiceDomicilioEditando === null) {
      setDomicilios((actuales) => [
        ...actuales,
        normalizarDireccionEntregaEntrada(borradorDomicilio),
      ]);
    } else {
      setDomicilios((actuales) =>
        actuales.map((direccion, indice) =>
          indice === indiceDomicilioEditando
            ? normalizarDireccionEntregaEntrada(borradorDomicilio)
            : direccion
        )
      );
    }

    setIndiceDomicilioEditando(null);
    setBorradorDomicilio({ ...direccionEntregaVacia });
    setModalDomicilioAbierto(false);
  }

  function eliminarDomicilio(indice: number) {
    setDomicilios((actuales) => actuales.filter((_, i) => i !== indice));
  }

  async function buscarCodigoPostal(
    codigoPostal: string,
    onCompletar: (data: RespuestaPostalia) => void
  ) {
    if (codigoPostal.length !== 5) {
      setErrorCp("El codigo postal debe tener 5 digitos.");
      return;
    }

    setCargandoCp(true);
    setErrorCp(null);

    try {
      const response = await fetch(`/api/postalia/codigo-postal/${codigoPostal}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as
        | RespuestaPostalia
        | { error?: string };

      if (!response.ok || "error" in payload) {
        setColoniasDisponibles([]);
        setErrorCp(
          "error" in payload && payload.error
            ? payload.error
            : "No se encontro informacion para ese codigo postal."
        );
        return;
      }

      if (!("colonias" in payload)) {
        setColoniasDisponibles([]);
        setErrorCp("No se encontro informacion para ese codigo postal.");
        return;
      }

      setColoniasDisponibles(payload.colonias);
      onCompletar(payload);
    } catch {
      setColoniasDisponibles([]);
      setErrorCp("No fue posible consultar Postalia. Puedes capturar la direccion manualmente.");
    } finally {
      setCargandoCp(false);
    }
  }

  return (
    <>
      <article className="tarjeta-suave rounded-[28px] p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {esEdicion ? "Editar cliente" : "Nuevo cliente"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Registra datos generales, contactos, domicilio fiscal y domicilios de entrega.
            </p>
          </div>
          <Badge color="indigo" radius="full" size="2" variant="soft">
            {esEdicion ? "Edición" : "Alta"}
          </Badge>
        </div>

        {estado.formError ? (
          <div className="mt-5 rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {estado.formError}
          </div>
        ) : null}

        <form action={ejecutar} className="mt-6 space-y-4">
          <input
            name="parametros_json"
            type="hidden"
            value={JSON.stringify(especificaciones)}
          />
          <input
            name="domicilio_fiscal_json"
            type="hidden"
            value={JSON.stringify(domicilioFiscal)}
          />
          <input
            name="domicilios_json"
            type="hidden"
            value={JSON.stringify(domicilios)}
          />

          {esEdicion ? (
            <input name="id_cliente" type="hidden" value={cliente!.id_cliente} />
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            {!esEdicion ? (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">
                  ID SAP (6 dígitos)
                </span>
                <input
                  aria-invalid={tieneErrorCampo(estado.fieldErrors, "id_cliente")}
                  className="campo-formulario"
                  defaultValue={obtenerValor(
                    estado.values,
                    "id_cliente",
                    clienteInicial.id_cliente
                  )}
                  maxLength={6}
                  minLength={6}
                  name="id_cliente"
                  placeholder="100001"
                  required
                  type="number"
                />
                <CampoError fieldErrors={estado.fieldErrors} name="id_cliente" />
              </label>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">
                Nombre / Razón social
              </span>
              <input
                aria-invalid={tieneErrorCampo(estado.fieldErrors, "nombre")}
                className="campo-formulario"
                defaultValue={obtenerValor(
                  estado.values,
                  "nombre",
                  clienteInicial.nombre
                )}
                name="nombre"
                placeholder="Panadería El Buen Pan S.A. de C.V."
                required
                type="text"
              />
              <CampoError fieldErrors={estado.fieldErrors} name="nombre" />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">
                RFC
              </span>
              <input
                aria-invalid={tieneErrorCampo(estado.fieldErrors, "rfc")}
                className="campo-formulario"
                defaultValue={obtenerValor(estado.values, "rfc", clienteInicial.rfc)}
                maxLength={13}
                name="rfc"
                placeholder="PBP230101ABC"
                required
                style={{ textTransform: "uppercase" }}
                type="text"
              />
              <CampoError fieldErrors={estado.fieldErrors} name="rfc" />
            </label>
          </div>

          <section className="rounded-[24px] border border-slate-200/80 bg-white/70 p-4 md:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Domicilio fiscal
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Captura la direccion estructurada y usa Postalia para autocompletar.
                </p>
              </div>
              <Button onClick={() => setModalFiscalAbierto(true)} type="button" variant="soft">
                Editar domicilio fiscal
              </Button>
            </div>

            <div className="mt-4 rounded-[20px] border border-slate-200/80 bg-white p-4 text-sm text-slate-600">
              {formatearDireccion(domicilioFiscal) || "Sin domicilio fiscal capturado."}
            </div>
            <CampoError fieldErrors={estado.fieldErrors} name="domicilio_fiscal" />
          </section>

          <section className="rounded-[24px] border border-slate-200/80 bg-white/70 p-4 md:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Domicilios de entrega
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Agrega los puntos de entrega del cliente con direccion estructurada.
                </p>
              </div>
              <Button
                onClick={abrirNuevoDomicilio}
                type="button"
                variant="soft"
              >
                + Agregar domicilio
              </Button>
            </div>

            {domicilios.length === 0 ? (
              <div className="mt-4 rounded-[18px] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-500">
                Aún no hay domicilios de entrega registrados.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {domicilios.map((domicilio, indice) => (
                  <div
                    className="rounded-[20px] border border-slate-200/80 bg-white p-4"
                    key={`${domicilio.etiqueta}-${indice}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {domicilio.etiqueta || `Domicilio ${indice + 1}`}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatearDireccion(domicilio)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => abrirDomicilio(indice)} size="2" type="button" variant="soft">
                          Editar
                        </Button>
                        <Button
                          color="red"
                          onClick={() => eliminarDomicilio(indice)}
                          size="2"
                          type="button"
                          variant="soft"
                        >
                          Quitar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <CampoError fieldErrors={estado.fieldErrors} name="domicilios" />
          </section>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">
                Contacto del certificado
              </span>
              <input
                className="campo-formulario"
                defaultValue={obtenerValor(
                  estado.values,
                  "contacto_certificado",
                  clienteInicial.contacto_certificado
                )}
                name="contacto_certificado"
                placeholder="Ing. Laura Martinez"
                type="text"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">
                Correo contacto cliente
              </span>
              <input
                className="campo-formulario"
                defaultValue={obtenerValor(
                  estado.values,
                  "correo_contacto_cliente",
                  clienteInicial.correo_contacto_cliente
                )}
                name="correo_contacto_cliente"
                placeholder="calidad@cliente.com"
                type="email"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">
                Correo almacenista
              </span>
              <input
                className="campo-formulario"
                defaultValue={obtenerValor(
                  estado.values,
                  "correo_almacenista",
                  clienteInicial.correo_almacenista
                )}
                name="correo_almacenista"
                placeholder="almacen@cliente.com"
                type="email"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">
                Correo gerente de calidad
              </span>
              <input
                className="campo-formulario"
                defaultValue={obtenerValor(
                  estado.values,
                  "correo_gte_calidad",
                  clienteInicial.correo_gte_calidad
                )}
                name="correo_gte_calidad"
                placeholder="calidad@cliente.com"
                type="email"
              />
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="flex items-center gap-3 rounded-[18px] border border-slate-200/80 bg-white/80 px-4 py-3.5">
              <input
                defaultChecked={estado.values?.solicita_certificado ?? cliente?.solicita_certificado ?? false}
                name="solicita_certificado"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-slate-700">
                El cliente solicita certificado de calidad
              </span>
            </label>

            <label className="flex items-center gap-3 rounded-[18px] border border-slate-200/80 bg-white/80 px-4 py-3.5">
              <input
                checked={usaEspecificaciones}
                name="usa_especificaciones_cliente"
                onChange={(event) => setUsaEspecificaciones(event.target.checked)}
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-slate-700">
                Usa especificaciones particulares del cliente
              </span>
            </label>
          </div>

          <section className="rounded-[24px] border border-slate-200/80 bg-white/70 p-4 md:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Especificaciones por parámetro
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Captura los límites particulares que el cliente exige en sus certificados.
                </p>
              </div>
              <Button
                disabled={!usaEspecificaciones}
                onClick={agregarFila}
                size="2"
                type="button"
                variant="soft"
              >
                + Agregar parámetro
              </Button>
            </div>

            {!usaEspecificaciones ? (
              <div className="mt-4 rounded-[18px] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-500">
                Activa la opción de especificaciones particulares para capturar parámetros.
              </div>
            ) : especificaciones.length === 0 ? (
              <div className="mt-4 rounded-[18px] border border-dashed border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-500">
                Aún no hay parámetros cargados para este cliente.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {especificaciones.map((fila, indice) => (
                  <div
                    className="rounded-[20px] border border-slate-200/80 bg-white p-4"
                    key={`${fila.clave_parametro}-${indice}`}
                  >
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                      <label className="block">
                        <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                          Clave
                        </span>
                        <input
                          className="campo-formulario"
                          onChange={(event) =>
                            actualizarFila(
                              indice,
                              "clave_parametro",
                              event.target.value.toUpperCase()
                            )
                          }
                          placeholder="ALV_W"
                          type="text"
                          value={fila.clave_parametro}
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                          Nombre
                        </span>
                        <input
                          className="campo-formulario"
                          onChange={(event) =>
                            actualizarFila(indice, "nombre", event.target.value)
                          }
                          placeholder="Fuerza panadera"
                          type="text"
                          value={fila.nombre}
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                          Unidad
                        </span>
                        <input
                          className="campo-formulario"
                          onChange={(event) =>
                            actualizarFila(indice, "unidad_medida", event.target.value)
                          }
                          placeholder="W"
                          type="text"
                          value={fila.unidad_medida}
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                          Límite mínimo
                        </span>
                        <input
                          className="campo-formulario"
                          onChange={(event) =>
                            actualizarFila(indice, "lim_min", event.target.value)
                          }
                          placeholder="180"
                          step="0.0001"
                          type="number"
                          value={fila.lim_min}
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                          Límite máximo
                        </span>
                        <div className="flex gap-2">
                          <input
                            className="campo-formulario"
                            onChange={(event) =>
                              actualizarFila(indice, "lim_max", event.target.value)
                            }
                            placeholder="240"
                            step="0.0001"
                            type="number"
                            value={fila.lim_max}
                          />
                          <Button
                            color="red"
                            onClick={() => eliminarFila(indice)}
                            type="button"
                            variant="soft"
                          >
                            Quitar
                          </Button>
                        </div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button size="3" type="submit">
              {esEdicion ? "Guardar cambios" : "Registrar cliente"}
            </Button>
            <Button
              color="gray"
              onClick={onCancelar}
              size="3"
              type="button"
              variant="soft"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </article>

      <ModalDireccion
        abierta={modalFiscalAbierto}
        cargandoCp={cargandoCp}
        colonias={coloniasDisponibles}
        direccion={{ etiqueta: "Fiscal", ...domicilioFiscal }}
        errorCp={errorCp}
        mostrarEtiqueta={false}
        onBuscarCp={() =>
          buscarCodigoPostal(domicilioFiscal.codigo_postal, (data) => {
            setDomicilioFiscal((actual) => ({
              ...actual,
              ciudad: data.ciudad || actual.ciudad,
              estado: data.estado || actual.estado,
              colonia:
                actual.colonia || data.colonias[0] || actual.colonia,
            }));
          })
        }
        onCancel={() => setModalFiscalAbierto(false)}
        onChange={(campo, valor) => {
          if (campo === "etiqueta") return;
          setDomicilioFiscal((actual) => ({ ...actual, [campo]: valor }));
        }}
        onSubmit={() => setModalFiscalAbierto(false)}
        titulo="Editar domicilio fiscal"
      />

      <ModalDireccion
        abierta={modalDomicilioAbierto}
        cargandoCp={cargandoCp}
        colonias={coloniasDisponibles}
        direccion={borradorDomicilio}
        errorCp={errorCp}
        onBuscarCp={() =>
          buscarCodigoPostal(borradorDomicilio.codigo_postal, (data) => {
            setBorradorDomicilio((actual) => ({
              ...actual,
              ciudad: data.ciudad || actual.ciudad,
              estado: data.estado || actual.estado,
              colonia: actual.colonia || data.colonias[0] || actual.colonia,
            }));
          })
        }
        onCancel={() => {
          setModalDomicilioAbierto(false);
          setIndiceDomicilioEditando(null);
          setBorradorDomicilio({ ...direccionEntregaVacia });
        }}
        onChange={(campo, valor) =>
          setBorradorDomicilio((actual) => ({ ...actual, [campo]: valor }))
        }
        onSubmit={guardarDomicilio}
        titulo={
          indiceDomicilioEditando === null
            ? "Nuevo domicilio de entrega"
            : "Editar domicilio de entrega"
        }
      />
    </>
  );
}
