"use client";

import { Button } from "@radix-ui/themes";

export function BotonImprimir() {
  return (
    <Button onClick={() => window.print()} size="2" type="button">
      Imprimir / PDF
    </Button>
  );
}
