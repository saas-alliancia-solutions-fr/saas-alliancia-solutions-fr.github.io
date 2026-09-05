-- Synchronisation sécurisée Kiwi Backup -> portail client SAAS.
-- Les identifiants client et secrets sont configurés uniquement dans Supabase.

create table if not exists public.kiwi_contract_links (
  organization_id bigint primary key references public.organizations(id) on delete cascade,
  kiwi_contract_id text not null unique check (char_length(kiwi_contract_id) between 8 and 100),
  enabled boolean not null default true,
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.backup_devices (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  kiwi_machine_id text not null unique check (char_length(kiwi_machine_id) between 8 and 100),
  name text not null check (char_length(name) between 1 and 180),
  device_type text,
  client_version text,
  source_bytes bigint not null default 0 check (source_bytes >= 0),
  stored_bytes bigint not null default 0 check (stored_bytes >= 0),
  source_count bigint not null default 0 check (source_count >= 0),
  last_backup_at timestamptz,
  backup_alert boolean not null default false,
  missing_backup_alert boolean not null default false,
  backup_running boolean not null default false,
  active boolean not null default true,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists backup_devices_organization_backup_idx
  on public.backup_devices(organization_id, last_backup_at desc);

alter table public.alerts add column if not exists external_id text;
alter table public.alerts add column if not exists metadata jsonb not null default '{}'::jsonb;
create unique index if not exists alerts_source_external_id_idx
  on public.alerts(source, external_id);

drop trigger if exists kiwi_contract_links_touch_updated_at on public.kiwi_contract_links;
create trigger kiwi_contract_links_touch_updated_at
before update on public.kiwi_contract_links
for each row execute function public.touch_updated_at();

drop trigger if exists backup_devices_touch_updated_at on public.backup_devices;
create trigger backup_devices_touch_updated_at
before update on public.backup_devices
for each row execute function public.touch_updated_at();

alter table public.kiwi_contract_links enable row level security;
alter table public.backup_devices enable row level security;

drop policy if exists backup_devices_select_member on public.backup_devices;
create policy backup_devices_select_member on public.backup_devices
for select to authenticated
using ((select public.is_org_member(organization_id)));

revoke all on public.kiwi_contract_links from anon, authenticated;
revoke all on public.backup_devices from anon, authenticated;
grant select on public.backup_devices to authenticated;
