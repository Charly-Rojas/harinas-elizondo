## Harinas Elizondo

Panel de Harinas Elizondo con `Next 16`, `Supabase Auth` y layout autenticado minimalista.

## Variables de entorno

Crea un `.env.local` a partir de `.env.example`:

```bash
cp .env.example .env.local
```

Llena estas variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_AUTH_REDIRECT_URL=
```

## Base de datos en Supabase

1. Abre el SQL Editor de tu proyecto de Supabase.
2. Ejecuta el script [supabase/esquema.sql](/home/charly/Documents/Anahuac/10mo%20Semestre/DesarrolloSoftware/harinas-elizondo/supabase/esquema.sql).
3. Crea primero la cuenta `superadmin@harinas-elizondo.local`; esa cuenta se aprueba sola y nace con rol `superadmin`.

Si tienes confirmación de correo activa en Supabase, define `SUPABASE_AUTH_REDIRECT_URL` con la base pública de tu app, por ejemplo `http://localhost:3000`. El sistema agregará automáticamente `/auth/confirm`.

## Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Rutas principales

- `/login`: login y registro
- `/`: panel autenticado
- `/settings`: administración de usuarios y roles

## Roles

- `superadmin`: acceso total
- `admin`: aprueba usuarios y asigna `admin` u `operador`
- `operador`: acceso normal al panel

Los usuarios nuevos se registran como `operador` y quedan pendientes hasta aprobación.

## Comandos útiles

```bash
npm run lint
npm run build
```

## Referencias

- Layout de referencia: [public/layout.png](/home/charly/Documents/Anahuac/10mo%20Semestre/DesarrolloSoftware/harinas-elizondo/public/layout.png)
- Logo horizontal: [public/logo_horizontal.png](/home/charly/Documents/Anahuac/10mo%20Semestre/DesarrolloSoftware/harinas-elizondo/public/logo_horizontal.png)
