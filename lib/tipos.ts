export type RolUsuario =
  | "admin"
  | "gerente_laboratorio"
  | "gte_calidad"
  | "gte_plantas"
  | "dir_operaciones"
  | "laboratorista";

export type StatusUsuario = "pendiente" | "activo" | "rechazado" | "baja";

export type PerfilUsuario = {
  id: string;
  correo: string;
  nombre: string | null;
  rol: RolUsuario;
  aprobado: boolean;
  status: StatusUsuario;
  aprobado_en: string | null;
  aprobado_por: string | null;
  creado_en: string;
};
