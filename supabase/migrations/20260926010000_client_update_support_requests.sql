-- Autorise les membres d'une organisation à modifier le contenu d'une demande,
-- sans leur permettre de changer le statut, l'auteur ou l'organisation.

drop policy if exists support_requests_update_member on public.support_requests;
create policy support_requests_update_member on public.support_requests
for update to authenticated
using ((select public.is_org_member(organization_id)) and status not in ('resolved', 'closed'))
with check ((select public.is_org_member(organization_id)));

grant update (subject, category, priority, message)
on public.support_requests
to authenticated;
