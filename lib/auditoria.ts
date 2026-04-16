import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

type EventoAuditoria = {
  entidad: string;
  entidadId: string;
  accion: string;
  descripcion?: string | null;
  motivo?: string | null;
  valoresAnteriores?: Record<string, unknown>;
  valoresNuevos?: Record<string, unknown>;
  usuarioId?: string | null;
};

export async function registrarAuditoria(
  supabase: SupabaseClient,
  evento: EventoAuditoria
) {
  const { error } = await supabase.from("auditoria_eventos").insert({
    entidad: evento.entidad,
    entidad_id: evento.entidadId,
    accion: evento.accion,
    descripcion: evento.descripcion ?? null,
    motivo: evento.motivo ?? null,
    valores_anteriores: evento.valoresAnteriores ?? {},
    valores_nuevos: evento.valoresNuevos ?? {},
    usuario_id: evento.usuarioId ?? null,
  });

  if (error) {
    console.error("[auditoria]", error);
  }
}
