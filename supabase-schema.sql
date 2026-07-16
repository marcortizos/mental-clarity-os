-- Mental Clarity OS — Supabase schema
-- Run this once in the Supabase SQL Editor (Project > SQL Editor > New query)
-- after creating your Supabase project.

-- One row per user holds their entire app state as JSON, mirroring the
-- two keys the app used in Claude's artifact storage (checkins-data and
-- app-config). This keeps the migration simple: same shape, new home.

create table if not exists user_data (
  user_id uuid references auth.users(id) on delete cascade primary key,
  checkins jsonb not null default '{}'::jsonb,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Row Level Security: a user can only ever read or write their own row.
alter table user_data enable row level security;

create policy "Users can view their own data"
  on user_data for select
  using (auth.uid() = user_id);

create policy "Users can insert their own data"
  on user_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own data"
  on user_data for update
  using (auth.uid() = user_id);

-- Automatically create an empty row the moment someone signs up, so the
-- app never has to handle a "no row yet" case.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_data (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Keep updated_at current on every write.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_user_data_updated
  before update on user_data
  for each row execute procedure public.set_updated_at();
