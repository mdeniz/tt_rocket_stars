-- Cloud progress schema. Runtime clients must use the publishable key only.

create table if not exists public.pilots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  local_id text not null,
  name text not null check (char_length(name) between 1 and 80),
  avatar text,
  language text not null default 'es' check (language in ('es', 'en')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, local_id),
  unique (id, user_id)
);

create table if not exists public.progress_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  pilot_id uuid not null references public.pilots (id) on delete cascade,
  version bigint not null default 1 check (version > 0),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (pilot_id),
  foreign key (pilot_id, user_id) references public.pilots (id, user_id)
);

create index if not exists pilots_user_id_idx on public.pilots (user_id);
create index if not exists progress_snapshots_user_id_idx on public.progress_snapshots (user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists pilots_set_updated_at on public.pilots;
create trigger pilots_set_updated_at
before update on public.pilots
for each row execute function public.set_updated_at();

drop trigger if exists progress_snapshots_set_updated_at on public.progress_snapshots;
create trigger progress_snapshots_set_updated_at
before update on public.progress_snapshots
for each row execute function public.set_updated_at();

alter table public.pilots enable row level security;
alter table public.progress_snapshots enable row level security;

drop policy if exists "Users can read their own pilots" on public.pilots;
create policy "Users can read their own pilots"
on public.pilots for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Users can create their own pilots" on public.pilots;
create policy "Users can create their own pilots"
on public.pilots for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "Users can update their own pilots" on public.pilots;
create policy "Users can update their own pilots"
on public.pilots for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "Users can delete their own pilots" on public.pilots;
create policy "Users can delete their own pilots"
on public.pilots for delete to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Users can read their own progress" on public.progress_snapshots;
create policy "Users can read their own progress"
on public.progress_snapshots for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Users can create their own progress" on public.progress_snapshots;
create policy "Users can create their own progress"
on public.progress_snapshots for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.pilots
    where pilots.id = progress_snapshots.pilot_id
      and pilots.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can update their own progress" on public.progress_snapshots;
create policy "Users can update their own progress"
on public.progress_snapshots for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.pilots
    where pilots.id = progress_snapshots.pilot_id
      and pilots.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can delete their own progress" on public.progress_snapshots;
create policy "Users can delete their own progress"
on public.progress_snapshots for delete to authenticated
using (user_id = (select auth.uid()));

create or replace function public.delete_my_cloud_data()
returns void
language sql
security invoker
set search_path = public
as $$
  delete from public.progress_snapshots where user_id = (select auth.uid());
  delete from public.pilots where user_id = (select auth.uid());
$$;

revoke all on function public.delete_my_cloud_data() from public;
grant execute on function public.delete_my_cloud_data() to authenticated;
