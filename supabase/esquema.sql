create type public.rol_usuario as enum ('superadmin', 'admin', 'operador');

create table if not exists public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  correo text not null unique,
  nombre text,
  rol public.rol_usuario not null default 'operador',
  aprobado boolean not null default false,
  aprobado_en timestamptz,
  aprobado_por uuid references auth.users (id),
  creado_en timestamptz not null default timezone('utc', now())
);

create index if not exists perfiles_aprobado_idx on public.perfiles (aprobado);
create index if not exists perfiles_rol_idx on public.perfiles (rol);

alter table public.perfiles enable row level security;

grant usage on schema public to authenticated;
grant select on public.perfiles to authenticated;

create or replace function public.crear_perfil_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  es_superadmin_inicial boolean := lower(new.email) = 'superadmin@harinas-elizondo.local';
begin
  insert into public.perfiles (
    id,
    correo,
    nombre,
    rol,
    aprobado,
    aprobado_en
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    case
      when es_superadmin_inicial then 'superadmin'::public.rol_usuario
      else 'operador'::public.rol_usuario
    end,
    es_superadmin_inicial,
    case
      when es_superadmin_inicial then timezone('utc', now())
      else null
    end
  )
  on conflict (id) do update
  set
    correo = excluded.correo,
    nombre = coalesce(public.perfiles.nombre, excluded.nombre);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.crear_perfil_usuario();

drop policy if exists "El usuario ve su propio perfil" on public.perfiles;

create policy "El usuario ve su propio perfil"
on public.perfiles
for select
to authenticated
using ((select auth.uid()) = id);
