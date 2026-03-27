"use client";

import { Button } from "@radix-ui/themes";
import { useFormStatus } from "react-dom";

export function BotonEnvio({
  texto,
  textoPendiente,
}: {
  texto: string;
  textoPendiente: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full !bg-indigo-950 !text-white" disabled={pending} size="3" type="submit">
      {pending ? textoPendiente : texto}
    </Button>
  );
}
