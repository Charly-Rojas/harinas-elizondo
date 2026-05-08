import type { RolUsuario, StatusUsuario } from "@/lib/tipos";

export function obtenerTextoRol(rol: RolUsuario) {
  if (rol === "admin") return "Admin";
  if (rol === "gerente_laboratorio") return "Gerente laboratorio";
  if (rol === "gte_calidad") return "Gte. Aseg. Calidad";
  if (rol === "gte_plantas") return "Gte. Plantas";
  if (rol === "dir_operaciones") return "Dir. Operaciones";
  return "Laboratorista";
}

export function obtenerColorRol(rol: RolUsuario) {
  if (rol === "admin") return "indigo";
  if (rol === "gerente_laboratorio") return "violet";
  if (rol === "gte_calidad") return "blue";
  if (rol === "gte_plantas") return "teal";
  if (rol === "dir_operaciones") return "amber";
  return "gray";
}

export function obtenerTextoStatusUsuario(status: StatusUsuario) {
  if (status === "activo") return "Activo";
  if (status === "rechazado") return "Rechazado";
  if (status === "baja") return "Baja";
  return "Pendiente";
}

export function obtenerColorStatusUsuario(status: StatusUsuario) {
  if (status === "activo") return "green";
  if (status === "rechazado") return "red";
  if (status === "baja") return "orange";
  return "amber";
}
