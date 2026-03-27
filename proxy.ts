import type { NextRequest } from "next/server";
import { actualizar_sesion } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return actualizar_sesion(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
