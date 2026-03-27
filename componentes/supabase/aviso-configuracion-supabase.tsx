import { Badge } from "@radix-ui/themes";

export function AvisoConfiguracionSupabase() {
  return (
    <section className="superficie-panel w-full max-w-2xl rounded-[32px] p-8">
      <Badge color="amber" radius="full" size="2" variant="soft">
        Configuración pendiente
      </Badge>
      <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900">
        Faltan variables de entorno de Supabase
      </h1>
      <p className="mt-4 text-base leading-7 text-slate-600">
        Agrega las credenciales en <code>.env.local</code> para activar el login
        y la administración de usuarios.
      </p>

      <div className="mt-8 rounded-[24px] border border-slate-200/80 bg-white/75 p-5">
        <pre className="overflow-x-auto text-sm leading-7 text-slate-700">
{`NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=`}
        </pre>
      </div>

      <p className="mt-5 text-sm leading-6 text-slate-500">
        Después ejecuta el script <code>supabase/esquema.sql</code> en tu proyecto
        de Supabase.
      </p>
    </section>
  );
}
