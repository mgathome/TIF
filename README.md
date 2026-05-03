# TIF — Take Your Food

Plateforme de réservation et précommande de repas (modèle SaaS, sans commission).

## Vue d'ensemble

TIF permet aux clients de découvrir des restaurants, précommander des plats et choisir un créneau, et aux restaurants de gérer commandes/menus depuis un dashboard. Monétisation : abonnement mensuel (Starter 79€, Growth 149€, Pro 299€).

## Stack

- **Frontend** : Next.js 14 (App Router) + Tailwind CSS
- **Backend** : Node.js + Express
- **Database** : PostgreSQL
- **Auth** : JWT (rôles `client` / `restaurant`)
- **Paiement** : Stripe (PaymentIntents)

## Direction artistique

| Couleur | Hex | Usage |
|---------|-----|-------|
| Violet  | `#5B2EFF` | Fond navigation, accents primaires |
| Jaune   | `#FFD84D` | CTA, boutons d'action |
| Noir    | `#0F0F0F` | Texte principal |
| Blanc   | `#F8F8F8` | Fond, espaces |

Style mobile-first, minimaliste, beaucoup d'espace blanc, inspiré Uber Eats mais épuré.

## Structure du repo

```
TIF/
├── backend/             # API Express
│   ├── src/
│   │   ├── config/      # config DB, env
│   │   ├── controllers/ # logique métier
│   │   ├── middleware/  # auth, erreurs
│   │   ├── routes/      # endpoints REST
│   │   ├── services/    # Stripe, mail
│   │   └── server.js
│   └── migrations/      # SQL schema
├── frontend/            # App Next.js
│   └── src/
│       ├── app/         # pages (App Router)
│       ├── components/  # UI réutilisable
│       ├── contexts/    # auth, panier
│       └── lib/         # api client
└── docs/
```

## Démarrage rapide

- **Pour développer en local** : voir [`docs/SETUP.md`](./docs/SETUP.md)
- **Pour déployer en production (24/7)** : voir [`docs/DEPLOY.md`](./docs/DEPLOY.md)

### Dev local en 3 commandes

```bash
# 1. Base de données
createdb tif
psql tif < backend/migrations/001_initial_schema.sql

# 2. Backend
cd backend && cp .env.example .env && npm install && npm run dev

# 3. Frontend (autre terminal)
cd frontend && cp .env.local.example .env.local && npm install && npm run dev
```

Backend : http://localhost:4000  •  Frontend : http://localhost:3000

## Roadmap

- **V1 (MVP)** : ce repo. Réservation + précommande, paiement Stripe, dashboard restaurant.
- **V2** : module livreurs, notifications push, programme de fidélité.
