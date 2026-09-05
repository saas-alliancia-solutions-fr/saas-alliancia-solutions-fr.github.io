# SAAS — Alliancia Solutions

Site vitrine du **Service d’Archivage Automatique Sécurisé**, publié sur GitHub Pages à l’adresse `https://saas.alliancia-solutions.fr`.

## Aperçu local

```bash
python3 -m http.server 8080
```

Puis ouvrir `http://localhost:8080`.

## Réservation Zoom

Une fois la page Zoom Scheduler créée, remplacer `bookingUrl` dans `config.js` par son URL publique.

## Portail client

Le portail privé est disponible sur `/connexion.html` et s’appuie sur Supabase Auth, Postgres et Storage. Le schéma versionné se trouve dans `supabase/schema.sql`.

- Les inscriptions publiques sont désactivées : les comptes sont créés sur invitation depuis Supabase.
- Chaque utilisateur doit être rattaché à une ligne de `organization_members`.
- Les données sont isolées par entreprise grâce aux politiques Row Level Security.
- Les factures sont déposées dans le bucket privé `invoices`, sous la forme `<organization_id>/<fichier.pdf>`.
- Seule la clé publique Supabase est présente dans `config.js`. Ne jamais y ajouter de clé secrète ou `service_role`.

### Synchronisation Kiwi Backup

La fonction serveur `supabase/functions/sync-kiwi` synchronise les contrats rattachés, les machines, l’état des sauvegardes, les alertes et le relevé quotidien de stockage. Les correspondances client ↔ contrat sont conservées dans `kiwi_contract_links` et ne sont jamais exposées au navigateur.

Secrets à enregistrer dans **Supabase → Edge Functions → Secrets** :

- `KIWI_API_TOKEN` : jeton personnel Kiwi ;
- `KIWI_API_BASE_URL` : `https://admin5.sante.kiwi-backup.com` ;
- `KIWI_SYNC_SECRET` : valeur aléatoire utilisée uniquement par la tâche planifiée.

La fonction doit être appelée en `POST` avec `x-sync-secret: <KIWI_SYNC_SECRET>`. La planification recommandée est toutes les 15 minutes via Supabase Cron. Les clés et informations nominatives ne doivent jamais être ajoutées au dépôt public.

## Publication

La branche `main` est déployée automatiquement par `.github/workflows/pages.yml`. Le fichier `CNAME` configure le domaine personnalisé.
