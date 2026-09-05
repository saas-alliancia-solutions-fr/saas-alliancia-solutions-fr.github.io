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

## Publication

La branche `main` est déployée automatiquement par `.github/workflows/pages.yml`. Le fichier `CNAME` configure le domaine personnalisé.
