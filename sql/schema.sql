-- Laredo Martin High School Alumni Directory
-- Run this in the Supabase SQL Editor.
-- This version creates profiles automatically when an Auth user registers,
-- protects approval status, and enforces directory privacy at the database level.

create extension if not exists pgcrypto;

do $$ begin
  create type public.profile_status as enum ('pending','approved','rejected');
exception when duplicate_object then null;
end $$;

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

-- Remove the original broad profile SELECT policy if this schema is being
-- applied to the existing project. Regular members must not be able to read
-- hidden columns directly; they use get_directory_profiles() instead.
drop policy if exists "approved members can view approved profiles" on public.profiles;
drop policy if exists "users can insert own profile" on public.profiles;
drop policy if exists "users can update own profile" on public.profiles;
drop policy if exists "admins can view all profiles" on public.profiles;
drop policy if exists "users can view own profile" on public.profiles;
drop policy if exists "admins can update profiles" on public.profiles;

create policy "users can view own profile"
on public.profiles for select to authenticated
using (id = auth.uid());

create policy "admins can view all profiles"
on public.profiles for select to authenticated
using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

create policy "users can insert own pending profile"
on public.profiles for insert to authenticated
with check (id = auth.uid() and status = 'pending');

create policy "users can update own profile"
on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "admins can update profiles"
on public.profiles for update to authenticated
using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- Admin membership itself is private.
drop policy if exists "admins can view admins" on public.admins;
create policy "admins can view admins"
on public.admins for select to authenticated
using (user_id = auth.uid());

-- Messages can only be read by their two participants.
drop policy if exists "participants can view messages" on public.messages;
drop policy if exists "members can send messages" on public.messages;
drop policy if exists "recipient can mark messages read" on public.messages;
create policy "participants can view messages"
on public.messages for select to authenticated
using (sender_id = auth.uid() or recipient_id = auth.uid());

create policy "approved members can send messages"
on public.messages for insert to authenticated
with check (
  sender_id = auth.uid()
  and exists (select 1 from public.profiles s where s.id = auth.uid() and s.status = 'approved')
  and exists (select 1 from public.profiles r where r.id = recipient_id and r.status = 'approved' and r.allow_messages = true)
);

-- No general UPDATE policy is granted. A future read-receipt function can be
-- added without allowing participants to modify message content or ownership.

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

-- Prevent a normal member from changing their own approval status.
create or replace function public.protect_profile_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status
     and not exists (select 1 from public.admins a where a.user_id = auth.uid()) then
    new.status := old.status;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_status on public.profiles;
create trigger profiles_protect_status
before update on public.profiles
for each row execute function public.protect_profile_status();

-- Create the profile automatically as soon as Auth creates a user. This is
-- essential when email confirmation is enabled because signUp() may return
-- without an authenticated browser session.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  y integer;
begin
  begin
    y := (new.raw_user_meta_data->>'graduation_year')::integer;
  exception when others then
    y := 1900;
  end;
  if y is null or y < 1900 or y > 2100 then y := 1900; end if;

  insert into public.profiles (
    id, first_name, last_name, graduation_year, street_address, city, state,
    zip, phone, email, show_address, show_phone, show_email, allow_messages, status
  ) values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'first_name',''), 'Member'),
    coalesce(nullif(new.raw_user_meta_data->>'last_name',''), 'Member'),
    y,
    new.raw_user_meta_data->>'street_address',
    new.raw_user_meta_data->>'city',
    coalesce(nullif(new.raw_user_meta_data->>'state',''), 'TX'),
    new.raw_user_meta_data->>'zip',
    new.raw_user_meta_data->>'phone',
    new.email,
    coalesce((new.raw_user_meta_data->>'show_address')::boolean, false),
    coalesce((new.raw_user_meta_data->>'show_phone')::boolean, false),
    coalesce((new.raw_user_meta_data->>'show_email')::boolean, false),
    coalesce((new.raw_user_meta_data->>'allow_messages')::boolean, true),
    'pending'
  ) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Keep the directory email synchronized if the member changes their Auth email.
create or replace function public.handle_auth_email_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
after update of email on auth.users
for each row execute function public.handle_auth_email_update();

-- Safe directory function: regular members never receive hidden address,
-- phone, or email values unless the member explicitly opted to show them.
create or replace function public.get_directory_profiles()
returns table (
  id uuid,
  first_name text,
  last_name text,
  graduation_year integer,
  city text,
  state text,
  street_address text,
  zip text,
  phone text,
  email text,
  allow_messages boolean
)
language sql
security definer
set search_path = public
as $$
  select p.id, p.first_name, p.last_name, p.graduation_year,
         p.city, p.state,
         case when p.show_address then p.street_address else null end,
         case when p.show_address then p.zip else null end,
         case when p.show_phone then p.phone else null end,
         case when p.show_email then p.email else null end,
         p.allow_messages
  from public.profiles p
  where p.status = 'approved'
    and auth.uid() is not null
    and exists (select 1 from public.profiles me where me.id = auth.uid() and me.status = 'approved');
$$;

create or replace function public.get_contact_target(target_id uuid)
returns table (id uuid, first_name text, last_name text)
language sql
security definer
set search_path = public
as $$
  select p.id, p.first_name, p.last_name
  from public.profiles p
  where p.id = target_id
    and p.status = 'approved'
    and p.allow_messages = true
    and auth.uid() is not null
    and exists (select 1 from public.profiles me where me.id = auth.uid() and me.status = 'approved');
$$;

create or replace function public.admin_set_profile_status(target_id uuid, new_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.admins a where a.user_id = auth.uid()) then
    raise exception 'Administrator access required';
  end if;
  if new_status not in ('pending','approved','rejected') then
    raise exception 'Invalid profile status';
  end if;
  update public.profiles
    set status = new_status::public.profile_status
    where id = target_id;
end;
$$;

revoke all on function public.get_directory_profiles() from public;
grant execute on function public.get_directory_profiles() to authenticated;
revoke all on function public.get_contact_target(uuid) from public;
grant execute on function public.get_contact_target(uuid) to authenticated;
revoke all on function public.admin_set_profile_status(uuid,text) from public;
grant execute on function public.admin_set_profile_status(uuid,text) to authenticated;

-- IMPORTANT: Never expose a Supabase secret/service-role key in browser code.
