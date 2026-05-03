# --- Backend Dockerfile (utilisé par Railway, Render, Fly...) ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copie les deps + le code
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Healthcheck (Railway le détecte aussi via /health)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+(process.env.PORT||4000)+'/health', r => process.exit(r.statusCode===200?0:1)).on('error', () => process.exit(1))"

EXPOSE 4000

# Au lancement : applique les migrations puis démarre le serveur
CMD ["npm", "run", "release"]
