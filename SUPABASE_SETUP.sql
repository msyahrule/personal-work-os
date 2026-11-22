-- Personal Work OS - Supabase setup
-- Run once in Supabase Dashboard > SQL Editor.
-- Safe for browser apps: authenticated users only; RLS stays enabled.

create table if not exists public.pwo_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  module text not null,
  record_id text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists pwo_records_user_module_record_idx
on public.pwo_records(user_id, module, record_id);

alter table public.pwo_records enable row level security;

revoke all on table public.pwo_records from anon;
revoke all on table public.pwo_records from public;
grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.pwo_records to authenticated;

drop policy if exists "Users can view own records" on public.pwo_records;
drop policy if exists "Users can insert own records" on public.pwo_records;
drop policy if exists "Users can update own records" on public.pwo_records;
drop policy if exists "Users can delete own records" on public.pwo_records;

create policy "Users can view own records"
on public.pwo_records for select to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own records"
on public.pwo_records for insert to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own records"
on public.pwo_records for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own records"
on public.pwo_records for delete to authenticated
using (auth.uid() = user_id);

create or replace function public.pwo_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pwo_records_updated_at on public.pwo_records;
create trigger pwo_records_updated_at
before update on public.pwo_records
for each row execute function public.pwo_set_updated_at();
