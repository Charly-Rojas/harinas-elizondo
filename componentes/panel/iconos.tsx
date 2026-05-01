import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement>;

function IconoBase({
  children,
  ...props
}: Props & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="18"
      viewBox="0 0 24 24"
      width="18"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconoHome(props: Props) {
  return (
    <IconoBase {...props}>
      <path
        d="M4 11.5L12 5l8 6.5V20a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1v-8.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </IconoBase>
  );
}

export function IconoSettings(props: Props) {
  return (
    <IconoBase {...props}>
      <path
        d="M12 15.3A3.3 3.3 0 1 0 12 8.7a3.3 3.3 0 0 0 0 6.6Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M19.4 15a1.6 1.6 0 0 0 .32 1.77l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.6 1.6 0 0 0-1.77-.32 1.6 1.6 0 0 0-.97 1.46V21a2 2 0 0 1-4 0v-.09a1.6 1.6 0 0 0-.97-1.46 1.6 1.6 0 0 0-1.77.32l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.6 1.6 0 0 0 4.6 15a1.6 1.6 0 0 0-1.46-.97H3a2 2 0 0 1 0-4h.09A1.6 1.6 0 0 0 4.55 9a1.6 1.6 0 0 0-.32-1.77l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.6 1.6 0 0 0 8.83 4a1.6 1.6 0 0 0 .97-1.46V2.5a2 2 0 0 1 4 0v.09a1.6 1.6 0 0 0 .97 1.46 1.6 1.6 0 0 0 1.77-.32l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.6 1.6 0 0 0 19.4 9c.16.39.56.65.98.65H20.5a2 2 0 1 1 0 4h-.09c-.42 0-.82.26-1 .65Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </IconoBase>
  );
}

export function IconoUsuario(props: Props) {
  return (
    <IconoBase {...props}>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M5 20a7 7 0 0 1 14 0"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </IconoBase>
  );
}

export function IconoClientes(props: Props) {
  return (
    <IconoBase {...props}>
      <path
        d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M23 21v-2a4 4 0 0 0-3-3.87"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M16 3.13a4 4 0 0 1 0 7.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </IconoBase>
  );
}

export function IconoProductos(props: Props) {
  return (
    <IconoBase {...props}>
      <path
        d="M12 3 19 6.5v11L12 21l-7-3.5v-11L12 3Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M5 6.5 12 10l7-3.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M12 10v11"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </IconoBase>
  );
}

export function IconoEquipos(props: Props) {
  return (
    <IconoBase {...props}>
      <path
        d="M9 3h6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
      <path
        d="M10 3v4.2L5 16.1A3 3 0 0 0 7.65 21h8.7A3 3 0 0 0 19 16.1L14 7.2V3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M8.5 14h7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </IconoBase>
  );
}

export function IconoParametros(props: Props) {
  return (
    <IconoBase {...props}>
      <path
        d="M5 6h14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
      <path
        d="M5 12h14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
      <path
        d="M5 18h14"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
      <circle cx="9" cy="6" r="2" fill="white" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="15" cy="12" r="2" fill="white" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="11" cy="18" r="2" fill="white" stroke="currentColor" strokeWidth="1.7" />
    </IconoBase>
  );
}

export function IconoLotes(props: Props) {
  return (
    <IconoBase {...props}>
      <path
        d="M5 8.5 12 5l7 3.5-7 3.5-7-3.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M5 8.5V16l7 3.5 7-3.5V8.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M12 12v7.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </IconoBase>
  );
}

export function IconoInspecciones(props: Props) {
  return (
    <IconoBase {...props}>
      <path
        d="M9 4h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M7 8h8M7 12h6M7 16h5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
      <circle cx="6" cy="6" r="2" fill="white" stroke="currentColor" strokeWidth="1.7" />
    </IconoBase>
  );
}

export function IconoCertificados(props: Props) {
  return (
    <IconoBase {...props}>
      <path
        d="M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M9 9h6M9 13h6M9 17h4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
      <path
        d="m14.5 4 1 2.2L18 7l-2.5.8-1 2.2-1-2.2L11 7l2.5-.8 1-2.2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </IconoBase>
  );
}

export function IconoBuscar(props: Props) {
  return (
    <IconoBase {...props}>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="m16 16 4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </IconoBase>
  );
}

export function IconoCampana(props: Props) {
  return (
    <IconoBase {...props}>
      <path
        d="M6.5 16.5h11l-1.1-1.25a2.8 2.8 0 0 1-.7-1.84V10a3.7 3.7 0 1 0-7.4 0v3.41c0 .68-.25 1.34-.7 1.84L6.5 16.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </IconoBase>
  );
}

export function IconoSalir(props: Props) {
  return (
    <IconoBase {...props}>
      <path
        d="M9 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M16 17l4-5-4-5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path d="M20 12H9" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </IconoBase>
  );
}

export function IconoMenu(props: Props) {
  return (
    <IconoBase {...props}>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </IconoBase>
  );
}

export function IconoCerrar(props: Props) {
  return (
    <IconoBase {...props}>
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </IconoBase>
  );
}

export function IconoPokeballNormal(props: Props) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="32"
      shapeRendering="crispEdges"
      viewBox="0 0 32 32"
      width="32"
      {...props}
    >
      <path
        d="M12 2h8v2h4v2h2v2h2v4h2v8h-2v4h-2v2h-2v2h-4v2h-8v-2H8v-2H6v-2H4v-4H2v-8h2V8h2V6h2V4h4Z"
        fill="#1F2937"
      />
      <path d="M12 4h8v2h4v2h2v2h2v4H4v-4h2V8h2V6h4Z" fill="#EE1515" />
      <path d="M4 16h24v4h-2v2h-2v2h-4v2h-8v-2H8v-2H6v-2H4Z" fill="#FFFFFF" />
      <path d="M4 15h24v2H4Z" fill="#1F2937" />
      <path d="M14 12h4v2h2v4h-2v2h-4v-2h-2v-4h2Z" fill="#6B7280" />
      <path d="M14 14h4v4h-4Z" fill="#FFFFFF" />
      <path d="M15 15h2v2h-2Z" fill="#D1D5DB" />
    </svg>
  );
}

export function IconoGreatBall(props: Props) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="32"
      shapeRendering="crispEdges"
      viewBox="0 0 32 32"
      width="32"
      {...props}
    >
      <path
        d="M12 2h8v2h4v2h2v2h2v4h2v8h-2v4h-2v2h-2v2h-4v2h-8v-2H8v-2H6v-2H4v-4H2v-8h2V8h2V6h2V4h4Z"
        fill="#1F2937"
      />
      <path d="M12 4h8v2h4v2h2v2h2v4H4v-4h2V8h2V6h4Z" fill="#3B82F6" />
      <path d="M4 16h24v4h-2v2h-2v2h-4v2h-8v-2H8v-2H6v-2H4Z" fill="#FFFFFF" />
      <path d="M8 8h4v2h2v2h-2v-2H8Zm12 0h4v2h-4v2h-2v-2h2Z" fill="#EF4444" />
      <path d="M4 15h24v2H4Z" fill="#1F2937" />
      <path d="M14 12h4v2h2v4h-2v2h-4v-2h-2v-4h2Z" fill="#6B7280" />
      <path d="M14 14h4v4h-4Z" fill="#FFFFFF" />
      <path d="M15 15h2v2h-2Z" fill="#D1D5DB" />
    </svg>
  );
}

export function IconoUltraBall(props: Props) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="32"
      shapeRendering="crispEdges"
      viewBox="0 0 32 32"
      width="32"
      {...props}
    >
      <path
        d="M12 2h8v2h4v2h2v2h2v4h2v8h-2v4h-2v2h-2v2h-4v2h-8v-2H8v-2H6v-2H4v-4H2v-8h2V8h2V6h2V4h4Z"
        fill="#111827"
      />
      <path d="M12 4h8v2h4v2h2v2h2v4H4v-4h2V8h2V6h4Z" fill="#1F2937" />
      <path d="M4 16h24v4h-2v2h-2v2h-4v2h-8v-2H8v-2H6v-2H4Z" fill="#FFFFFF" />
      <path d="M8 8h6v2H8Zm10 0h6v2h-6Zm-2 2h4v2h-4Z" fill="#EAB308" />
      <path d="M4 15h24v2H4Z" fill="#111827" />
      <path d="M14 12h4v2h2v4h-2v2h-4v-2h-2v-4h2Z" fill="#6B7280" />
      <path d="M14 14h4v4h-4Z" fill="#FFFFFF" />
      <path d="M15 15h2v2h-2Z" fill="#D1D5DB" />
    </svg>
  );
}

export function IconoSafariBall(props: Props) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="32"
      shapeRendering="crispEdges"
      viewBox="0 0 32 32"
      width="32"
      {...props}
    >
      <path
        d="M12 2h8v2h4v2h2v2h2v4h2v8h-2v4h-2v2h-2v2h-4v2h-8v-2H8v-2H6v-2H4v-4H2v-8h2V8h2V6h2V4h4Z"
        fill="#1F2937"
      />
      <path d="M12 4h8v2h4v2h2v2h2v4H4v-4h2V8h2V6h4Z" fill="#22C55E" />
      <path d="M4 16h24v4h-2v2h-2v2h-4v2h-8v-2H8v-2H6v-2H4Z" fill="#FFFFFF" />
      <path d="M8 8h4v2H8Zm6 2h4v2h-4Zm6-2h4v2h-4Zm-10 4h4v2h-4Zm10 0h4v2h-4Z" fill="#166534" />
      <path d="M12 8h2v2h-2Zm6 4h2v2h-2Z" fill="#86EFAC" />
      <path d="M4 15h24v2H4Z" fill="#1F2937" />
      <path d="M14 12h4v2h2v4h-2v2h-4v-2h-2v-4h2Z" fill="#6B7280" />
      <path d="M14 14h4v4h-4Z" fill="#FFFFFF" />
      <path d="M15 15h2v2h-2Z" fill="#D1D5DB" />
    </svg>
  );
}

export function IconoPremierBall(props: Props) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="32"
      shapeRendering="crispEdges"
      viewBox="0 0 32 32"
      width="32"
      {...props}
    >
      <path
        d="M12 2h8v2h4v2h2v2h2v4h2v8h-2v4h-2v2h-2v2h-4v2h-8v-2H8v-2H6v-2H4v-4H2v-8h2V8h2V6h2V4h4Z"
        fill="#D1D5DB"
      />
      <path d="M12 4h8v2h4v2h2v2h2v4H4v-4h2V8h2V6h4Z" fill="#FFFFFF" />
      <path d="M4 16h24v4h-2v2h-2v2h-4v2h-8v-2H8v-2H6v-2H4Z" fill="#FFFFFF" />
      <path d="M4 15h24v2H4Z" fill="#EF4444" />
      <path d="M14 12h4v2h2v4h-2v2h-4v-2h-2v-4h2Z" fill="#EF4444" />
      <path d="M14 14h4v4h-4Z" fill="#FFFFFF" />
      <path d="M15 15h2v2h-2Z" fill="#FCA5A5" />
    </svg>
  );
}

export function IconoMasterBall(props: Props) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="32"
      shapeRendering="crispEdges"
      viewBox="0 0 32 32"
      width="32"
      {...props}
    >
      <path
        d="M12 2h8v2h4v2h2v2h2v4h2v8h-2v4h-2v2h-2v2h-4v2h-8v-2H8v-2H6v-2H4v-4H2v-8h2V8h2V6h2V4h4Z"
        fill="#1F2937"
      />
      <path d="M12 4h8v2h4v2h2v2h2v4H4v-4h2V8h2V6h4Z" fill="#8B5CF6" />
      <path d="M4 16h24v4h-2v2h-2v2h-4v2h-8v-2H8v-2H6v-2H4Z" fill="#FFFFFF" />
      <path d="M9 8h2v2H9Zm12 0h2v2h-2Z" fill="#F9A8D4" />
      <path d="M10 12h2V8h2v2h1V8h2v2h1V8h2v4h2V8h2v4h-2v-1h-1v1h-2v-1h-1v1h-2v-1h-1v1h-2v-1h-1v1h-2Z" fill="#FFFFFF" />
      <path d="M4 15h24v2H4Z" fill="#1F2937" />
      <path d="M14 12h4v2h2v4h-2v2h-4v-2h-2v-4h2Z" fill="#6B7280" />
      <path d="M14 14h4v4h-4Z" fill="#FFFFFF" />
      <path d="M15 15h2v2h-2Z" fill="#D1D5DB" />
    </svg>
  );
}
