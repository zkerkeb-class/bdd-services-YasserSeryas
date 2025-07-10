# Dockerfile pour l'API de Billetterie
FROM node:20-alpine AS base

# Installer les dépendances système nécessaires
RUN apk add --no-cache \
    tini \
    curl \
    bash

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration des dépendances
COPY package*.json ./

# Installer les dépendances de production
FROM base AS dependencies
RUN npm ci --only=production && npm cache clean --force

# Étape de développement
FROM base AS development
RUN npm ci && npm cache clean --force
COPY . .
RUN mkdir -p /app/logs && \
    chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Étape de production
FROM base AS production

# Copier les dépendances de production
COPY --from=dependencies /app/node_modules ./node_modules

# Copier le code source
COPY . .

# Créer le répertoire de logs et donner les permissions
RUN mkdir -p /app/logs && \
    chown -R nodejs:nodejs /app

# Changer vers l'utilisateur non-root
USER nodejs

# Exposer le port
EXPOSE 3000

# Variables d'environnement par défaut
ENV NODE_ENV=production \
    PORT=3000 \
    LOG_LEVEL=info

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Utiliser tini comme init system
ENTRYPOINT ["/sbin/tini", "--"]

# Commande par défaut
CMD ["node", "index.js"]
