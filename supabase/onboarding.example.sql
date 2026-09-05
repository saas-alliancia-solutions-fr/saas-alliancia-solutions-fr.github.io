-- Modèle à exécuter dans Supabase avec des valeurs privées.
-- Ne jamais renseigner ni publier ce fichier dans le dépôt.

begin;

insert into public.organizations (name, slug)
values ('NOM_ENTREPRISE', 'slug-entreprise')
on conflict (slug) do update set name = excluded.name;

insert into public.kiwi_contract_links (organization_id, kiwi_contract_id)
select id, 'IDENTIFIANT_CONTRAT_KIWI'
from public.organizations
where slug = 'slug-entreprise'
on conflict (organization_id) do update
set kiwi_contract_id = excluded.kiwi_contract_id,
    enabled = true;

-- Après invitation du client dans Authentication > Users, remplacer UUID_UTILISATEUR.
insert into public.profiles (user_id, full_name)
values ('UUID_UTILISATEUR', 'NOM_CONTACT')
on conflict (user_id) do update set full_name = excluded.full_name;

insert into public.organization_members (organization_id, user_id, role)
select id, 'UUID_UTILISATEUR', 'owner'
from public.organizations
where slug = 'slug-entreprise'
on conflict (organization_id, user_id) do update set role = excluded.role;

commit;

