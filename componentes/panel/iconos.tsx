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
