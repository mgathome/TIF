# Déployer TIF en production

Guide pas-à-pas pour mettre TIF en ligne, accessible 24/7.

**Stack ciblée** :
- **Vercel** — Frontend Next.js (gratuit à vie)
- **Railway** — Backend Express (~5€/mois, always-on)
- **Neon** — Base PostgreSQL (gratuit, persistant)
- **Stripe** — Paiements (déjà configuré en test)

**Temps total : ~30 minutes pour la première fois.**

---

## Étape 0 — Créer un compte GitHub et y pousser le code

Vercel et Railway déploient depuis un repo Git. Si vous n'avez pas encore de compte GitHub :

1. Créez un compte sur [github.com](https://github.com) (gratuit)
2. Créez un nouveau repo nommé `tif` (privé recommandé) — **ne cochez aucune option** d'initialisation
3. Sur votre PC, ouvrez PowerShell dans le dossier `TIF` et collez (en remplaçant `VOTREUSER`) :

   ```
   cd "C:\Users\gweno\Documents\MG AT HOME\Claude Workspace\TYF\TIF"
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/VOTREUSER/tif.git
   git push -u origin main
   ```

   Si Git n'est pas installé : [git-scm.com](https://git-scm.com/download/win).

---

## Étape 1 — Base de données Neon (3 min)

1. Allez sur [neon.tech](https://neon.tech) et cliquez **Sign up** (avec GitHub, c'est plus rapide)
2. Créez un projet, nommez-le `tif`. Région : **Europe (Frankfurt)** pour la latence
3. Copiez la **Connection string** affichée (elle ressemble à `postgres://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`)
4. **Gardez-la de côté** — vous en aurez besoin à l'étape suivante

> 💾 Le tier gratuit Neon est largement suffisant pour démarrer (0,5 Go, jusqu'à 100 connexions actives).

---

## Étape 2 — Backend sur Railway (10 min)

1. Allez sur [railway.app](https://railway.app) → **Login with GitHub**
2. Cliquez **New Project** → **Deploy from GitHub repo** → sélectionnez votre repo `tif`
3. Railway détecte plusieurs dossiers. Cliquez sur le service créé, puis **Settings** :
   - **Root Directory** : `backend`
   - **Build** : laissez Railway détecter le `Dockerfile`
4. Allez dans **Variables** et ajoutez (cliquez Raw Editor pour coller en bloc) :

   ```
   NODE_ENV=production
   DATABASE_URL=postgres://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   JWT_ACCESS_SECRET=COLLEZ_64_CARS_ALÉATOIRES_ICI
   JWT_REFRESH_SECRET=COLLEZ_64_AUTRES_CARS_ALÉATOIRES_ICI
   JWT_ACCESS_TTL=15m
   JWT_REFRESH_TTL=7d
   STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_TEST
   STRIPE_WEBHOOK_SECRET=whsec_TEMPORAIRE_ON_LE_REMPLACERA
   FRONTEND_URL=https://placeholder.vercel.app
   ```

   **Pour générer les secrets JWT** : ouvrez [generate-secret.vercel.app/64](https://generate-secret.vercel.app/64) et cliquez Refresh deux fois pour avoir deux secrets différents.

5. Cliquez **Deploy**. Au premier build, Railway construit l'image Docker (~3 min). Suivez les logs : à la fin vous devez voir `[migrate] done` puis `[tif] API listening on port 4000`.

6. Allez dans **Settings → Networking → Generate Domain**. Vous obtenez une URL du type `https://tif-production-xxxx.up.railway.app`. **Copiez-la**.

7. Testez : ouvrez `https://VOTRE-URL.up.railway.app/health` dans votre navigateur — vous devez voir `{"status":"ok","env":"production"}`.

---

## Étape 3 — Frontend sur Vercel (5 min)

1. Allez sur [vercel.com](https://vercel.com) → **Sign up with GitHub**
2. Cliquez **Add New** → **Project** → sélectionnez votre repo `tif`
3. Configurez :
   - **Root Directory** : cliquez Edit, choisissez `frontend`
   - **Framework Preset** : Next.js (détecté automatiquement)
4. **Environment Variables** :

   ```
   NEXT_PUBLIC_API_URL=https://VOTRE-URL-RAILWAY.up.railway.app/api
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_PUBLIQUE
   ```

5. Cliquez **Deploy**. Vercel build (~2 min). Vous obtenez une URL du type `https://tif-xxxx.vercel.app`. **Copiez-la**.

6. **Retournez sur Railway** → service backend → Variables → modifiez :

   ```
   FRONTEND_URL=https://tif-xxxx.vercel.app
   ```

   Puis Redeploy (Railway le propose automatiquement).

---

## Étape 4 — Webhook Stripe permanent (3 min)

En production, on n'utilise plus Stripe CLI : on déclare un endpoint permanent.

1. Allez sur [dashboard.stripe.com/test/webhooks](https://dashboard.stripe.com/test/webhooks) → **Add endpoint**
2. **Endpoint URL** : `https://VOTRE-URL-RAILWAY.up.railway.app/api/payments/webhook`
3. **Events to send** : sélectionnez :
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. **Add endpoint**. Sur la page de l'endpoint, cliquez **Reveal signing secret** (`whsec_...`). Copiez-le.
5. **Retournez sur Railway** → Variables → remplacez `STRIPE_WEBHOOK_SECRET` par cette nouvelle valeur. Redeploy.

---

## Étape 5 — Vérification end-to-end (5 min)

1. Ouvrez `https://VOTRE-URL.vercel.app`
2. **Inscription** en tant que `restaurant` → vous arrivez sur le dashboard
3. **Setup** : créez votre restaurant (Setup auto si pas de resto encore)
4. Ajoutez un plat dans **Menu**
5. Cochez **Visible par les clients** dans **Paramètres** → Save
6. Ouvrez un autre navigateur (ou navigation privée), inscrivez-vous comme `client`
7. Trouvez votre restaurant, ajoutez un plat, payez avec **`4242 4242 4242 4242`** + n'importe quelle date future et CVC
8. Le compte resto reçoit la commande dans le kanban → faites les transitions

Si tout fonctionne : **félicitations, TIF tourne en prod 24/7** 🎉

---

## Mises à jour du code

Une fois tout en place, déployer une nouvelle version est trivial :

```
git add .
git commit -m "Description"
git push
```

Vercel et Railway redéploient automatiquement à chaque push sur `main`. Les migrations DB s'appliquent toutes seules grâce à `npm run release` dans le Dockerfile.

---

## Coûts mensuels

| Service | Tier | Coût |
|---------|------|------|
| Vercel Hobby | Frontend | **0 €** |
| Neon Free | DB jusqu'à 0,5 Go | **0 €** |
| Railway Hobby | Backend always-on | **~5 €** |
| Stripe | Frais transaction (1,4 % + 0,25 €) | facturés à l'usage |

**Total fixe : ~5 €/mois** pour démarrer. Quand vous aurez plus de trafic, vous pourrez upgrader (Neon Pro 19 €/mo, Railway Pro à l'usage).

---

## Sécurité — checklist déjà couverte

- [x] HTTPS forcé (Vercel + Railway donnent un cert SSL valide)
- [x] HSTS activé en production (1 an)
- [x] Cookies httpOnly + Secure + SameSite=None
- [x] CORS strict sur `FRONTEND_URL` uniquement
- [x] Rate limit sur `/api/auth/*` (30 req / 15 min)
- [x] Bcrypt 12 rounds pour les mots de passe
- [x] JWT access (15 min) + refresh rotatif (7 j) en cookie httpOnly
- [x] Validation zod de toutes les entrées
- [x] Requêtes SQL paramétrées (anti-injection)
- [x] Webhooks Stripe vérifiés par signature
- [x] Secrets jamais loggés ni renvoyés au client
- [x] Helmet : `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`

## Sécurité — à faire dans 1-2 mois (V1.5)

- [ ] **Sentry** pour le monitoring d'erreurs (free tier)
- [ ] **Sauvegardes DB** : Neon fait déjà des PITR snapshots automatiques (free 7 jours, pro 30 jours)
- [ ] **Cloudflare** devant le frontend pour DDoS protection (free)
- [ ] **2FA** sur les comptes restaurants (TOTP)
- [ ] **Audit logs** des actions sensibles (changement de prix, etc.)
- [ ] **Rotation des secrets JWT** tous les 6 mois

---

## Domaine personnalisé (optionnel, plus tard)

Si vous achetez `tif.app` ou `taketheirfood.com` :

1. Vercel : Settings → Domains → Add → suivez les instructions DNS
2. Railway : Settings → Networking → Custom Domain → ajoutez `api.tif.app`
3. Mettez à jour `FRONTEND_URL` (Railway) et `NEXT_PUBLIC_API_URL` (Vercel) avec les nouveaux domaines

---

## Que faire si quelque chose plante

| Symptôme | Solution |
|----------|----------|
| **502 Bad Gateway sur Railway** | Vérifiez les logs Railway. Souvent : `DATABASE_URL` invalide ou JWT secret manquant |
| **CORS error dans Chrome** | `FRONTEND_URL` (backend) ne correspond pas à l'URL Vercel |
| **Cookie pas envoyé** | Sur Chrome, vérifiez en DevTools → Application → Cookies que `Secure: true, SameSite: None` |
| **Webhook Stripe ne marche pas** | Stripe Dashboard → Webhooks → cliquez sur l'endpoint → onglet **Events** : voyez si Stripe a bien envoyé et si la réponse est 2xx |
| **Build Vercel échoue** | TypeScript strict : faites `cd frontend && npm run build` en local pour reproduire |
| **Migration DB échoue** | Logs Railway → cherchez `[migrate]` ; si la table existe déjà, supprimez-la dans Neon SQL Editor |

En cas de doute, dites-moi exactement le message d'erreur et le service concerné — je vous débloque.
