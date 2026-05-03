# API REST — Référence

Base : `http://localhost:4000/api`

Toutes les routes protégées attendent : `Authorization: Bearer <accessToken>`

## Auth

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/auth/register` | — | Crée un compte (`role`: `client` ou `restaurant`) |
| POST | `/auth/login` | — | Login email/password |
| POST | `/auth/refresh` | cookie | Rafraîchit l'access token |
| POST | `/auth/logout` | — | Invalide le refresh token |
| GET  | `/auth/me` | ✅ | Récupère l'utilisateur courant |

## Restaurants

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/restaurants` | — | Liste publique (filtres `?city=&cuisine=&q=&limit=&offset=`) |
| GET | `/restaurants/:slug` | — | Détail public (par slug) |
| GET | `/restaurants/me` | restaurant | Mon restaurant (owner) |
| POST | `/restaurants` | restaurant | Créer son restaurant |
| PATCH | `/restaurants/:id` | restaurant/admin | Modifier |
| GET | `/restaurants/:id/stats` | restaurant/admin | Stats dashboard |

## Menu

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/menu/restaurant/:restaurantId` | — | Plats publics dispos |
| GET | `/menu/restaurant/:restaurantId/all` | restaurant | Tous (incluant indispos) |
| POST | `/menu/restaurant/:restaurantId` | restaurant | Créer un plat |
| PATCH | `/menu/:itemId` | restaurant | Modifier |
| DELETE | `/menu/:itemId` | restaurant | Désactiver (soft) |

## Orders

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/orders` | client | Créer une commande + PaymentIntent Stripe |
| GET | `/orders/me` | ✅ | Mes commandes (client) |
| GET | `/orders/restaurant/:restaurantId` | restaurant | Commandes du restaurant |
| GET | `/orders/:id` | ✅ | Détail (client owner OU resto owner) |
| PATCH | `/orders/:id/status` | restaurant | Transition de statut |

Transitions autorisées : `paid → preparing → ready → completed`. `cancelled` depuis `paid` ou `preparing`.

## Payments

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/payments/order/:orderId` | ✅ | Statut du paiement |
| POST | `/payments/webhook` | Stripe sig | Webhook (raw body) — usage interne |

## Codes erreur

| Code | Cas |
|------|-----|
| 400 | Validation zod failed (voir `details`) |
| 401 | Token manquant/invalide/expiré |
| 403 | Rôle insuffisant ou ressource d'un autre utilisateur |
| 404 | Ressource introuvable |
| 409 | Conflit (email déjà pris, transition impossible) |
| 500 | Erreur serveur |

## Exemple : créer une commande

```bash
curl -X POST http://localhost:4000/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": "33333333-3333-3333-3333-333333333333",
    "type": "pickup",
    "scheduledFor": "2026-05-04T19:30:00.000Z",
    "items": [
      { "menuItemId": "<UUID>", "quantity": 2 }
    ],
    "promoCode": "BIENVENUE10"
  }'
```

Réponse :
```json
{
  "order": { "id": "...", "orderNumber": "TIF-2026-001234", "totalCents": 2322, ... },
  "payment": { "clientSecret": "pi_xxx_secret_yyy", "paymentIntentId": "pi_xxx" }
}
```

Le frontend utilise `clientSecret` pour confirmer le paiement avec Stripe Elements.
