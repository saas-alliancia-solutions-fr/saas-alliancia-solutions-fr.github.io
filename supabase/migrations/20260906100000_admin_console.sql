-- Console d'administration SAAS, réservée aux collaborateurs Alliancia autorisés.

create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('owner', 'admin', 'support', 'billing')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_admins_active_user_idx
  on public.app_admins(user_id)
  where active;

drop trigger if exists app_admins_touch_updated_at on public.app_admins;
create trigger app_admins_touch_updated_at
before update on public.app_admins
for each row execute function public.touch_updated_at();

alter table public.app_admins enable row level security;

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.app_admins administrator
    where administrator.user_id = (select auth.uid())
      and administrator.active
  );
$$;

revoke all on function public.is_app_admin() from public, anon;
grant execute on function public.is_app_admin() to authenticated;

drop policy if exists app_admins_select_self on public.app_admins;
create policy app_admins_select_self on public.app_admins
for select to authenticated
using (user_id = (select auth.uid()) and active);

drop policy if exists organizations_select_admin on public.organizations;
create policy organizations_select_admin on public.organizations
for select to authenticated
using ((select public.is_app_admin()));

drop policy if exists subscriptions_select_admin on public.subscriptions;
create policy subscriptions_select_admin on public.subscriptions
for select to authenticated
using ((select public.is_app_admin()));

drop policy if exists backup_devices_select_admin on public.backup_devices;
create policy backup_devices_select_admin on public.backup_devices
for select to authenticated
using ((select public.is_app_admin()));

drop policy if exists alerts_select_admin on public.alerts;
create policy alerts_select_admin on public.alerts
for select to authenticated
using ((select public.is_app_admin()));

drop policy if exists support_requests_select_admin on public.support_requests;
create policy support_requests_select_admin on public.support_requests
for select to authenticated
using ((select public.is_app_admin()));

drop policy if exists invoices_select_admin on public.invoices;
create policy invoices_select_admin on public.invoices
for select to authenticated
using ((select public.is_app_admin()));

drop policy if exists invoices_storage_select_admin on storage.objects;
create policy invoices_storage_select_admin on storage.objects
for select to authenticated
using (bucket_id = 'invoices' and (select public.is_app_admin()));

revoke all on public.app_admins from anon, authenticated;
grant select on public.app_admins to authenticated;
grant select on public.backup_devices to authenticated;

-- Le premier administrateur est le compte professionnel déjà présent.
insert into public.app_admins (user_id, role)
select id, 'owner'
from auth.users
where lower(email) = lower('contact@alliancia-solutions.fr')
on conflict (user_id) do update
set role = excluded.role,
    active = true;
