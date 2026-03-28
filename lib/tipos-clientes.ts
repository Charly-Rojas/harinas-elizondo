export type Cliente = {
  id_cliente: number;
  nombre: string;
  rfc: string;
  domicilio_fiscal: string;
  correo_almacenista: string | null;
  correo_gte_calidad: string | null;
  solicita_certificado: boolean;
  status: "activo" | "inactivo";
  creado_en: string;
  creado_por: string | null;
};

export type Direccion = {
  id_direccion: number;
  id_cliente: number;
  direccion: string;
  activo: boolean;
};

export type ParamRefCliente = {
  id: number;
  id_cliente: number;
  nombre: string;
  lim_min: number;
  lim_max: number;
};

export type ClienteConRelaciones = Cliente & {
  direcciones: Direccion[];
  param_ref_cliente: ParamRefCliente[];
};
