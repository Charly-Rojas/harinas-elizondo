import { type NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const destino = request.nextUrl.clone();

  if (code) {
    const supabase = await crearClienteServidor();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      destino.pathname = "/restablecer";
      destino.searchParams.delete("code");
      return NextResponse.redirect(destino);
    }
  }

  destino.pathname = "/login";
  destino.searchParams.set(
    "error",
    "El enlace de recuperación es inválido o ha expirado."
  );
  return NextResponse.redirect(destino);
}
