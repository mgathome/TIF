# Architecture TIF

## Vue d'ensemble

```
┌─────────────────┐         ┌─────────────────┐         ┌──────────────┐
│   Next.js App   │ ──HTTP──▶│  Express API    │ ──SQL──▶│  PostgreSQL  │
│  (port 3000)    │  JWT     │  (port 4000)    │         │              │
└─────────────────┘          └────────┬────────┘         └──────────────┘
                                      │
                                      ▼
                              ┌──────────────┐
                              │    Stripe    │
                              │ (paiements)  │
                              └──────────────┘
```

## Choix techniques

### Pourquoi Next.js (App Router)
SSR pour le SEO restaurants, routing fichier-based, optimisation images, et compatibilité Vercel pour déploiement zéro-config.

### Pourquoi Express plutôt que Next API routes
Séparer le frontend du backend permet :
- de scaler indépendamment
- d'exposer la même API à une future app mobile (React Native)
- d'avoir une architecture claire pour les évolutions (microservices possibles)

### Pourquoi JWT plutôt que sessions
Stateless, scalable, et adapté à un futur découpage en services. Token court (15 min) + refresh token long (7 jours) en cookie httpOnly.

### Pourquoi PostgreSQL
Relations propres (orders ↔ order_items ↔ menu_items), transactions ACID indispensables pour les paiements, et `JSONB` disponible si besoin de flexibilité.

## Flux clés

### Création d'une commande

```
Client                Frontend             Backend              Stripe
  │                      │                    │                   │
  │── ajoute panier ────▶│                    │                   │
  │── checkout ─────────▶│                    │                   │
  │                      │── POST /orders ───▶│                   │
  │                      │                    │── INSERT order ──▶│
  │                      │                    │   (status=pending)│
  │                      │                    │── PaymentIntent ─▶│
  │                      │◀── client_secret ──│◀──────────────────│
  │◀── Stripe Elements ──│                    │                   │
  │── confirm payment ──────────────────────────────────────────▶│
  │                      │                    │◀── webhook ───────│
  │                      │                    │   (paid)          │
  │                      │                    │── UPDATE order ──▶│
  │                      │                    │   (status=paid)   │
  │◀── confirmation ─────│◀── poll /orders/id│                   │
```

### Authentification

1. POST `/auth/register` ou `/auth/login` → renvoie `{ accessToken, user }` + cookie `refreshToken` httpOnly
2. Toutes les requêtes protégées : header `Authorization: Bearer <accessToken>`
3. Si 401 expiré : POST `/auth/refresh` (utilise le cookie) → nouveau `accessToken`
4. POST `/auth/logout` : invalide le refresh côté DB + clear cookie

## Sécurité

- `bcrypt` 12 rounds pour les mots de passe
- `helmet` pour les headers HTTP
- `express-rate-limit` sur `/auth/*`
- Validation des inputs avec `zod`
- CORS strict (origine du frontend uniquement)
- Webhooks Stripe vérifiés avec signature
- Préparation : pas de SQL concaténé, uniquement des requêtes paramétrées (`pg`)
- RBAC via middleware `requireRole('restaurant')`

## Modèle de données

Voir `backend/migrations/001_initial_schema.sql` pour la source de vérité.

```
users ─┬─ (1,n) orders ─┬─ (1,n) order_items ─── (n,1) menu_items
       │                └─ (1,1) payments
       │
restaurants ─┬─ (1,n) menu_items
             ├─ (1,n) orders
             └─ (1,n) availability_slots
```

## Décisions à revisiter en V2

- **Cache Redis** pour les listes restaurants (actuellement DB direct)
- **Queue (Bull/BullMQ)** pour les notifications (actuellement synchrone)
- **CDN images** (actuellement URLs externes)
- **Recherche full-text** (actuellement `ILIKE`, passer à `tsvector` ou Meilisearch)
