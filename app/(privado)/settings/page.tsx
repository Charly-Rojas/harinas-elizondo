import { Badge, Button, Callout, Text } from "@radix-ui/themes";
import {
  actualizar_rol,
  aprobar_usuario,
} from "@/app/(privado)/settings/acciones";
import {
  es_administrador,
  puede_asignar_rol,
  requiere_sesion,
  type PerfilUsuario,
} from "@/lib/autorizacion";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { supabaseAdminConfigurado } from "@/lib/supabase/configuracion";

function obtenerTextoRol(rol: PerfilUsuario["rol"]) {
  if (rol === "superadmin") return "Superadmin";
  if (rol === "admin") return "Admin";
  return "Operador";
}

function obtenerColorRol(rol: PerfilUsuario["rol"]) {
  if (rol === "superadmin") return "indigo";
  if (rol === "admin") return "blue";
  return "gray";
}

type ParametrosBusqueda = Promise<{
  tipo?: string | string[];
  mensaje?: string | string[];
}>;

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
    usuarioActual.perfil.aprobado && es_administrador(usuarioActual.perfil.rol);

  let perfiles: PerfilUsuario[] = [];

  if (puedeAdministrar && supabaseAdminConfigurado()) {
    const supabaseAdmin = crearClienteAdmin();
    const { data } = await supabaseAdmin
      .from("perfiles")
      .select("id, correo, nombre, rol, aprobado, aprobado_en, aprobado_por, creado_en")
      .order("creado_en", { ascending: false });

    perfiles = (data ?? []) as PerfilUsuario[];
  }

  const pendientes = perfiles.filter((perfil) => !perfil.aprobado);
  const activos = perfiles.filter((perfil) => perfil.aprobado);

  return (
    <section className="flex flex-col gap-5">
      <p className="max-w-2xl text-sm leading-6 text-slate-500">
        Aquí se administra la aprobación de cuentas y el rol de cada usuario.
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

      <article className="tarjeta-suave rounded-[28px] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Tu cuenta
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Resumen del usuario autenticado.
            </p>
          </div>
          <Badge
            color={obtenerColorRol(usuarioActual.perfil.rol)}
            radius="full"
            size="2"
            variant="soft"
          >
            {obtenerTextoRol(usuarioActual.perfil.rol)}
          </Badge>
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
              {usuarioActual.perfil.aprobado ? "Aprobado" : "Pendiente"}
            </p>
          </div>
        </div>
      </article>

      {!puedeAdministrar ? (
        <article className="tarjeta-suave rounded-[28px] p-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Administración restringida
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Solo los usuarios con rol <strong>admin</strong> o{" "}
            <strong>superadmin</strong> pueden aprobar registros y cambiar
            permisos.
          </p>
        </article>
      ) : !supabaseAdminConfigurado() ? (
        <article className="tarjeta-suave rounded-[28px] p-6">
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
          <article className="tarjeta-suave rounded-[28px] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Usuarios pendientes
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Aprueba nuevas cuentas y define su rol inicial.
                </p>
              </div>
              <Badge color="amber" radius="full" size="2" variant="soft">
                {pendientes.length} pendientes
              </Badge>
            </div>

            <div className="mt-6 space-y-4">
              {pendientes.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-white/70 p-5 text-sm text-slate-500">
                  No hay usuarios pendientes por aprobar.
                </div>
              ) : (
                pendientes.map((perfil) => (
                  <form
                    action={aprobar_usuario}
                    className="grid gap-4 rounded-[24px] border border-slate-200/80 bg-white/80 p-5 lg:grid-cols-[minmax(0,1fr)_180px_150px]"
                    key={perfil.id}
                  >
                    <input name="id" type="hidden" value={perfil.id} />
                    <div>
                      <p className="text-base font-semibold text-slate-900">
                        {perfil.nombre || "Sin nombre"}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{perfil.correo}</p>
                    </div>
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-500">
                      Rol inicial
                      <select
                        className="campo-formulario"
                        defaultValue="operador"
                        name="rol"
                      >
                        <option value="operador">Operador</option>
                        <option value="admin">Admin</option>
                        {usuarioActual.perfil.rol === "superadmin" ? (
                          <option value="superadmin">Superadmin</option>
                        ) : null}
                      </select>
                    </label>
                    <div className="flex items-end">
                      <Button size="3" type="submit">
                        Aprobar
                      </Button>
                    </div>
                  </form>
                ))
              )}
            </div>
          </article>

          <article className="tarjeta-suave rounded-[28px] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Usuarios activos
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Cambia permisos cuando sea necesario.
                </p>
              </div>
              <Badge color="green" radius="full" size="2" variant="soft">
                {activos.length} activos
              </Badge>
            </div>

            <div className="mt-6 space-y-4">
              {activos.map((perfil) => {
                const bloqueadoPorPermiso =
                  perfil.id === usuarioActual.usuario.id ||
                  (perfil.rol === "superadmin" &&
                    usuarioActual.perfil.rol !== "superadmin");

                return (
                  <form
                    action={actualizar_rol}
                    className="grid gap-4 rounded-[24px] border border-slate-200/80 bg-white/80 p-5 lg:grid-cols-[minmax(0,1fr)_180px_150px]"
                    key={perfil.id}
                  >
                    <input name="id" type="hidden" value={perfil.id} />
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
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{perfil.correo}</p>
                      {bloqueadoPorPermiso ? (
                        <Text as="p" className="mt-2 block text-xs text-slate-400">
                          {perfil.id === usuarioActual.usuario.id
                            ? "Tu propio rol no se puede modificar."
                            : "Solo el superadmin puede cambiar esta cuenta."}
                        </Text>
                      ) : null}
                    </div>

                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-500">
                      Rol
                      <select
                        className="campo-formulario"
                        defaultValue={perfil.rol}
                        disabled={bloqueadoPorPermiso}
                        name="rol"
                      >
                        <option value="operador">Operador</option>
                        <option value="admin">Admin</option>
                        {puede_asignar_rol(usuarioActual.perfil.rol, "superadmin") ? (
                          <option value="superadmin">Superadmin</option>
                        ) : null}
                      </select>
                    </label>

                    <div className="flex items-end">
                      <Button disabled={bloqueadoPorPermiso} size="3" type="submit">
                        Guardar
                      </Button>
                    </div>
                  </form>
                );
              })}
            </div>
          </article>
        </>
      )}
    </section>
  );
}
