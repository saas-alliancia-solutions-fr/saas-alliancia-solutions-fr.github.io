-- Permet à un membre de marquer comme lues uniquement les alertes ouvertes
-- des organisations auxquelles il appartient. Le contenu et la résolution
-- restent sous le contrôle d'Alliancia et de la synchronisation Kiwi.

create or replace function public.acknowledge_client_alerts(target_alert_id bigint default null)
returns bigint[]
language sql
security definer
set search_path = ''
as $$
  with acknowledged as (
    update public.alerts alert
    set status = 'acknowledged'
    where alert.status = 'open'
      and (target_alert_id is null or alert.id = target_alert_id)
      and (select public.is_org_member(alert.organization_id))
    returning alert.id
  )
  select coalesce(array_agg(id), '{}'::bigint[])
  from acknowledged;
$$;

revoke all on function public.acknowledge_client_alerts(bigint) from public;
grant execute on function public.acknowledge_client_alerts(bigint) to authenticated;
