import { redirect } from "next/navigation";
import { FormularioAutenticacion } from "@/componentes/autenticacion/formulario-autenticacion";
import { AvisoConfiguracionSupabase } from "@/componentes/supabase/aviso-configuracion-supabase";
import { obtener_usuario_actual } from "@/lib/autorizacion";
import { supabasePublicoConfigurado } from "@/lib/supabase/configuracion";

type ParametrosBusqueda = Promise<{
  error?: string | string[];
}>;

export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: ParametrosBusqueda;
}) {
  const parametros = await searchParams;
  const errorInicial =
    typeof parametros.error === "string" ? parametros.error : undefined;

  if (!supabasePublicoConfigurado()) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <AvisoConfiguracionSupabase />
      </main>
    );
  }

  const usuarioActual = await obtener_usuario_actual();

  if (usuarioActual) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-6 md:px-6">
      <div className="w-full max-w-[640px]">
        <section>
          <FormularioAutenticacion errorInicial={errorInicial} />
        </section>
      </div>
    </main>
  );
}
