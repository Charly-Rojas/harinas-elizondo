"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/servidor";
import type { FormState } from "@/lib/form-state";

type ValoresFormularioAutenticacion = {
  nombre: string;
  correo: string;
  contrasena: string;
  confirmar: string;
};

export type EstadoFormularioAutenticacion = FormState<
  ValoresFormularioAutenticacion,
  keyof ValoresFormularioAutenticacion
>;

type ErrorSupabase = {
  message?: string;
  status?: number;
  code?: string;
  name?: string;
};

function limpiarTexto(valor: FormDataEntryValue | null) {
  return String(valor ?? "").trim();
}

function normalizarCorreo(valor: FormDataEntryValue | null) {
  return limpiarTexto(valor).toLowerCase();
}

function errorFormulario(
  values: ValoresFormularioAutenticacion,
  formError: string,
  fieldErrors?: EstadoFormularioAutenticacion["fieldErrors"]
): EstadoFormularioAutenticacion {
  return { formError, fieldErrors, values };
}

function construirMensajeErrorSupabase(error: ErrorSupabase | null | undefined) {
  const mensaje = error?.message ?? "";
  const texto = mensaje.toLowerCase();

  if (texto.includes("invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
  }

  if (texto.includes("email not confirmed")) {
    return "Debes confirmar tu correo antes de iniciar sesión.";
  }

  if (texto.includes("user already registered")) {
    return "Ese correo ya está registrado.";
  }

  if (texto.includes("password should be at least")) {
    return "La contraseña debe tener al menos 6 caracteres.";
  }

  if (texto.includes("database error saving new user")) {
    return "Supabase no pudo guardar el usuario. Revisa que ejecutaste `supabase/esquema.sql` correctamente.";
  }

  if (
    texto.includes("relation") ||
    texto.includes("trigger") ||
    texto.includes("perfiles")
  ) {
    return "La configuración de la base de datos de Harinas Elizondo está incompleta o tiene un error.";
  }

  if (texto.includes("signup is disabled")) {
    return "El registro de usuarios está deshabilitado en Supabase Auth.";
  }

  if (texto.includes("email rate limit exceeded")) {
    return "Supabase bloqueó temporalmente más correos de confirmación. Espera un momento o desactiva la confirmación por correo en Auth para pruebas locales.";
  }

  if (
    texto.includes("redirect url") ||
    texto.includes("redirect_to") ||
    texto.includes("not allowed")
  ) {
    return "La URL de confirmación no está permitida en Supabase Auth.";
  }

  if (process.env.NODE_ENV !== "production" && mensaje) {
    return `Error de Supabase: ${mensaje}`;
  }

  return "Ocurrió un error al hablar con Supabase.";
}

async function obtenerUrlConfirmacion() {
  const urlBase = process.env.SUPABASE_AUTH_REDIRECT_URL?.trim();

  if (!urlBase) {
    return undefined;
  }

  const urlNormalizada = urlBase.endsWith("/")
    ? urlBase.slice(0, -1)
    : urlBase;

  if (urlNormalizada.endsWith("/auth/confirm")) {
    return urlNormalizada;
  }

  return `${urlNormalizada}/auth/confirm`;
}

function correoYaExisteEnRespuesta(data: {
  user?: {
    identities?: unknown[];
  } | null;
  session?: unknown | null;
}) {
  if (data.session) {
    return false;
  }

  const identidades = Array.isArray(data.user?.identities)
    ? data.user.identities
    : [];

  return identidades.length === 0;
}

export async function iniciar_sesion(
  _estadoAnterior: EstadoFormularioAutenticacion,
  formData: FormData
): Promise<EstadoFormularioAutenticacion> {
  const correo = normalizarCorreo(formData.get("correo"));
  const contrasena = limpiarTexto(formData.get("contrasena"));
  const values = {
    nombre: "",
    correo,
    contrasena,
    confirmar: "",
  };

  if (!correo || !contrasena) {
    return errorFormulario(values, "Completa correo y contraseña.", {
      correo: !correo ? "Captura tu correo." : undefined,
      contrasena: !contrasena ? "Captura tu contraseña." : undefined,
    });
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email: correo,
    password: contrasena,
  });

  if (error) {
    console.error("[supabase][login]", {
      correo,
      message: error.message,
      status: error.status,
      code: error.code,
      name: error.name,
    });

    return errorFormulario(values, construirMensajeErrorSupabase(error));
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function registrar_usuario(
  _estadoAnterior: EstadoFormularioAutenticacion,
  formData: FormData
): Promise<EstadoFormularioAutenticacion> {
  const nombre = limpiarTexto(formData.get("nombre"));
  const correo = normalizarCorreo(formData.get("correo"));
  const contrasena = limpiarTexto(formData.get("contrasena"));
  const values = {
    nombre,
    correo,
    contrasena,
    confirmar: "",
  };

  if (!nombre || !correo || !contrasena) {
    return errorFormulario(values, "Completa nombre, correo y contraseña.", {
      nombre: !nombre ? "Captura tu nombre." : undefined,
      correo: !correo ? "Captura tu correo." : undefined,
      contrasena: !contrasena ? "Captura tu contraseña." : undefined,
    });
  }

  const supabase = await crearClienteServidor();
  const emailRedirectTo = await obtenerUrlConfirmacion();

  const { data, error } = await supabase.auth.signUp({
    email: correo,
    password: contrasena,
    options: {
      data: {
        nombre,
      },
      ...(emailRedirectTo ? { emailRedirectTo } : {}),
    },
  });

  if (error) {
    console.error("[supabase][registro]", {
      correo,
      message: error.message,
      status: error.status,
      code: error.code,
      name: error.name,
      emailRedirectTo,
    });

    return errorFormulario(values, construirMensajeErrorSupabase(error));
  }

  console.info("[supabase][registro_ok]", {
    correo,
    userId: data.user?.id,
    sessionActiva: Boolean(data.session),
    identidades: Array.isArray(data.user?.identities)
      ? data.user.identities.length
      : null,
  });

  if (correoYaExisteEnRespuesta(data)) {
    return errorFormulario(
      values,
      "Ese correo ya está registrado en Harinas Elizondo. Inicia sesión o usa otro correo."
    );
  }

  revalidatePath("/", "layout");

  if (data.session) {
    redirect("/");
  }

  return {
    exito:
      "Cuenta creada.",
  };
}

export async function solicitar_recuperacion(
  _estadoAnterior: EstadoFormularioAutenticacion,
  formData: FormData
): Promise<EstadoFormularioAutenticacion> {
  const correo = normalizarCorreo(formData.get("correo"));
  const values = {
    nombre: "",
    correo,
    contrasena: "",
    confirmar: "",
  };

  if (!correo) {
    return errorFormulario(values, "Ingresa tu correo electrónico.", {
      correo: "Captura tu correo.",
    });
  }

  const supabase = await crearClienteServidor();
  const urlRedireccion = await obtenerUrlConfirmacion();

  const { error } = await supabase.auth.resetPasswordForEmail(correo, {
    redirectTo: urlRedireccion?.replace("/auth/confirm", "/auth/restablecer"),
  });

  if (error) {
    console.error("[supabase][recuperacion]", {
      correo,
      message: error.message,
    });
    return errorFormulario(values, construirMensajeErrorSupabase(error));
  }

  return {
    exito:
      "Si el correo existe, recibirás un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada.",
  };
}

export async function restablecer_contrasena(
  _estadoAnterior: EstadoFormularioAutenticacion,
  formData: FormData
): Promise<EstadoFormularioAutenticacion> {
  const contrasena = limpiarTexto(formData.get("contrasena"));
  const confirmar = limpiarTexto(formData.get("confirmar"));
  const values = {
    nombre: "",
    correo: "",
    contrasena,
    confirmar,
  };

  if (!contrasena || contrasena.length < 6) {
    return errorFormulario(
      values,
      "La contraseña debe tener al menos 6 caracteres.",
      {
        contrasena: "La contraseña debe tener al menos 6 caracteres.",
      }
    );
  }

  if (contrasena !== confirmar) {
    return errorFormulario(values, "Las contraseñas no coinciden.", {
      confirmar: "La confirmación no coincide.",
    });
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.updateUser({ password: contrasena });

  if (error) {
    console.error("[supabase][restablecer]", { message: error.message });
    return errorFormulario(values, construirMensajeErrorSupabase(error));
  }

  return { exito: "Contraseña actualizada correctamente." };
}

export async function cerrar_sesion() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
