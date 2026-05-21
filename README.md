# MediRoute Pro

Application web pour trouver les hopitaux proches, rechercher une ville ou une adresse, filtrer les etablissements et lancer un itineraire GPS.

## Fonctionnalites

- Recherche par position GPS du navigateur.
- Recherche par ville, quartier ou adresse.
- Recuperation des hopitaux et cliniques via OpenStreetMap / Overpass.
- Mode demonstration si les API publiques sont indisponibles.
- Calcul des distances, tri, filtres par type, urgence et ouverture 24/7.
- Liens GPS compatibles Google Maps.
- Export CSV des resultats.
- Interface responsive pour ordinateur, tablette et mobile.

## Utilisation

Ouvrir `index.html` dans un navigateur moderne. Pour une demo plus fiable avec geolocalisation, servir le dossier en local:

```bash
node server.js
```

Puis ouvrir `http://localhost:4173`.

## Notes produit

Cette version est prete pour une demo commerciale. Pour une vente entreprise, il est recommande d'ajouter un backend afin de:

- controler les quotas et la fiabilite des donnees cartographiques;
- stocker les etablissements valides par l'entreprise;
- gerer les comptes, les droits et les journaux d'audit;
- connecter un fournisseur de cartographie sous contrat si necessaire.
