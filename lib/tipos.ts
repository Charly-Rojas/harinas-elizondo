export type RolUsuario = "superadmin" | "admin" | "operador";

export type PerfilUsuario = {
  id: string;
  correo: string;
  nombre: string | null;
  rol: RolUsuario;
  aprobado: boolean;
  aprobado_en: string | null;
  aprobado_por: string | null;
  creado_en: string;
};
