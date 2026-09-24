-- Applied to the Supabase project on 2026-09-24 (kept here for version control).
-- Roles for admin portal users: owner (full access + team management) and purchaser (products only).
alter table public.admin_users
  add column if not exists role text not null default 'purchaser' check (role in ('owner', 'purchaser')),
  add column if not exists email text,
  add column if not exists display_name text,
  add column if not exists must_change_password boolean not null default false;

update public.admin_users a set role = 'owner', email = u.email
  from auth.users u where u.id = a.user_id;

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()) and role = 'owner');
$$;
revoke execute on function public.is_owner() from public, anon;
grant execute on function public.is_owner() to authenticated;

drop policy if exists "Admins can read own membership" on public.admin_users;
create policy "Members read own row, owners read team" on public.admin_users
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_owner()));

drop policy if exists "Admins can insert categories" on public.categories;
drop policy if exists "Admins can update categories" on public.categories;
drop policy if exists "Admins can delete categories" on public.categories;
create policy "Owners can insert categories" on public.categories for insert to authenticated with check ((select public.is_owner()));
create policy "Owners can update categories" on public.categories for update to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
create policy "Owners can delete categories" on public.categories for delete to authenticated using ((select public.is_owner()));
