import { redirect } from "next/navigation";
import { FormularioRestablecer } from "@/componentes/autenticacion/formulario-restablecer";
import { obtener_usuario_actual } from "@/lib/autorizacion";

export default async function PaginaRestablecer() {
  const usuario = await obtener_usuario_actual();

  if (!usuario) {
    redirect("/login?error=Debes iniciar el proceso de recuperación desde tu correo.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-6 md:px-6">
      <div className="w-full max-w-[640px]">
        <FormularioRestablecer />
      </div>
    </main>
  );
}
