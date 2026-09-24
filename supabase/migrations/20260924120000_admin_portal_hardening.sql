-- Applied to the Supabase project on 2026-09-24 (kept here for version control).
-- Admin portal: category ordering, slug cascade, admin allowlist, admin-only
-- write policies for products/categories/product images, upload limits.

alter table public.categories add column if not exists sort_order integer not null default 0;
alter table public.categories add column if not exists created_at timestamptz not null default now();

alter table public.products drop constraint products_category_fkey;
alter table public.products add constraint products_category_fkey
  foreign key (category) references public.categories(slug) on update cascade on delete restrict;
create index if not exists products_category_idx on public.products(category);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
create policy "Admins can read own membership" on public.admin_users
  for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()));
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "Authenticated users can insert products" on public.products;
drop policy if exists "Authenticated users can update products" on public.products;
drop policy if exists "Authenticated users can delete products" on public.products;
create policy "Admins can insert products" on public.products for insert to authenticated with check ((select public.is_admin()));
create policy "Admins can update products" on public.products for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins can delete products" on public.products for delete to authenticated using ((select public.is_admin()));

create policy "Admins can insert categories" on public.categories for insert to authenticated with check ((select public.is_admin()));
create policy "Admins can update categories" on public.categories for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins can delete categories" on public.categories for delete to authenticated using ((select public.is_admin()));

drop policy if exists "Authenticated users can upload product images" on storage.objects;
drop policy if exists "Authenticated users can update product images" on storage.objects;
drop policy if exists "Authenticated users can delete product images" on storage.objects;
create policy "Admins can upload product images" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy "Admins can update product images" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()))
  with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy "Admins can delete product images" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));

update storage.buckets
  set file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif']
  where id = 'product-images';

-- To add another admin: create the user in Supabase (Authentication -> Users), then
--   insert into public.admin_users (user_id) select id from auth.users where email = '<their email>';
