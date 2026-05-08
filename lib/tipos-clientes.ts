import type {
  DireccionEntregaCaptura,
  DireccionEstructurada,
} from "@/lib/direcciones";

export type EstadoCliente = "activo" | "inactivo" | "baja";

export type Cliente = {
  id_cliente: number;
  nombre: string;
  rfc: string;
  domicilio_fiscal: string;
  domicilio_entrega: string | null;
  dom_fiscal_calle: string | null;
  dom_fiscal_numero_exterior: string | null;
  dom_fiscal_numero_interior: string | null;
  dom_fiscal_colonia: string | null;
  dom_fiscal_ciudad: string | null;
  dom_fiscal_estado: string | null;
  dom_fiscal_codigo_postal: string | null;
  dom_fiscal_pais: string | null;
  contacto_certificado: string | null;
  correo_contacto_cliente: string | null;
  correo_almacenista: string | null;
  correo_gte_calidad: string | null;
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
  calle: string | null;
  numero_exterior: string | null;
  numero_interior: string | null;
  colonia: string | null;
  ciudad: string | null;
  estado: string | null;
  codigo_postal: string | null;
  pais: string | null;
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

export type ClienteFormValues = {
  id_cliente: string;
  nombre: string;
  rfc: string;
  contacto_certificado: string;
  correo_contacto_cliente: string;
  correo_almacenista: string;
  correo_gte_calidad: string;
  solicita_certificado: boolean;
  usa_especificaciones_cliente: boolean;
  domicilio_fiscal: DireccionEstructurada;
  domicilios: DireccionEntregaCaptura[];
  parametros_json: Array<{
    clave_parametro: string;
    nombre: string;
    unidad_medida: string;
    lim_min: string;
    lim_max: string;
  }>;
};
