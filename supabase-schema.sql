-- Kings League IMEX · Supabase schema
-- Ejecuta este archivo completo en el SQL Editor de tu proyecto Supabase.
-- Después despliega la función supabase/functions/admin-account.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Perfiles de usuario (rol, club y jugador vinculado)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  role text not null default 'FAN' check (role in ('ADMIN', 'PRESIDENT', 'PLAYER', 'FAN')),
  team_id text,
  player_id text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: leer propio o admin" on public.profiles;
create policy "profiles: leer propio o admin"
  on public.profiles for select
  to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1 from public.profiles admin
      where admin.id = auth.uid() and admin.role = 'ADMIN'
    )
  );

drop policy if exists "profiles: insertar propio" on public.profiles;
create policy "profiles: insertar propio"
  on public.profiles for insert
  to authenticated
  with check (
    id = auth.uid()
    and role in ('FAN', 'PLAYER')
  );

drop policy if exists "profiles: actualizar admin" on public.profiles;
create policy "profiles: actualizar admin"
  on public.profiles for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles admin
      where admin.id = auth.uid() and admin.role = 'ADMIN'
    )
  )
  with check (
    exists (
      select 1 from public.profiles admin
      where admin.id = auth.uid() and admin.role = 'ADMIN'
    )
  );

drop policy if exists "profiles: eliminar admin" on public.profiles;
create policy "profiles: eliminar admin"
  on public.profiles for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles admin
      where admin.id = auth.uid() and admin.role = 'ADMIN'
    )
  );

-- Perfil automático al registrarse (solo aficionado o jugador).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role, team_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    case when new.raw_user_meta_data ->> 'role' = 'PLAYER' then 'PLAYER' else 'FAN' end,
    nullif(new.raw_user_meta_data ->> 'team_id', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Estado compartido de la liga (una fila por liga, payload JSONB)
-- ---------------------------------------------------------------------------
create table if not exists public.app_state (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

-- Lectura pública para que la web funcione sin iniciar sesión.
drop policy if exists "app_state: lectura pública" on public.app_state;
create policy "app_state: lectura pública"
  on public.app_state for select
  to anon, authenticated
  using (true);

-- Escritura para usuarios autenticados. Para producción, mueve las mutaciones
-- a una Edge Function con validación de rol (ADMIN / PRESIDENT).
drop policy if exists "app_state: escritura autenticada" on public.app_state;
create policy "app_state: escritura autenticada"
  on public.app_state for insert
  to authenticated
  with check (true);

drop policy if exists "app_state: actualización autenticada" on public.app_state;
create policy "app_state: actualización autenticada"
  on public.app_state for update
  to authenticated
  using (true)
  with check (true);

-- Realtime
do $$
begin
  alter publication supabase_realtime add table public.app_state;
exception
  when duplicate_object then null;
  when undefined_object then null;
end;
$$;

-- Fila inicial vacía (la app la rellena en el primer guardado).
insert into public.app_state (id, payload)
values ('main', '{}'::jsonb)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Crear el primer organizador
-- 1) Registra el usuario desde la web o el dashboard de Supabase.
-- 2) Ejecuta (cambiando el correo):
--    update public.profiles set role = 'ADMIN' where email = 'admin@imexleague.mx';
-- 3) Asigna presidentes con:
--    update public.profiles set role = 'PRESIDENT', team_id = 'team-1'
--    where email = 'cuervos@imexleague.mx';
-- ---------------------------------------------------------------------------
