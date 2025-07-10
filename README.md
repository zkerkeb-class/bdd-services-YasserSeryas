# 🎫 Service BDD - Billetterie en Ligne

Service de base de données pour une application de gestion de réservation et de billetterie en ligne.

## 🚀 Fonctionnalités

- **Gestion des utilisateurs** : Authentification, profils, rôles
- **Gestion des événements** : Création, modification, catégorisation
- **Système de billetterie** : Types de billets, prix, disponibilité
- **Réservations** : Création, annulation, gestion des statuts
- **Paiements** : Traitement, remboursements, méthodes multiples
- **Notifications** : Email, SMS, notifications push
- **Rate Limiting** : Protection contre les abus avec Redis
- **Monitoring** : Surveillance Redis et performance

## 📁 Structure du projet

```
├── config/              # Configuration (Redis, etc.)
├── controllers/          # Logique métier
├── middlewares/          # Middlewares Express
├── models/              # Modèles Mongoose
├── routes/              # Routes API
├── utils/               # Utilitaires
├── validations/         # Schémas de validation Joi
└── index.js            # Point d'entrée
```

## 🛠️ Installation

1. Cloner le repository
```bash
git clone [URL_DU_REPO]
cd bdd-services-YasserSeryas
```

2. Installer les dépendances
```bash
npm install
```

3. Configurer les variables d'environnement
```bash
cp .env.example .env
# Éditer le fichier .env avec vos configurations
```

4. Démarrer le serveur
```bash
npm run dev
```

## 🚀 Démarrage avec Docker (optionnel)

Si vous voulez utiliser Redis avec Docker :

```bash
# Démarrer Redis avec Docker
docker run --name redis-billetterie -p 6379:6379 -d redis:alpine

# Ou avec docker-compose (créer un docker-compose.yml)
docker-compose up -d redis
```

## 🔧 Variables d'environnement

Voir le fichier `.env.example` pour toutes les variables nécessaires.

## 📡 API Endpoints

### Authentification
- `POST /api/auth/users` - Créer un utilisateur
- `GET /api/auth/users/:email` - Récupérer un utilisateur

### Événements
- `GET /api/events` - Liste des événements
- `POST /api/events` - Créer un événement
- `PUT /api/events/:id` - Modifier un événement

### Réservations
- `GET /api/reservations` - Mes réservations
- `POST /api/reservations` - Créer une réservation
- `GET /api/reservations/:id` - Détails d'une réservation
- `PUT /api/reservations/:id/cancel` - Annuler une réservation

### Paiements
- `POST /api/payments` - Créer un paiement
- `GET /api/payments/:id` - Détails d'un paiement
- `PUT /api/payments/:id/refund` - Remboursement

### Billets (Nouveaux)
- `GET /api/tickets/my` - Mes billets
- `GET /api/tickets/:id` - Détail d'un billet avec QR code
- `PUT /api/tickets/:id/validate` - Valider un billet (organisateur/admin)
- `PUT /api/tickets/:id/transfer` - Transférer un billet

### Types de billets (Nouveaux)
- `GET /api/ticket-types/event/:eventId` - Types de billets d'un événement
- `POST /api/ticket-types` - Créer un type de billet
- `PUT /api/ticket-types/:id` - Modifier un type de billet
- `DELETE /api/ticket-types/:id` - Supprimer un type de billet

### Surveillance et monitoring
- `GET /health` - Santé du service (MongoDB + Redis)
- `GET /redis-stats` - Statistiques Redis

## 🛡️ Rate Limiting

Le service implémente un système de rate limiting granulaire :

- **Général** : 100 requêtes/15min par IP
- **Authentification** : 5 tentatives/15min par IP  
- **Réservations** : 3 réservations/minute par IP
- **Paiements** : 2 paiements/5min par IP
- **Notifications** : 10 notifications/minute par IP
- **Lecture événements** : 30 lectures/minute par IP
- **Création événements** : 5 créations/heure par IP

## 🗄️ Modèles de données

- **User** : Utilisateurs et authentification
- **Event** : Événements et informations
- **TicketType** : Types de billets et tarifs
- **Ticket** : Billets individuels avec QR codes
- **Reservation** : Réservations et statuts
- **Payment** : Paiements et remboursements
- **Notification** : Système de notifications
- **PromoCode** : Codes promotionnels

## 🔒 Sécurité

- Authentification JWT
- Validation des données avec Joi
- Rate limiting avec Redis
- Gestion des erreurs centralisée
- Protection contre les attaques courantes

## 📈 Monitoring

Le service inclut :
- Logs avec Morgan
- Gestion d'erreurs détaillée
- Monitoring Redis en temps réel
- Arrêt gracieux du serveur
- Statistiques de performance

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature
3. Commit les changements
4. Push vers la branche
5. Ouvrir une Pull Request
