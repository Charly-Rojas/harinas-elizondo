import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/servidor";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const destino = request.nextUrl.clone();

  destino.pathname = "/";
  destino.searchParams.delete("token_hash");
  destino.searchParams.delete("type");

  if (tokenHash && type) {
    const supabase = await crearClienteServidor();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      if (type === "recovery") {
        destino.pathname = "/restablecer";
        return NextResponse.redirect(destino);
      }

      return NextResponse.redirect(destino);
    }
  }

  destino.pathname = "/login";
  destino.searchParams.set("error", "No fue posible confirmar tu correo.");
  return NextResponse.redirect(destino);
}
