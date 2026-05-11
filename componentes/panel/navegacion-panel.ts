import {
  IconoCertificados,
  IconoClientes,
  IconoEquipos,
  IconoHome,
  IconoInspecciones,
  IconoLotes,
  IconoParametros,
  IconoProductos,
  IconoUsuario,
} from "@/componentes/panel/iconos";
import type { RolUsuario } from "@/lib/tipos";

const rolesAccesoTotal = [
  "admin",
  "gerente_laboratorio",
] as const satisfies readonly RolUsuario[];
const rolesOperacion = [
  ...rolesAccesoTotal,
  "laboratorista",
] as const satisfies readonly RolUsuario[];
const rolesDashboard = [
  ...rolesOperacion,
  "gte_calidad",
  "gte_plantas",
  "dir_operaciones",
] as const satisfies readonly RolUsuario[];

export const enlacesPanel = [
  {
    href: "/",
    etiqueta: "Home",
    icono: IconoHome,
    rolesPermitidos: rolesDashboard,
  },
  {
    href: "/clientes",
    etiqueta: "Clientes",
    icono: IconoClientes,
    rolesPermitidos: rolesOperacion,
  },
  {
    href: "/productos",
    etiqueta: "Productos",
    icono: IconoProductos,
    rolesPermitidos: rolesOperacion,
  },
  {
    href: "/equipos",
    etiqueta: "Equipos",
    icono: IconoEquipos,
    rolesPermitidos: rolesOperacion,
  },
  {
    href: "/parametros",
    etiqueta: "Parámetros",
    icono: IconoParametros,
    rolesPermitidos: rolesOperacion,
  },
  {
    href: "/lotes",
    etiqueta: "Lotes",
    icono: IconoLotes,
    rolesPermitidos: rolesOperacion,
  },
  {
    href: "/inspecciones",
    etiqueta: "Inspecciones",
    icono: IconoInspecciones,
    rolesPermitidos: rolesOperacion,
  },
  {
    href: "/certificados",
    etiqueta: "Certificados",
    icono: IconoCertificados,
    rolesPermitidos: rolesOperacion,
  },
  {
    href: "/settings",
    etiqueta: "Usuario",
    icono: IconoUsuario,
    rolesPermitidos: rolesAccesoTotal,
  },
] as const;

export type EnlacePanel = (typeof enlacesPanel)[number];

export function obtenerEnlacesPanelPorRol(rol: RolUsuario): EnlacePanel[] {
  return enlacesPanel.filter((enlace) => {
    const rolesPermitidos: readonly RolUsuario[] = enlace.rolesPermitidos;
    return rolesPermitidos.includes(rol);
  });
}

export function rutaActiva(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function obtenerContextoRuta(pathname: string) {
  if (pathname.startsWith("/settings")) {
    return {
      seccion: "Usuario",
      titulo: "Mi perfil",
    };
  }

  if (pathname.startsWith("/clientes")) {
    return {
      seccion: "Clientes",
      titulo: "Gestión de clientes",
    };
  }

  if (pathname.startsWith("/equipos")) {
    return {
      seccion: "Equipos",
      titulo: "Equipos de laboratorio",
    };
  }

  if (pathname.startsWith("/productos")) {
    return {
      seccion: "Productos",
      titulo: "Catálogo de productos",
    };
  }

  if (pathname.startsWith("/parametros")) {
    return {
      seccion: "Parámetros",
      titulo: "Catálogo de parámetros",
    };
  }

  if (pathname.startsWith("/lotes")) {
    return {
      seccion: "Lotes",
      titulo: "Lotes de producción",
    };
  }

  if (pathname.startsWith("/inspecciones")) {
    return {
      seccion: "Inspecciones",
      titulo: "Inspecciones y resultados",
    };
  }

  if (pathname.startsWith("/certificados")) {
    return {
      seccion: "Certificados",
      titulo: "Certificados de calidad",
    };
  }

  return {
    seccion: "Home",
    titulo: "Dashboard",
  };
}
