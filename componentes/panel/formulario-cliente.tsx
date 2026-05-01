"use client";

import { useActionState, useMemo, useState } from "react";
import { Badge, Button } from "@radix-ui/themes";
import {
  crear_cliente,
  editar_cliente,
  type EstadoFormularioCliente,
} from "@/app/(privado)/clientes/acciones";
import type { ClienteConRelaciones } from "@/lib/tipos-clientes";

const estadoInicial: EstadoFormularioCliente = {};

type EspecificacionClienteFila = {
  clave_parametro: string;
  nombre: string;
  unidad_medida: string;
  lim_min: string;
  lim_max: string;
};

type DomicilioEntregaFila = {
  etiqueta: string;
  direccion: string;
};

type DomicilioFiscalCampos = {
  calle: string;
  numero_exterior: string;
  numero_interior: string;
  colonia: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  pais: string;
};

const domicilioFiscalVacio: DomicilioFiscalCampos = {
  calle: "",
  numero_exterior: "",
  numero_interior: "",
  colonia: "",
  ciudad: "",
  estado: "",
  codigo_postal: "",
  pais: "México",
};

function parsearDomicilioFiscal(valor: string | null | undefined): DomicilioFiscalCampos {
  if (!valor) return { ...domicilioFiscalVacio };

  const partes = valor.split(",").map((parte) => parte.trim());
  if (partes.length < 4) {
    return { ...domicilioFiscalVacio, calle: valor };
  }

  let indice = 0;
  let calle = partes[indice] ?? "";
  let numero_exterior = "";
  const matchExterior = calle.match(/^(.+?)\s+#(.+)$/);
  if (matchExterior) {
    calle = matchExterior[1].trim();
    numero_exterior = matchExterior[2].trim();
  }
  indice += 1;

  let numero_interior = "";
  if (partes[indice]?.startsWith("Int #")) {
    numero_interior = partes[indice].substring(5).trim();
    indice += 1;
  }

  let colonia = "";
  if (partes[indice]?.startsWith("Col. ")) {
    colonia = partes[indice].substring(5).trim();
    indice += 1;
  } else {
    return { ...domicilioFiscalVacio, calle: valor };
  }

  const ciudad = partes[indice++] ?? "";
  const estado = partes[indice++] ?? "";
  const codigo_postal = partes[indice++] ?? "";
  const pais = partes[indice++] ?? "México";

  return {
    calle,
    numero_exterior,
    numero_interior,
    colonia,
    ciudad,
    estado,
    codigo_postal,
    pais: pais || "México",
  };
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
  const filasIniciales = useMemo<EspecificacionClienteFila[]>(
    () =>
      cliente?.param_ref_cliente?.length
        ? cliente.param_ref_cliente.map((fila) => ({
            clave_parametro: fila.clave_parametro ?? "",
            nombre: fila.nombre,
            unidad_medida: fila.unidad_medida ?? "",
            lim_min: fila.lim_min?.toString() ?? "",
            lim_max: fila.lim_max?.toString() ?? "",
          }))
        : [],
    [cliente]
  );
  const [usaEspecificaciones, setUsaEspecificaciones] = useState(
    cliente?.usa_especificaciones_cliente ?? false
  );
  const [especificaciones, setEspecificaciones] = useState<EspecificacionClienteFila[]>(
    filasIniciales
  );

  const domiciliosIniciales = useMemo<DomicilioEntregaFila[]>(
    () =>
      cliente?.direcciones?.length
        ? cliente.direcciones.map((d) => ({
            etiqueta: d.etiqueta,
            direccion: d.direccion,
          }))
        : [],
    [cliente]
  );
  const [domicilios, setDomicilios] = useState<DomicilioEntregaFila[]>(
    domiciliosIniciales
  );

  const domicilioFiscalInicial = useMemo<DomicilioFiscalCampos>(
    () => parsearDomicilioFiscal(cliente?.domicilio_fiscal),
    [cliente]
  );
  const [domicilioFiscal, setDomicilioFiscal] = useState<DomicilioFiscalCampos>(
    domicilioFiscalInicial
  );

  function actualizarDomicilioFiscal(
    campo: keyof DomicilioFiscalCampos,
    valor: string
  ) {
    setDomicilioFiscal((actual) => ({ ...actual, [campo]: valor }));
  }

  function actualizarDomicilio(
    indice: number,
    campo: keyof DomicilioEntregaFila,
    valor: string
  ) {
    setDomicilios((actuales) =>
      actuales.map((fila, i) =>
        i === indice ? { ...fila, [campo]: valor } : fila
      )
    );
  }

  function agregarDomicilio() {
    setDomicilios((actuales) => [...actuales, { etiqueta: "", direccion: "" }]);
  }

  function eliminarDomicilio(indice: number) {
    setDomicilios((actuales) => actuales.filter((_, i) => i !== indice));
  }

  function actualizarFila(
    indice: number,
    campo: keyof EspecificacionClienteFila,
    valor: string
  ) {
    setEspecificaciones((actuales) =>
      actuales.map((fila, i) =>
        i === indice ? { ...fila, [campo]: valor } : fila
      )
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

  return (
    <article className="tarjeta-suave rounded-[28px] p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {esEdicion ? "Editar cliente" : "Nuevo cliente"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {esEdicion
              ? "Modifica datos generales, contactos y límites particulares."
              : "Registra un nuevo cliente con su ID de SAP."}
          </p>
        </div>
        <Badge color="indigo" radius="full" size="2" variant="soft">
          {esEdicion ? "Edición" : "Alta"}
        </Badge>
      </div>

      {estado.error && (
        <div className="mt-5 rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {estado.error}
        </div>
      )}

      <form action={ejecutar} className="mt-6 space-y-4">
        <input
          name="parametros_json"
          type="hidden"
          value={JSON.stringify(especificaciones)}
        />
        <input
          name="domicilios_json"
          type="hidden"
          value={JSON.stringify(domicilios)}
        />

        {esEdicion && (
          <input name="id_cliente" type="hidden" value={cliente!.id_cliente} />
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {!esEdicion && (
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">
                ID SAP (6 dígitos)
              </span>
              <input
                className="campo-formulario"
                maxLength={6}
                minLength={6}
                name="id_cliente"
                placeholder="100001"
                required
                type="number"
              />
            </label>
          )}

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Nombre / Razón social
            </span>
            <input
              className="campo-formulario"
              defaultValue={cliente?.nombre ?? ""}
              name="nombre"
              placeholder="Panadería El Buen Pan S.A. de C.V."
              required
              type="text"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              RFC
            </span>
            <input
              className="campo-formulario"
              defaultValue={cliente?.rfc ?? ""}
              maxLength={13}
              name="rfc"
              placeholder="PBP230101ABC"
              required
              style={{ textTransform: "uppercase" }}
              type="text"
            />
          </label>
        </div>

        <section className="rounded-[24px] border border-slate-200/80 bg-white/70 p-4 md:p-5">
          <h3 className="text-base font-semibold text-slate-900">
            Domicilio fiscal
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Captura los datos del domicilio fiscal por separado.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <label className="block md:col-span-2">
              <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Calle
              </span>
              <input
                className="campo-formulario"
                name="dom_calle"
                onChange={(e) => actualizarDomicilioFiscal("calle", e.target.value)}
                placeholder="Av. Industrial"
                required
                type="text"
                value={domicilioFiscal.calle}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Número exterior
              </span>
              <input
                className="campo-formulario"
                name="dom_numero_exterior"
                onChange={(e) =>
                  actualizarDomicilioFiscal("numero_exterior", e.target.value)
                }
                placeholder="456"
                type="text"
                value={domicilioFiscal.numero_exterior}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Número interior (opcional)
              </span>
              <input
                className="campo-formulario"
                name="dom_numero_interior"
                onChange={(e) =>
                  actualizarDomicilioFiscal("numero_interior", e.target.value)
                }
                placeholder="A"
                type="text"
                value={domicilioFiscal.numero_interior}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Colonia
              </span>
              <input
                className="campo-formulario"
                name="dom_colonia"
                onChange={(e) =>
                  actualizarDomicilioFiscal("colonia", e.target.value)
                }
                placeholder="Centro"
                required
                type="text"
                value={domicilioFiscal.colonia}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Ciudad
              </span>
              <input
                className="campo-formulario"
                name="dom_ciudad"
                onChange={(e) =>
                  actualizarDomicilioFiscal("ciudad", e.target.value)
                }
                placeholder="CDMX"
                required
                type="text"
                value={domicilioFiscal.ciudad}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Estado
              </span>
              <input
                className="campo-formulario"
                name="dom_estado"
                onChange={(e) =>
                  actualizarDomicilioFiscal("estado", e.target.value)
                }
                placeholder="CDMX"
                required
                type="text"
                value={domicilioFiscal.estado}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Código postal
              </span>
              <input
                className="campo-formulario"
                name="dom_codigo_postal"
                onChange={(e) =>
                  actualizarDomicilioFiscal("codigo_postal", e.target.value)
                }
                placeholder="06000"
                required
                type="text"
                value={domicilioFiscal.codigo_postal}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                País
              </span>
              <input
                className="campo-formulario"
                name="dom_pais"
                onChange={(e) =>
                  actualizarDomicilioFiscal("pais", e.target.value)
                }
                placeholder="México"
                type="text"
                value={domicilioFiscal.pais}
              />
            </label>
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-200/80 bg-white/70 p-4 md:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Domicilios de entrega
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Registra una o varias direcciones donde se realizan entregas.
              </p>
            </div>
            <Button
              onClick={agregarDomicilio}
              size="2"
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
                  key={indice}
                >
                  <div className="grid gap-3 md:grid-cols-[minmax(0,200px)_minmax(0,1fr)_auto]">
                    <label className="block">
                      <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                        Etiqueta
                      </span>
                      <input
                        className="campo-formulario"
                        onChange={(e) =>
                          actualizarDomicilio(indice, "etiqueta", e.target.value)
                        }
                        placeholder="Planta Norte"
                        type="text"
                        value={domicilio.etiqueta}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                        Dirección
                      </span>
                      <input
                        className="campo-formulario"
                        onChange={(e) =>
                          actualizarDomicilio(indice, "direccion", e.target.value)
                        }
                        placeholder="Parque Industrial Norte, nave 4"
                        type="text"
                        value={domicilio.direccion}
                      />
                    </label>

                    <div className="flex items-end">
                      <Button
                        color="red"
                        onClick={() => eliminarDomicilio(indice)}
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
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Contacto del certificado
            </span>
            <input
              className="campo-formulario"
              defaultValue={cliente?.contacto_certificado ?? ""}
              name="contacto_certificado"
              placeholder="Ing. Laura Martínez"
              type="text"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Correo contacto cliente
            </span>
            <input
              className="campo-formulario"
              defaultValue={cliente?.correo_contacto_cliente ?? ""}
              name="correo_contacto_cliente"
              placeholder="calidad@cliente.com"
              type="email"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Correo almacenista (opcional)
            </span>
            <input
              className="campo-formulario"
              defaultValue={cliente?.correo_almacenista ?? ""}
              name="correo_almacenista"
              placeholder="almacen@cliente.com"
              type="email"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">
              Correo gerente de calidad
            </span>
            <input
              className="campo-formulario"
              defaultValue={cliente?.correo_gte_calidad ?? ""}
              name="correo_gte_calidad"
              placeholder="calidad@cliente.com"
              type="email"
            />
          </label>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="flex items-center gap-3 rounded-[18px] border border-slate-200/80 bg-white/80 px-4 py-3.5">
            <input
              defaultChecked={cliente?.solicita_certificado ?? false}
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
                Captura los límites particulares que el cliente exige en sus
                certificados.
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
              Activa la opción de especificaciones particulares para capturar
              parámetros.
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
                          actualizarFila(
                            indice,
                            "unidad_medida",
                            event.target.value
                          )
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
  );
}
