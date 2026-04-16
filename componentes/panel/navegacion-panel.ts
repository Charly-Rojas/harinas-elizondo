import {
  IconoCertificados,
  IconoClientes,
  IconoEquipos,
  IconoHome,
  IconoInspecciones,
  IconoLotes,
  IconoParametros,
  IconoSettings,
} from "@/componentes/panel/iconos";

export const enlacesPanel = [
  {
    href: "/",
    etiqueta: "Home",
    icono: IconoHome,
  },
  {
    href: "/clientes",
    etiqueta: "Clientes",
    icono: IconoClientes,
  },
  {
    href: "/equipos",
    etiqueta: "Equipos",
    icono: IconoEquipos,
  },
  {
    href: "/parametros",
    etiqueta: "Parámetros",
    icono: IconoParametros,
  },
  {
    href: "/lotes",
    etiqueta: "Lotes",
    icono: IconoLotes,
  },
  {
    href: "/inspecciones",
    etiqueta: "Inspecciones",
    icono: IconoInspecciones,
  },
  {
    href: "/certificados",
    etiqueta: "Certificados",
    icono: IconoCertificados,
  },
  {
    href: "/settings",
    etiqueta: "Settings",
    icono: IconoSettings,
  },
] as const;

export function rutaActiva(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function obtenerContextoRuta(pathname: string) {
  if (pathname.startsWith("/settings")) {
    return {
      seccion: "Settings",
      titulo: "Configuración",
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
