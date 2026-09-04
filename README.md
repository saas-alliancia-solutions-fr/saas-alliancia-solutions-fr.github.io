# SAAS — Alliancia Solutions

Site vitrine du **Service d’Archivage Automatique Sécurisé**, publié sur GitHub Pages à l’adresse `https://saas.alliancia-solutions.fr`.

## Aperçu local

```bash
python3 -m http.server 8080
```

Puis ouvrir `http://localhost:8080`.

## Réservation Zoom

Une fois la page Zoom Scheduler créée, remplacer `bookingUrl` dans `config.js` par son URL publique.

## Publication

La branche `main` est déployée automatiquement par `.github/workflows/pages.yml`. Le fichier `CNAME` configure le domaine personnalisé.
