import { Badge, Button, Text } from "@radix-ui/themes";
import { cerrar_sesion } from "@/app/acciones/autenticacion";
import { BarraLateral } from "@/componentes/panel/barra-lateral";
import { EncabezadoPanel } from "@/componentes/panel/encabezado-panel";
import { AvisoConfiguracionSupabase } from "@/componentes/supabase/aviso-configuracion-supabase";
import { requiere_sesion } from "@/lib/autorizacion";
import { supabasePublicoConfigurado } from "@/lib/supabase/configuracion";

export default async function LayoutPrivado({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!supabasePublicoConfigurado()) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <AvisoConfiguracionSupabase />
      </main>
    );
  }

  const usuarioActual = await requiere_sesion();

  if (!usuarioActual.perfil.aprobado) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <section className="superficie-panel w-full max-w-xl rounded-[32px] p-8 text-center">
          <Badge color="indigo" radius="full" size="2" variant="soft">
            Acceso pendiente
          </Badge>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900">
            Tu cuenta todavía no ha sido aprobada
          </h1>
          <Text as="p" className="mt-4 block text-base leading-7 text-slate-600">
            Un administrador debe validar tu registro antes de permitirte entrar
            al panel.
          </Text>
          <div className="mt-8 rounded-[24px] border border-slate-200 bg-white/70 p-5 text-left">
            <p className="text-sm font-medium text-slate-500">Correo</p>
            <p className="mt-1 text-base font-semibold text-slate-900">
              {usuarioActual.perfil.correo}
            </p>
            <p className="mt-4 text-sm font-medium text-slate-500">Rol inicial</p>
            <p className="mt-1 text-base font-semibold text-slate-900">
              {usuarioActual.perfil.rol}
            </p>
          </div>
          <form action={cerrar_sesion} className="mt-8">
            <Button size="3" variant="soft" color="indigo">
              Cerrar sesión
            </Button>
          </form>
        </section>
      </main>
    );
  }

  const nombreVisible =
    usuarioActual.perfil.nombre || usuarioActual.usuario.email || "Usuario";

  return (
    <div className="min-h-screen overflow-hidden p-3 md:p-5">
      <div className="flex h-[calc(100vh-1.5rem)] w-full gap-3 md:h-[calc(100vh-2.5rem)] md:gap-5">
        <BarraLateral />
        <section className="superficie-panel flex min-w-0 flex-1 flex-col overflow-hidden rounded-[32px]">
          <EncabezadoPanel
            correo={usuarioActual.perfil.correo}
            nombre={nombreVisible}
            rol={usuarioActual.perfil.rol}
          />
          <main className="contenido-scroll min-h-0 flex-1 overflow-y-auto px-4 pb-5 pt-4 md:px-6 md:pb-6 md:pt-5">
            {children}
          </main>
        </section>
      </div>
    </div>
  );
}
