import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Button } from "@radix-ui/themes";
import { cambiar_status_lote } from "@/app/(privado)/lotes/acciones";
import {
  puede_escribir_panel,
  requiere_sesion,
  usuario_activo,
} from "@/lib/autorizacion";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { LoteConRelaciones } from "@/lib/tipos-dominio";

type Parametros = Promise<{
  id: string;
}>;

function colorStatusLote(status: LoteConRelaciones["status"]) {
  return status === "agotado" ? "red" : "green";
}

function textoStatusLote(status: LoteConRelaciones["status"]) {
  return status === "agotado" ? "Agotado" : "Activo";
}

export default async function DetalleLote({ params }: { params: Parametros }) {
  const usuarioActual = await requiere_sesion();
  const { id } = await params;
  const idLote = Number(id);

  if (!Number.isInteger(idLote)) {
    notFound();
  }

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("lotes_produccion")
    .select("*, productos(*), inspecciones(*)")
    .eq("id_lote", idLote)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  const lote = data as LoteConRelaciones;
  const puedeEscribir =
    usuario_activo(usuarioActual.perfil) &&
    puede_escribir_panel(usuarioActual.perfil.rol);

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button asChild color="gray" size="2" variant="soft">
            <Link href="/lotes">Volver a lotes</Link>
          </Button>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">
            Lote {lote.numero_lote}
          </h1>
        </div>
        <Badge
          color={colorStatusLote(lote.status)}
          radius="full"
          size="2"
          variant="soft"
        >
          {textoStatusLote(lote.status)}
        </Badge>
      </div>

      <article className="tarjeta-suave rounded-[28px] p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[22px] border border-slate-200/80 bg-white/80 p-4">
            <p className="text-sm font-medium text-slate-500">Producto</p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {lote.productos?.nombre || "Sin producto"}
            </p>
          </div>
          <div className="rounded-[22px] border border-slate-200/80 bg-white/80 p-4">
            <p className="text-sm font-medium text-slate-500">Variedad</p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {lote.variedad || "-"}
            </p>
          </div>
          <div className="rounded-[22px] border border-slate-200/80 bg-white/80 p-4">
            <p className="text-sm font-medium text-slate-500">Producción</p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {lote.fecha_produccion || "-"}
            </p>
          </div>
          <div className="rounded-[22px] border border-slate-200/80 bg-white/80 p-4">
            <p className="text-sm font-medium text-slate-500">Caducidad</p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {lote.fecha_caducidad || "-"}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-[22px] border border-slate-200/80 bg-white/80 p-4">
          <p className="text-sm font-medium text-slate-500">Observaciones</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {lote.observaciones || "Sin observaciones"}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Badge color="blue" radius="full" size="2" variant="soft">
            {lote.inspecciones?.length ?? 0} inspecciones
          </Badge>
          {puedeEscribir && lote.status !== "agotado" ? (
            <form action={cambiar_status_lote}>
              <input name="id_lote" type="hidden" value={lote.id_lote} />
              <input name="status" type="hidden" value="agotado" />
              <Button color="red" size="3" type="submit" variant="soft">
                Marcar como agotado
              </Button>
            </form>
          ) : null}
        </div>
      </article>
    </section>
  );
}
