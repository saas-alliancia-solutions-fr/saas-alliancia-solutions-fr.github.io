-- Portail client SAAS — schéma initial sécurisé pour Supabase/Postgres.
-- À exécuter une fois dans l’éditeur SQL du projet Supabase.

create table if not exists public.organizations (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 2 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id bigint not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member', 'billing')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index if not exists organization_members_user_id_idx on public.organization_members(user_id);

create table if not exists public.subscriptions (
  id bigint generated always as identity primary key,
  organization_id bigint not null unique references public.organizations(id) on delete cascade,
  plan_name text not null,
  storage_limit_bytes bigint not null default 0 check (storage_limit_bytes >= 0),
  storage_used_bytes bigint not null default 0 check (storage_used_bytes >= 0),
  retention_days integer not null default 365 check (retention_days > 0),
  status text not null default 'active' check (status in ('active', 'attention', 'suspended', 'ended')),
  last_backup_at timestamptz,
  renewal_at date,
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_organization_id_idx on public.subscriptions(organization_id);

create table if not exists public.support_requests (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  subject text not null check (char_length(subject) between 5 and 180),
  category text not null check (category in ('Assistance technique', 'Installation', 'Restauration', 'Facturation', 'Contrat', 'Autre')),
  priority text not null default 'normal' check (priority in ('normal', 'high', 'urgent')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  message text not null check (char_length(message) between 20 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_requests_organization_updated_idx on public.support_requests(organization_id, updated_at desc);
create index if not exists support_requests_created_by_idx on public.support_requests(created_by);

create table if not exists public.invoices (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  invoice_number text not null unique,
  issued_at date not null,
  due_at date,
  amount_cents integer not null check (amount_cents >= 0),
  status text not null default 'sent' check (status in ('draft', 'sent', 'paid', 'overdue')),
  file_path text,
  created_at timestamptz not null default now()
);

create index if not exists invoices_organization_issued_idx on public.invoices(organization_id, issued_at desc);

create table if not exists public.usage_daily (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  measured_on date not null,
  storage_bytes bigint not null default 0 check (storage_bytes >= 0),
  protected_devices integer not null default 0 check (protected_devices >= 0),
  successful_backups integer not null default 0 check (successful_backups >= 0),
  failed_backups integer not null default 0 check (failed_backups >= 0),
  unique (organization_id, measured_on)
);

create index if not exists usage_daily_organization_date_idx on public.usage_daily(organization_id, measured_on desc);

create table if not exists public.alerts (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  severity text not null check (severity in ('info', 'warning', 'critical')),
  title text not null check (char_length(title) between 3 and 220),
  message text,
  source text,
  status text not null default 'open' check (status in ('open', 'acknowledged', 'resolved')),
  occurred_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists alerts_organization_occurred_idx on public.alerts(organization_id, occurred_at desc);

create or replace function public.is_org_member(target_organization_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members membership
    where membership.organization_id = target_organization_id
      and membership.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_org_member(bigint) from public;
grant execute on function public.is_org_member(bigint) to authenticated;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles for each row execute function public.touch_updated_at();
drop trigger if exists subscriptions_touch_updated_at on public.subscriptions;
create trigger subscriptions_touch_updated_at before update on public.subscriptions for each row execute function public.touch_updated_at();
drop trigger if exists support_requests_touch_updated_at on public.support_requests;
create trigger support_requests_touch_updated_at before update on public.support_requests for each row execute function public.touch_updated_at();

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.subscriptions enable row level security;
alter table public.support_requests enable row level security;
alter table public.invoices enable row level security;
alter table public.usage_daily enable row level security;
alter table public.alerts enable row level security;

drop policy if exists organizations_select_member on public.organizations;
create policy organizations_select_member on public.organizations for select to authenticated using ((select public.is_org_member(id)));
drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists organization_members_select_self on public.organization_members;
create policy organization_members_select_self on public.organization_members for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists subscriptions_select_member on public.subscriptions;
create policy subscriptions_select_member on public.subscriptions for select to authenticated using ((select public.is_org_member(organization_id)));
drop policy if exists support_requests_select_member on public.support_requests;
create policy support_requests_select_member on public.support_requests for select to authenticated using ((select public.is_org_member(organization_id)));
drop policy if exists support_requests_insert_member on public.support_requests;
create policy support_requests_insert_member on public.support_requests for insert to authenticated with check ((select public.is_org_member(organization_id)) and created_by = (select auth.uid()));
drop policy if exists invoices_select_member on public.invoices;
create policy invoices_select_member on public.invoices for select to authenticated using ((select public.is_org_member(organization_id)));
drop policy if exists usage_daily_select_member on public.usage_daily;
create policy usage_daily_select_member on public.usage_daily for select to authenticated using ((select public.is_org_member(organization_id)));
drop policy if exists alerts_select_member on public.alerts;
create policy alerts_select_member on public.alerts for select to authenticated using ((select public.is_org_member(organization_id)));

revoke all on all tables in schema public from anon, authenticated;
grant select on public.organizations, public.profiles, public.organization_members, public.subscriptions, public.invoices, public.usage_daily, public.alerts to authenticated;
grant select, insert on public.support_requests to authenticated;
grant usage, select on all sequences in schema public to authenticated;

insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', false)
on conflict (id) do update set public = false;

drop policy if exists invoices_storage_select_member on storage.objects;
create policy invoices_storage_select_member on storage.objects
for select to authenticated
using (
  bucket_id = 'invoices'
  and exists (
    select 1 from public.organization_members membership
    where membership.user_id = (select auth.uid())
      and membership.organization_id::text = (storage.foldername(name))[1]
  )
);

-- Organisation de fichiers attendue dans le bucket privé :
-- invoices/<organization_id>/<nom-du-fichier.pdf>

-- La fonction créée par l’option « automatic RLS » reste réservée aux événements
-- internes de la base et ne doit pas être appelable depuis l’API.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
