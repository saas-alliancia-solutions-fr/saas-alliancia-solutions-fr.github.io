-- Expérience portail : contrat, conversations et préférences de notification.

alter table public.subscriptions
  add column if not exists contract_number text;

update public.subscriptions subscription
set contract_number = contract.kiwi_contract_id
from public.kiwi_contract_links contract
where contract.organization_id = subscription.organization_id
  and subscription.contract_number is null;

create unique index if not exists subscriptions_contract_number_idx
  on public.subscriptions(contract_number)
  where contract_number is not null;

create table if not exists public.support_request_messages (
  id bigint generated always as identity primary key,
  request_id bigint not null references public.support_requests(id) on delete cascade,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  author_type text not null default 'client' check (author_type in ('client', 'support', 'system')),
  author_name text,
  body text not null check (char_length(body) between 2 and 10000),
  created_at timestamptz not null default now()
);

create index if not exists support_request_messages_request_created_idx
  on public.support_request_messages(request_id, created_at);

create table if not exists public.notification_preferences (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  backup_failure boolean not null default true,
  storage_threshold boolean not null default true,
  request_reply boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (user_id, organization_id)
);

drop trigger if exists notification_preferences_touch_updated_at on public.notification_preferences;
create trigger notification_preferences_touch_updated_at
before update on public.notification_preferences
for each row execute function public.touch_updated_at();

create or replace function public.touch_request_from_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.support_requests
  set updated_at = new.created_at
  where id = new.request_id and organization_id = new.organization_id;
  return new;
end;
$$;

drop trigger if exists support_request_messages_touch_request on public.support_request_messages;
create trigger support_request_messages_touch_request
after insert on public.support_request_messages
for each row execute function public.touch_request_from_message();

alter table public.support_request_messages enable row level security;
alter table public.notification_preferences enable row level security;

drop policy if exists support_request_messages_select_member on public.support_request_messages;
create policy support_request_messages_select_member
on public.support_request_messages for select to authenticated
using ((select public.is_org_member(organization_id)));

drop policy if exists support_request_messages_insert_client on public.support_request_messages;
create policy support_request_messages_insert_client
on public.support_request_messages for insert to authenticated
with check (
  author_id = (select auth.uid())
  and author_type = 'client'
  and (select public.is_org_member(organization_id))
  and exists (
    select 1 from public.support_requests request
    where request.id = support_request_messages.request_id
      and request.organization_id = support_request_messages.organization_id
      and request.status not in ('resolved', 'closed')
  )
);

drop policy if exists notification_preferences_select_self on public.notification_preferences;
create policy notification_preferences_select_self
on public.notification_preferences for select to authenticated
using (user_id = (select auth.uid()) and (select public.is_org_member(organization_id)));

drop policy if exists notification_preferences_insert_self on public.notification_preferences;
create policy notification_preferences_insert_self
on public.notification_preferences for insert to authenticated
with check (user_id = (select auth.uid()) and (select public.is_org_member(organization_id)));

drop policy if exists notification_preferences_update_self on public.notification_preferences;
create policy notification_preferences_update_self
on public.notification_preferences for update to authenticated
using (user_id = (select auth.uid()) and (select public.is_org_member(organization_id)))
with check (user_id = (select auth.uid()) and (select public.is_org_member(organization_id)));

revoke all on public.support_request_messages, public.notification_preferences from anon, authenticated;
grant select, insert on public.support_request_messages to authenticated;
grant select, insert, update (backup_failure, storage_threshold, request_reply) on public.notification_preferences to authenticated;
grant select, insert, update, delete on public.support_request_messages, public.notification_preferences to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
