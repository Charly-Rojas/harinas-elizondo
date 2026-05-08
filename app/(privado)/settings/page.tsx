import { Badge, Button, Callout, Text } from "@radix-ui/themes";
import {
  actualizar_rol,
  aprobar_usuario,
  dar_baja_usuario,
  rechazar_usuario,
  reactivar_usuario,
} from "@/app/(privado)/settings/acciones";
import {
  es_administrador,
  puede_asignar_rol,
  requiere_sesion,
  status_usuario_desde_datos,
  usuario_activo,
  type PerfilUsuario,
} from "@/lib/autorizacion";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { supabaseAdminConfigurado } from "@/lib/supabase/configuracion";
import {
  obtenerColorRol,
  obtenerColorStatusUsuario,
  obtenerTextoRol,
  obtenerTextoStatusUsuario,
} from "@/lib/usuarios";

type ParametrosBusqueda = Promise<{
  tipo?: string | string[];
  mensaje?: string | string[];
}>;

type PerfilSettings = PerfilUsuario;

const rolesDisponibles: PerfilUsuario["rol"][] = [
  "laboratorista",
  "gte_calidad",
  "gte_plantas",
  "dir_operaciones",
  "gerente_laboratorio",
  "admin",
];

export default async function PaginaSettings({
  searchParams,
}: {
  searchParams: ParametrosBusqueda;
}) {
  const usuarioActual = await requiere_sesion();
  const parametros = await searchParams;
  const tipo =
    typeof parametros.tipo === "string" ? parametros.tipo : undefined;
  const mensaje =
    typeof parametros.mensaje === "string" ? parametros.mensaje : undefined;

  const puedeAdministrar =
    usuario_activo(usuarioActual.perfil) &&
    es_administrador(usuarioActual.perfil.rol);

  let perfiles: PerfilSettings[] = [];

  if (puedeAdministrar && supabaseAdminConfigurado()) {
    const supabaseAdmin = crearClienteAdmin();
    const { data } = await supabaseAdmin
      .from("perfiles")
      .select(
        "id, correo, nombre, rol, aprobado, status, aprobado_en, aprobado_por, creado_en"
      )
      .order("creado_en", { ascending: false });

    perfiles = ((data ?? []) as PerfilSettings[]).map((perfil) => ({
      ...perfil,
      status: status_usuario_desde_datos(perfil.aprobado, perfil.status),
    }));
  }

  const pendientes = perfiles.filter((perfil) => perfil.status === "pendiente");
  const activos = perfiles.filter((perfil) => perfil.status === "activo");
  const inactivos = perfiles.filter(
    (perfil) => perfil.status === "rechazado" || perfil.status === "baja"
  );

  return (
    <section className="flex flex-col gap-5">
      <p className="max-w-2xl text-sm leading-6 text-slate-500">
        Aquí se administra la aprobación de cuentas, el rol asignado y el estado
        operativo de cada usuario.
      </p>

      {mensaje ? (
        <Callout.Root
          color={tipo === "error" ? "red" : "indigo"}
          variant="soft"
          size="2"
        >
          <Callout.Text>{mensaje}</Callout.Text>
        </Callout.Root>
      ) : null}

      <article className="tarjeta-suave rounded-[28px] p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Tu cuenta</h2>
            <p className="mt-1 text-sm text-slate-500">
              Resumen del usuario autenticado.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              color={obtenerColorRol(usuarioActual.perfil.rol)}
              radius="full"
              size="2"
              variant="soft"
            >
              {obtenerTextoRol(usuarioActual.perfil.rol)}
            </Badge>
            <Badge
              color={obtenerColorStatusUsuario(usuarioActual.perfil.status)}
              radius="full"
              size="2"
              variant="soft"
            >
              {obtenerTextoStatusUsuario(usuarioActual.perfil.status)}
            </Badge>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-slate-200/80 bg-white/80 p-4">
            <p className="text-sm font-medium text-slate-500">Nombre</p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {usuarioActual.perfil.nombre || "Sin nombre"}
            </p>
          </div>
          <div className="rounded-[24px] border border-slate-200/80 bg-white/80 p-4">
            <p className="text-sm font-medium text-slate-500">Correo</p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {usuarioActual.perfil.correo}
            </p>
          </div>
          <div className="rounded-[24px] border border-slate-200/80 bg-white/80 p-4">
            <p className="text-sm font-medium text-slate-500">Estado</p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {obtenerTextoStatusUsuario(usuarioActual.perfil.status)}
            </p>
          </div>
        </div>
      </article>

      {!puedeAdministrar ? (
        <article className="tarjeta-suave rounded-[28px] p-4 md:p-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Administración restringida
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Solo los usuarios con rol <strong>admin</strong> o{" "}
            <strong>gerente de laboratorio</strong> pueden aprobar registros,
            dar de baja y cambiar permisos.
          </p>
        </article>
      ) : !supabaseAdminConfigurado() ? (
        <article className="tarjeta-suave rounded-[28px] p-4 md:p-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Falta la clave de servicio
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Agrega <code>SUPABASE_SERVICE_ROLE_KEY</code> en tu entorno para
            listar y administrar usuarios desde esta pantalla.
          </p>
        </article>
      ) : (
        <>
          <article className="tarjeta-suave rounded-[28px] p-4 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Usuarios pendientes
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Aprueba nuevas cuentas o rechaza el acceso antes de activarlas.
                </p>
              </div>
              <Badge color="amber" radius="full" size="2" variant="soft">
                {pendientes.length} pendientes
              </Badge>
            </div>

            <div className="mt-6 space-y-4">
              {pendientes.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-white/70 p-5 text-sm text-slate-500">
                  No hay usuarios pendientes por revisar.
                </div>
              ) : (
                pendientes.map((perfil) => (
                  <div
                    className="grid gap-4 rounded-[24px] border border-slate-200/80 bg-white/80 p-4 md:p-5 xl:grid-cols-[minmax(0,1fr)_220px_auto]"
                    key={perfil.id}
                  >
                    <div>
                      <p className="text-base font-semibold text-slate-900">
                        {perfil.nombre || "Sin nombre"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{perfil.correo}</p>
                    </div>

                    <form action={aprobar_usuario} className="flex flex-col gap-2">
                      <input name="id" type="hidden" value={perfil.id} />
                      <label className="text-sm font-medium text-slate-500">
                        Rol inicial
                      </label>
                      <select
                        className="campo-formulario"
                        defaultValue="laboratorista"
                        name="rol"
                      >
                        {rolesDisponibles
                          .filter((rol) =>
                            puede_asignar_rol(usuarioActual.perfil.rol, rol)
                          )
                          .map((rol) => (
                            <option key={rol} value={rol}>
                              {obtenerTextoRol(rol)}
                            </option>
                          ))}
                      </select>
                      <Button size="3" type="submit">
                        Aprobar
                      </Button>
                    </form>

                    <form action={rechazar_usuario} className="flex items-end">
                      <input name="id" type="hidden" value={perfil.id} />
                      <Button color="red" size="3" type="submit" variant="soft">
                        Rechazar
                      </Button>
                    </form>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="tarjeta-suave rounded-[28px] p-4 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Usuarios activos
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Cambia roles o da de baja cuentas activas.
                </p>
              </div>
              <Badge color="green" radius="full" size="2" variant="soft">
                {activos.length} activos
              </Badge>
            </div>

            <div className="mt-6 space-y-4">
              {activos.map((perfil) => {
                const bloqueado = perfil.id === usuarioActual.usuario.id;

                return (
                  <div
                    className="grid gap-4 rounded-[24px] border border-slate-200/80 bg-white/80 p-4 md:p-5 xl:grid-cols-[minmax(0,1fr)_220px_auto]"
                    key={perfil.id}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-base font-semibold text-slate-900">
                          {perfil.nombre || "Sin nombre"}
                        </p>
                        <Badge
                          color={obtenerColorRol(perfil.rol)}
                          radius="full"
                          size="1"
                          variant="soft"
                        >
                          {obtenerTextoRol(perfil.rol)}
                        </Badge>
                        <Badge
                          color={obtenerColorStatusUsuario(perfil.status)}
                          radius="full"
                          size="1"
                          variant="soft"
                        >
                          {obtenerTextoStatusUsuario(perfil.status)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{perfil.correo}</p>
                      {bloqueado ? (
                        <Text as="p" className="mt-2 block text-xs text-slate-400">
                          Tu propia cuenta no se puede modificar desde aquí.
                        </Text>
                      ) : null}
                    </div>

                    <form action={actualizar_rol} className="flex flex-col gap-2">
                      <input name="id" type="hidden" value={perfil.id} />
                      <label className="text-sm font-medium text-slate-500">
                        Rol
                      </label>
                      <select
                        className="campo-formulario"
                        defaultValue={perfil.rol}
                        disabled={bloqueado}
                        name="rol"
                      >
                        {rolesDisponibles
                          .filter((rol) =>
                            puede_asignar_rol(usuarioActual.perfil.rol, rol)
                          )
                          .map((rol) => (
                            <option key={rol} value={rol}>
                              {obtenerTextoRol(rol)}
                            </option>
                          ))}
                      </select>
                      <Button disabled={bloqueado} size="3" type="submit">
                        Guardar rol
                      </Button>
                    </form>

                    <form action={dar_baja_usuario} className="flex items-end">
                      <input name="id" type="hidden" value={perfil.id} />
                      <Button
                        color="orange"
                        disabled={bloqueado}
                        size="3"
                        type="submit"
                        variant="soft"
                      >
                        Dar de baja
                      </Button>
                    </form>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="tarjeta-suave rounded-[28px] p-4 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Usuarios inactivos
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Reactiva cuentas rechazadas o dadas de baja cuando corresponda.
                </p>
              </div>
              <Badge color="gray" radius="full" size="2" variant="soft">
                {inactivos.length} inactivos
              </Badge>
            </div>

            <div className="mt-6 space-y-4">
              {inactivos.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-white/70 p-5 text-sm text-slate-500">
                  No hay usuarios inactivos.
                </div>
              ) : (
                inactivos.map((perfil) => (
                  <div
                    className="grid gap-4 rounded-[24px] border border-slate-200/80 bg-white/80 p-4 md:p-5 xl:grid-cols-[minmax(0,1fr)_220px_auto]"
                    key={perfil.id}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-base font-semibold text-slate-900">
                          {perfil.nombre || "Sin nombre"}
                        </p>
                        <Badge
                          color={obtenerColorRol(perfil.rol)}
                          radius="full"
                          size="1"
                          variant="soft"
                        >
                          {obtenerTextoRol(perfil.rol)}
                        </Badge>
                        <Badge
                          color={obtenerColorStatusUsuario(perfil.status)}
                          radius="full"
                          size="1"
                          variant="soft"
                        >
                          {obtenerTextoStatusUsuario(perfil.status)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{perfil.correo}</p>
                    </div>

                    <form action={reactivar_usuario} className="flex flex-col gap-2">
                      <input name="id" type="hidden" value={perfil.id} />
                      <label className="text-sm font-medium text-slate-500">
                        Rol al reactivar
                      </label>
                      <select
                        className="campo-formulario"
                        defaultValue={perfil.rol}
                        name="rol"
                      >
                        {rolesDisponibles
                          .filter((rol) =>
                            puede_asignar_rol(usuarioActual.perfil.rol, rol)
                          )
                          .map((rol) => (
                            <option key={rol} value={rol}>
                              {obtenerTextoRol(rol)}
                            </option>
                          ))}
                      </select>
                      <Text as="p" className="text-xs text-slate-400">
                        Puedes ajustar el rol antes de reactivar.
                      </Text>
                      <div className="flex items-end">
                        <Button color="green" size="3" type="submit" variant="soft">
                          Reactivar
                        </Button>
                      </div>
                    </form>
                  </div>
                ))
              )}
            </div>
          </article>
        </>
      )}
    </section>
  );
}
