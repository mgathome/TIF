# Configurer Cloudinary pour les uploads d'images

TIF utilise Cloudinary pour stocker les photos (logos restaurants, plats, etc.).
Tier gratuit : 25 Go de stockage et 25 Go de bande passante par mois — largement suffisant pour démarrer.

## 1. Créer le compte (2 minutes)

1. Allez sur 👉 [cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Inscrivez-vous (avec votre compte Google ou GitHub, c'est plus rapide)
3. À la première connexion, Cloudinary vous demande votre **Cloud Name** — choisissez par exemple `tif-app` (sera dans l'URL des images : `https://res.cloudinary.com/tif-app/...`). Vous pouvez aussi laisser celui généré automatiquement.

## 2. Créer un "upload preset" non-signé (1 minute)

L'upload preset permet à votre frontend d'uploader des images directement vers Cloudinary, sans backend.

1. Dans le dashboard Cloudinary, cliquez en haut à droite sur l'**icône engrenage** (⚙️ Settings)
2. Onglet **"Upload"** dans le menu de gauche
3. Faites défiler jusqu'à la section **"Upload presets"**
4. Cliquez **"Add upload preset"**
5. Configurez :
   - **Preset name** : `tif-uploads` (ou ce que vous voulez, à noter)
   - **Signing Mode** : sélectionnez **"Unsigned"** (très important — sinon ça ne marchera pas depuis le navigateur)
   - **Folder** : laissez vide (le code définit le dossier dynamiquement)
   - **Use filename or externally defined Public ID** : laissez par défaut
6. Onglet **"Restrictions"** (optionnel mais recommandé) :
   - **Allowed formats** : `jpg, png, webp` (pour bloquer les uploads bizarres)
   - **Max file size** : `5000000` (5 Mo, déjà la limite côté frontend aussi)
7. Cliquez **"Save"** en haut

## 3. Récupérer les 2 valeurs

Vous avez besoin de :

- **Cloud Name** : visible dans le coin haut-gauche du dashboard, ou dans Settings → API Keys → "Cloud Name"
- **Upload Preset Name** : celui que vous venez de créer (ex. `tif-uploads`)

## 4. Ajouter sur Vercel

1. Allez sur 👉 [vercel.com](https://vercel.com) → votre projet `tif`
2. **Settings** → **Environment Variables**
3. Ajoutez deux nouvelles variables :

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | votre Cloud Name (ex. `tif-app`) |
   | `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | votre Upload Preset (ex. `tif-uploads`) |

   ⚠️ Le préfixe `NEXT_PUBLIC_` est important — il rend la variable accessible côté navigateur (sinon le client ne peut pas l'utiliser).

4. Cliquez **Save**.
5. Redéployez le frontend : **Deployments** → cliquez sur le dernier déploiement → **⋯** → **Redeploy**.

## 5. Tester

1. Connectez-vous comme restaurateur sur votre app
2. Allez dans **Paramètres** ou ajoutez un nouveau plat dans **Menu**
3. Vous devriez voir une zone d'upload (📷 "Cliquez ou glissez une image")
4. Choisissez une photo, elle s'uploade en quelques secondes et le preview s'affiche
5. Sauvegardez — l'image apparaît partout (page resto, menu client, etc.)

## Troubleshooting

| Symptôme | Cause | Solution |
|----------|-------|----------|
| ⚠ "Upload d'images non configuré" sur la page | Variables d'env manquantes ou pas de redéploiement | Vérifiez Settings Vercel + Redeploy |
| Upload échoue avec "Upload preset not found" | Le nom du preset ne correspond pas, ou il n'est pas en `Unsigned` | Vérifiez sur Cloudinary, regénérez avec mode Unsigned |
| Image visible côté restaurateur mais pas côté client | Cache du navigateur | Ctrl+F5, ou attendez quelques secondes |
| L'image ne s'affiche pas du tout | Domaine Cloudinary pas autorisé dans Next.js | Le `next.config.mjs` autorise déjà tous les domaines HTTPS |

## Sécurité

- L'upload preset est **public** (visible dans le code frontend) — c'est normal pour les presets unsigned, c'est ce que Cloudinary appelle "client-side upload"
- Pour une utilisation en production avancée, vous pouvez activer dans le preset :
  - **Auto-moderation** : détection automatique de contenu inapproprié
  - **Webhook URL** : notification quand un upload arrive
  - **Allowed referrers** : limiter les uploads à votre domaine `tif-theta.vercel.app`

## Coût

- Tier gratuit : 25 GB stockage + 25 GB bande passante / mois
- Au-delà : 89 € / mois pour la formule Plus (probablement utile à partir de 100+ restaurants actifs)
