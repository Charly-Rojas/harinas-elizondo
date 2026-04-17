import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Button, Callout } from "@radix-ui/themes";
import { enviar_certificado_cliente } from "@/app/(privado)/certificados/acciones";
import { BotonImprimir } from "@/componentes/panel/boton-imprimir";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { CertificadoConRelaciones } from "@/lib/tipos-dominio";

function formatNumber(valor: number | null) {
  if (valor === null || valor === undefined) return "-";
  return new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: 4,
  }).format(valor);
}

export default async function PaginaDetalleCertificado({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    tipo?: string | string[];
    mensaje?: string | string[];
  }>;
}) {
  const { id } = await params;
  const parametros = await searchParams;
  const idCertificado = Number(id);
  const tipo =
    typeof parametros.tipo === "string" ? parametros.tipo : undefined;
  const mensaje =
    typeof parametros.mensaje === "string" ? parametros.mensaje : undefined;

  if (!idCertificado) {
    notFound();
  }

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("certificados_calidad")
    .select(
      "*, clientes(id_cliente, nombre), lotes_produccion(id_lote, numero_lote, fecha_produccion, fecha_caducidad, productos(*)), inspecciones(id_inspeccion, secuencia, es_ajuste, id_inspeccion_base), certificado_resultados(*)"
    )
    .eq("id_certificado", idCertificado)
    .maybeSingle();

  const certificado = data as CertificadoConRelaciones | null;

  if (!certificado) {
    notFound();
  }

  const fuera = certificado.certificado_resultados.filter(
    (resultado) => resultado.dentro_especificacion === false
  ).length;

  return (
    <section className="flex flex-col gap-5">
      {mensaje ? (
        <Callout.Root
          color={tipo === "error" ? "red" : "green"}
          size="2"
          variant="soft"
        >
          <Callout.Text>{mensaje}</Callout.Text>
        </Callout.Root>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <p className="text-sm font-medium text-slate-500">Certificados</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            {certificado.folio || `Certificado #${certificado.id_certificado}`}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700"
            href="/certificados"
          >
            Volver
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700"
            href={`/certificados/${certificado.id_certificado}/pdf`}
            target="_blank"
          >
            Abrir PDF
          </Link>
          <form action={enviar_certificado_cliente}>
            <input
              name="id_certificado"
              type="hidden"
              value={certificado.id_certificado}
            />
            <Button size="2" type="submit" variant="soft">
              Enviar al cliente
            </Button>
          </form>
          <BotonImprimir />
        </div>
      </div>

      <article className="tarjeta-suave rounded-[28px] p-5 md:p-8 print:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-slate-400">
              Certificado de calidad
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">
              {certificado.folio || `#${certificado.id_certificado}`}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Cliente: {certificado.clientes?.nombre || "-"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge color="blue" radius="full" variant="soft">
              {certificado.status_certificado}
            </Badge>
            <Badge color={fuera > 0 ? "red" : "jade"} radius="full" variant="soft">
              {fuera > 0 ? `${fuera} fuera de especificación` : "Snapshot válido"}
            </Badge>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[22px] border border-slate-200/80 bg-white/80 p-4">
            <p className="text-sm font-medium text-slate-500">Lote</p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {certificado.lotes_produccion?.numero_lote || "-"}
            </p>
          </div>
          <div className="rounded-[22px] border border-slate-200/80 bg-white/80 p-4">
            <p className="text-sm font-medium text-slate-500">Inspección</p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {certificado.inspecciones?.secuencia || "-"}
            </p>
          </div>
          <div className="rounded-[22px] border border-slate-200/80 bg-white/80 p-4">
            <p className="text-sm font-medium text-slate-500">Factura</p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {certificado.numero_factura || "-"}
            </p>
          </div>
          <div className="rounded-[22px] border border-slate-200/80 bg-white/80 p-4">
            <p className="text-sm font-medium text-slate-500">Orden de compra</p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {certificado.numero_orden_compra || "-"}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-[22px] border border-slate-200/80 bg-white/80 p-4">
            <p className="text-sm font-medium text-slate-500">Cantidad solicitada</p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {formatNumber(certificado.cantidad_solicitada)}
            </p>
          </div>
          <div className="rounded-[22px] border border-slate-200/80 bg-white/80 p-4">
            <p className="text-sm font-medium text-slate-500">Cantidad entrega</p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {formatNumber(certificado.cantidad_total_entrega)}
            </p>
          </div>
          <div className="rounded-[22px] border border-slate-200/80 bg-white/80 p-4">
            <p className="text-sm font-medium text-slate-500">Caducidad</p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {certificado.fecha_caducidad || certificado.lotes_produccion?.fecha_caducidad || "-"}
            </p>
          </div>
        </div>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/50">
                <th className="px-4 py-3 font-semibold text-slate-500">Parámetro</th>
                <th className="px-4 py-3 font-semibold text-slate-500">Valor</th>
                <th className="px-4 py-3 font-semibold text-slate-500">Unidad</th>
                <th className="px-4 py-3 font-semibold text-slate-500">Mín</th>
                <th className="px-4 py-3 font-semibold text-slate-500">Máx</th>
                <th className="px-4 py-3 font-semibold text-slate-500">Desviación</th>
                <th className="px-4 py-3 font-semibold text-slate-500">Estado</th>
              </tr>
            </thead>
            <tbody>
              {certificado.certificado_resultados.map((resultado) => (
                <tr className="border-b border-slate-100" key={resultado.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">
                      {resultado.nombre_parametro}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {resultado.clave_parametro || "-"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {resultado.valor_texto || formatNumber(resultado.valor)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {resultado.unidad_medida || "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {formatNumber(resultado.lim_min_aplicado)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {formatNumber(resultado.lim_max_aplicado)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {formatNumber(resultado.desviacion)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      color={
                        resultado.dentro_especificacion === false
                          ? "red"
                          : resultado.dentro_especificacion === true
                            ? "jade"
                            : "gray"
                      }
                      radius="full"
                      size="1"
                      variant="soft"
                    >
                      {resultado.dentro_especificacion === false
                        ? "Fuera"
                        : resultado.dentro_especificacion === true
                          ? "Dentro"
                          : "Sin límite"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {certificado.observaciones ? (
          <div className="mt-6 rounded-[22px] border border-slate-200/80 bg-slate-50/70 p-4">
            <p className="text-sm font-medium text-slate-500">Observaciones</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              {certificado.observaciones}
            </p>
          </div>
        ) : null}
      </article>
    </section>
  );
}
