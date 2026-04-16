export type EstadoRegistro = "activo" | "inactivo" | "baja";
export type TipoEquipo = "alveografo" | "farinografo" | "otro";
export type TipoOrigenInspeccion = "medicion" | "ajuste" | "certificado";
export type EstadoInspeccion = "borrador" | "cerrada" | "aprobada" | "cancelada";
export type EstadoCertificado = "borrador" | "emitido" | "cancelado";
export type EstadoEnvioCertificado = "pendiente" | "enviado" | "fallido";
export type OrigenLimites = "internacional" | "cliente" | "interno";

export type Producto = {
  id_producto: number;
  clave: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
};

export type ProductoLigero = Pick<Producto, "id_producto" | "clave" | "nombre" | "activo">;

export type EquipoLaboratorio = {
  id_equipo: number;
  clave: string;
  tipo: TipoEquipo;
  descripcion_larga: string;
  descripcion_corta: string | null;
  marca: string | null;
  modelo: string | null;
  serie: string | null;
  proveedor: string | null;
  fecha_adquisicion: string | null;
  garantia: string | null;
  vigencia_garantia: string | null;
  ubicacion: string | null;
  responsable: string | null;
  mantenimiento: string | null;
  status: EstadoRegistro;
  motivo_status: string | null;
  creado_en: string;
  actualizado_en: string;
  creado_por: string | null;
  actualizado_por: string | null;
};

export type ParametroCalidad = {
  id_parametro: number;
  clave: string;
  nombre: string;
  unidad_medida: string | null;
  equipo_origen: TipoEquipo;
  descripcion: string | null;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
};

export type EquipoParametro = {
  id: number;
  id_equipo: number;
  id_parametro: number;
  desviacion_permitida: number | null;
  lim_min_internacional: number | null;
  lim_max_internacional: number | null;
  especificacion_interna: string | null;
  activo: boolean;
  creado_en: string;
  actualizado_en: string;
};

export type EquipoParametroConDetalle = EquipoParametro & {
  parametros_calidad?: ParametroCalidad | null;
};

export type EquipoConRelaciones = EquipoLaboratorio & {
  equipos_parametros: EquipoParametroConDetalle[];
};

export type LoteProduccion = {
  id_lote: number;
  numero_lote: string;
  id_producto: number | null;
  variedad: string | null;
  fecha_produccion: string | null;
  fecha_caducidad: string | null;
  observaciones: string | null;
  creado_en: string;
  actualizado_en: string;
  creado_por: string | null;
  actualizado_por: string | null;
};

export type LoteConRelaciones = LoteProduccion & {
  productos?: Producto | null;
  inspecciones?: Inspeccion[] | null;
};

export type Inspeccion = {
  id_inspeccion: number;
  id_lote: number;
  id_cliente: number | null;
  secuencia: string;
  tipo_origen: TipoOrigenInspeccion;
  es_ajuste: boolean;
  id_inspeccion_base: number | null;
  motivo_ajuste: string | null;
  observaciones: string | null;
  status: EstadoInspeccion;
  fecha_inspeccion: string;
  creado_en: string;
  actualizado_en: string;
  creada_por: string | null;
  actualizada_por: string | null;
};

export type ResultadoAnalisisConDetalle = ResultadoAnalisis & {
  parametros_calidad?: ParametroCalidad | null;
  equipos_laboratorio?: EquipoLaboratorio | null;
};

export type InspeccionConRelaciones = Inspeccion & {
  lotes_produccion?: LoteProduccion | null;
  clientes?: {
    id_cliente: number;
    nombre: string;
    correo_contacto_cliente?: string | null;
    correo_almacenista?: string | null;
  } | null;
  inspecciones?: {
    id_inspeccion: number;
    secuencia: string;
  } | null;
  resultados_analisis: ResultadoAnalisisConDetalle[];
};

export type ResultadoAnalisis = {
  id_resultado: number;
  id_inspeccion: number;
  id_parametro: number;
  id_equipo: number | null;
  valor: number | null;
  valor_texto: string | null;
  unidad_medida: string | null;
  lim_min_aplicado: number | null;
  lim_max_aplicado: number | null;
  origen_limites: OrigenLimites;
  desviacion: number | null;
  dentro_especificacion: boolean | null;
  observaciones: string | null;
  capturado_en: string;
  capturado_por: string | null;
  actualizado_en: string;
  actualizado_por: string | null;
};

export type CertificadoCalidad = {
  id_certificado: number;
  folio: string | null;
  id_cliente: number;
  id_lote: number;
  id_inspeccion: number;
  numero_orden_compra: string | null;
  cantidad_solicitada: number | null;
  cantidad_total_entrega: number | null;
  numero_factura: string | null;
  fecha_envio: string | null;
  fecha_caducidad: string | null;
  correo_cliente: string | null;
  correo_almacen: string | null;
  status_certificado: EstadoCertificado;
  status_envio: EstadoEnvioCertificado;
  pdf_storage_path: string | null;
  pdf_nombre_archivo: string | null;
  observaciones: string | null;
  emitido_en: string | null;
  creado_en: string;
  actualizado_en: string;
  emitido_por: string | null;
  actualizado_por: string | null;
};

export type CertificadoResultado = {
  id: number;
  id_certificado: number;
  id_parametro: number | null;
  clave_parametro: string | null;
  nombre_parametro: string;
  unidad_medida: string | null;
  valor: number | null;
  valor_texto: string | null;
  lim_min_aplicado: number | null;
  lim_max_aplicado: number | null;
  desviacion: number | null;
  dentro_especificacion: boolean | null;
  origen_limites: string | null;
  observaciones: string | null;
};

export type CertificadoConRelaciones = CertificadoCalidad & {
  clientes?: {
    id_cliente: number;
    nombre: string;
  } | null;
  lotes_produccion?: (LoteProduccion & {
    productos?: Producto | null;
  }) | null;
  inspecciones?: {
    id_inspeccion: number;
    secuencia: string;
    es_ajuste: boolean;
    id_inspeccion_base: number | null;
  } | null;
  certificado_resultados: CertificadoResultado[];
};

export type AuditoriaEvento = {
  id: number;
  entidad: string;
  entidad_id: string;
  accion: string;
  descripcion: string | null;
  motivo: string | null;
  valores_anteriores: Record<string, unknown>;
  valores_nuevos: Record<string, unknown>;
  usuario_id: string | null;
  creado_en: string;
};
