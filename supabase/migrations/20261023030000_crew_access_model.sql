-- Private crew access model. Browser clients receive authenticated read access
-- only; trusted crew administration is defined by a later migration.

alter table public.pilots
  add column if not exists management_mode text not null default 'personal'
  check (management_mode in ('personal', 'school_only', 'family_linked'));

create table if not exists public.crews (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.crew_memberships (
  id uuid primary key default gen_random_uuid(),
  crew_id uuid not null references public.crews (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  status text not null default 'active' check (status in ('active', 'revoked')),
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (crew_id, user_id)
);

create table if not exists public.pilot_access (
  id uuid primary key default gen_random_uuid(),
  crew_id uuid not null references public.crews (id) on delete cascade,
  pilot_id uuid not null references public.pilots (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  access_level text not null check (access_level in ('read', 'write')),
  access_context text not null check (access_context in ('school', 'family')),
  status text not null default 'active' check (status in ('active', 'revoked')),
  expires_at timestamptz,
  granted_by_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (crew_id, pilot_id, user_id)
);

create index if not exists crews_owner_user_id_idx on public.crews (owner_user_id);
create index if not exists crew_memberships_user_id_idx on public.crew_memberships (user_id);
create index if not exists crew_memberships_crew_status_idx on public.crew_memberships (crew_id, status);
create index if not exists pilot_access_pilot_user_id_idx on public.pilot_access (pilot_id, user_id);
create index if not exists pilot_access_crew_status_idx on public.pilot_access (crew_id, status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists crews_set_updated_at on public.crews;
create trigger crews_set_updated_at
before update on public.crews
for each row execute function public.set_updated_at();

drop trigger if exists crew_memberships_set_updated_at on public.crew_memberships;
create trigger crew_memberships_set_updated_at
before update on public.crew_memberships
for each row execute function public.set_updated_at();

drop trigger if exists pilot_access_set_updated_at on public.pilot_access;
create trigger pilot_access_set_updated_at
before update on public.pilot_access
for each row execute function public.set_updated_at();

create or replace function public.is_active_crew_member(p_crew_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.crew_memberships
    where crew_id = p_crew_id
      and user_id = (select auth.uid())
      and status = 'active'
      and (expires_at is null or expires_at > timezone('utc', now()))
  );
$$;

create or replace function public.is_active_crew_admin(p_crew_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.crews c
    left join public.crew_memberships cm on cm.crew_id = c.id
    where c.id = p_crew_id
      and (
        c.owner_user_id = (select auth.uid())
        or (
          cm.user_id = (select auth.uid())
          and cm.role in ('owner', 'admin')
          and cm.status = 'active'
          and (cm.expires_at is null or cm.expires_at > timezone('utc', now()))
        )
      )
  );
$$;

revoke all on table public.crews from anon, authenticated;
revoke all on table public.crew_memberships from anon, authenticated;
revoke all on table public.pilot_access from anon, authenticated;
revoke all on function public.is_active_crew_member(uuid) from public;
revoke all on function public.is_active_crew_admin(uuid) from public;
grant select on table public.crews to authenticated;
grant select on table public.crew_memberships to authenticated;
grant select on table public.pilot_access to authenticated;
grant execute on function public.is_active_crew_member(uuid) to authenticated;
grant execute on function public.is_active_crew_admin(uuid) to authenticated;

alter table public.crews enable row level security;
alter table public.crew_memberships enable row level security;
alter table public.pilot_access enable row level security;

drop policy if exists "Users can read their private crews" on public.crews;
create policy "Users can read their private crews"
on public.crews for select to authenticated
using (
  owner_user_id = (select auth.uid())
  or public.is_active_crew_member(id)
);

drop policy if exists "Users can read their crew memberships" on public.crew_memberships;
create policy "Users can read their crew memberships"
on public.crew_memberships for select to authenticated
using (
  user_id = (select auth.uid())
  or public.is_active_crew_admin(crew_id)
);

drop policy if exists "Users can read explicitly granted pilot access" on public.pilot_access;
create policy "Users can read explicitly granted pilot access"
on public.pilot_access for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.pilots
    where pilots.id = pilot_access.pilot_id
      and pilots.user_id = (select auth.uid())
  )
);

revoke all on function public.delete_my_cloud_data() from anon;
grant execute on function public.delete_my_cloud_data() to authenticated;
