export type EstadoCliente = "activo" | "inactivo" | "baja";

export type Cliente = {
  id_cliente: number;
  nombre: string;
  rfc: string;
  domicilio_fiscal: string;
  domicilio_entrega: string | null;
  contacto_certificado: string | null;
  correo_contacto_cliente: string | null;
  correo_almacenista: string | null;
  correo_gte_calidad: string | null;
  documento_especificaciones: string | null;
  solicita_certificado: boolean;
  usa_especificaciones_cliente: boolean;
  status: EstadoCliente;
  motivo_status: string | null;
  creado_en: string;
  actualizado_en: string;
  creado_por: string | null;
  actualizado_por: string | null;
};

export type Direccion = {
  id_direccion: number;
  id_cliente: number;
  etiqueta: string;
  direccion: string;
  activo: boolean;
  creado_en?: string;
  actualizado_en?: string;
};

export type ParamRefCliente = {
  id: number;
  id_cliente: number;
  id_producto?: number | null;
  clave_parametro?: string;
  nombre: string;
  unidad_medida?: string | null;
  lim_min: number | null;
  lim_max: number | null;
  origen_limites?: "cliente" | "internacional";
  documento_referencia?: string | null;
  activo?: boolean;
  creado_en?: string;
  actualizado_en?: string;
};

export type ClienteConRelaciones = Cliente & {
  direcciones: Direccion[];
  param_ref_cliente: ParamRefCliente[];
};
