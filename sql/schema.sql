-- Laredo Martin High School Alumni Directory
-- Run this in Supabase SQL Editor.
-- After running it, add the first administrator as described in README.md.

create extension if not exists pgcrypto;

create type public.profile_status as enum ('pending','approved','rejected');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  graduation_year integer not null check (graduation_year between 1900 and 2100),
  street_address text,
  city text,
  state text default 'TX',
  zip text,
  phone text,
  email text,
  show_address boolean not null default false,
  show_phone boolean not null default false,
  show_email boolean not null default false,
  allow_messages boolean not null default true,
  status public.profile_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint no_self_message check (sender_id <> recipient_id)
);

alter table public.profiles enable row level security;
alter table public.admins enable row level security;
alter table public.messages enable row level security;

-- Approved alumni can see approved alumni.
create policy "approved members can view approved profiles"
on public.profiles for select to authenticated
using (
  status = 'approved'
  or id = auth.uid()
  or exists (select 1 from public.admins a where a.user_id = auth.uid())
);

-- A user can create/update only their own profile.
create policy "users can insert own profile"
on public.profiles for insert to authenticated
with check (id = auth.uid());

create policy "users can update own profile"
on public.profiles for update to authenticated
using (id = auth.uid() or exists (select 1 from public.admins a where a.user_id = auth.uid()))
with check (id = auth.uid() or exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- Admins can view the admin table; members cannot.
create policy "admins can view admins"
on public.admins for select to authenticated
using (user_id = auth.uid());

-- Messages: sender and recipient can see their own conversations.
create policy "participants can view messages"
on public.messages for select to authenticated
using (sender_id = auth.uid() or recipient_id = auth.uid());

create policy "members can send messages"
on public.messages for insert to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.profiles p
    where p.id = recipient_id
      and p.status = 'approved'
      and p.allow_messages = true
  )
);

create policy "recipient can mark messages read"
on public.messages for update to authenticated
using (recipient_id = auth.uid())
with check (recipient_id = auth.uid());

-- Keep updated_at current.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

-- Populate profile email from Auth when a profile is created.
create or replace function public.copy_auth_email()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.email = (select email from auth.users where id = new.id);
  return new;
end $$;

drop trigger if exists profile_copy_email on public.profiles;
create trigger profile_copy_email before insert on public.profiles
for each row execute function public.copy_auth_email();

-- IMPORTANT: Do not expose service_role/secret keys in browser code.
