# Lancer TIF en local

Guide pas-à-pas pour tourner le projet en dev.

## Prérequis

- Node.js >= 18
- PostgreSQL >= 14
- Un compte Stripe (clés de test : https://dashboard.stripe.com/test/apikeys)
- Stripe CLI pour les webhooks en dev : https://stripe.com/docs/stripe-cli

## 1. Base de données

```bash
# Créer la base
createdb tif

# Charger le schéma
psql tif < backend/migrations/001_initial_schema.sql

# (optionnel) Charger des données de démo
psql tif < backend/migrations/002_seed.sql
```

Comptes seed :
- Client : `client@tif.test` / `password123`
- Restaurant : `resto@tif.test` / `password123`

## 2. Backend (port 4000)

```bash
cd backend
cp .env.example .env
# Édite .env :
#  - DATABASE_URL=postgres://USER:PASS@localhost:5432/tif
#  - JWT_ACCESS_SECRET et JWT_REFRESH_SECRET (génère avec: openssl rand -hex 32)
#  - STRIPE_SECRET_KEY=sk_test_...
#  - STRIPE_WEBHOOK_SECRET (voir étape 4)

npm install
npm run dev
```

Vérifie : http://localhost:4000/health → `{"status":"ok"}`

## 3. Frontend (port 3000)

```bash
cd frontend
cp .env.local.example .env.local
# Édite .env.local :
#  - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

npm install
npm run dev
```

Ouvre : http://localhost:3000

## 4. Webhook Stripe (paiements)

Dans un troisième terminal :

```bash
stripe login
stripe listen --forward-to localhost:4000/api/payments/webhook
```

La CLI te donne un `webhook signing secret` (commence par `whsec_...`) — colle-le dans `backend/.env` à la clé `STRIPE_WEBHOOK_SECRET` puis redémarre le backend.

Tester avec une carte de test : `4242 4242 4242 4242`, n'importe quelle date future, n'importe quel CVC.

## 5. Vérification end-to-end

1. Va sur http://localhost:3000
2. `S'inscrire` en tant que client
3. Choisis un restaurant, ajoute un plat, va au panier
4. Checkout → choisis le créneau → paye avec `4242 4242 4242 4242`
5. La commande passe en `paid` (visible côté restaurateur)
6. Connecte-toi avec un compte restaurant : http://localhost:3000/dashboard
7. Onglet Commandes : déclenche les transitions paid → preparing → ready → completed

## Variables d'env — référence

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | 4000 par défaut |
| `DATABASE_URL` | postgres://user:pass@host:port/db |
| `FRONTEND_URL` | URL du frontend (CORS) |
| `JWT_ACCESS_SECRET` | secret pour les access tokens (15min) |
| `JWT_REFRESH_SECRET` | secret pour les refresh tokens (7j) |
| `STRIPE_SECRET_KEY` | clé secrète Stripe (sk_test_...) |
| `STRIPE_WEBHOOK_SECRET` | secret du webhook (whsec_...) |
| `COOKIE_SECURE` | `true` en prod (HTTPS) |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | URL de l'API (par défaut http://localhost:4000/api) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | clé publique Stripe (pk_test_...) |

## Troubleshooting

**`psql: command not found`** → Installe PostgreSQL : https://www.postgresql.org/download/

**Le backend crash au démarrage** → Vérifie que `JWT_ACCESS_SECRET` et `DATABASE_URL` sont bien dans `.env` (le serveur fail-fast s'ils manquent).

**CORS error dans la console** → Vérifie que `FRONTEND_URL` du backend correspond à l'URL où tourne Next.js.

**Le webhook ne reçoit rien** → Stripe CLI doit tourner en parallèle. Sans elle, le statut `paid` ne sera pas mis à jour automatiquement.

**Le panier disparaît au refresh** → Normal en dev : on stocke en `localStorage`. Si tu as des erreurs, vide le storage.

## Architecture

Voir [ARCHITECTURE.md](./ARCHITECTURE.md) pour les détails (flux de paiement, sécurité, modèle de données).

## Déploiement

À titre indicatif (à valider en V2) :
- **Frontend** : Vercel (zéro-config Next.js)
- **Backend** : Railway, Fly.io ou Render
- **DB** : Neon, Supabase, ou Railway Postgres
- **Webhook** : configurer une URL publique stable et créer un endpoint Stripe permanent (au lieu de la CLI)
