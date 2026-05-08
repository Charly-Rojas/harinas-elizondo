export type FieldErrors<TFields extends string = string> = Partial<
  Record<TFields, string>
>;

export type FormState<
  TValues extends Record<string, unknown>,
  TFields extends string = Extract<keyof TValues, string>,
> = {
  formError?: string;
  fieldErrors?: FieldErrors<TFields>;
  values?: Partial<TValues>;
  exito?: string;
};

export function obtenerValor<T>(
  values: Partial<Record<string, unknown>> | undefined,
  key: string,
  fallback: T
) {
  const value = values?.[key];
  return (value === undefined ? fallback : (value as T));
}

export function obtenerErrorCampo(
  fieldErrors: Partial<Record<string, string>> | undefined,
  key: string
) {
  return fieldErrors?.[key];
}

export function tieneErrorCampo(
  fieldErrors: Partial<Record<string, string>> | undefined,
  key: string
) {
  return Boolean(obtenerErrorCampo(fieldErrors, key));
}
