import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler } from './middlewares/errorHandler.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { initializeRateLimiters } from './middlewares/rateLimiter.js';
import { conditionalGeneralLimit } from './middlewares/conditionalRateLimit.js';
import { getRedisStats, redisHealthCheck } from './middlewares/redisMonitoring.js';
import { specs, swaggerUi } from './config/swagger.js';
import eventRoutes from './routes/eventRoutes.js'
import authRoutes from './routes/authRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import ticketTypeRoutes from './routes/ticketTypeRoutes.js';
import cacheRoutes from './routes/cacheRoutes.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// Vérification des variables d'environnement critiques
if (!MONGO_URI) {
  console.error("❌ MONGO_URI non définie dans les variables d'environnement");  process.exit(1);
}

 app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));



// Connexion à MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Connexion à MongoDB réussie"))
  .catch((err) => console.error("❌ Erreur de connexion à MongoDB:", err));

// Initialisation asynchrone de Redis en arrière-plan
let isRedisReady = false;

connectRedis()
  .then((redisClient) => {
    console.log('🔄 Initialisation des rate limiters...');
    initializeRateLimiters(redisClient);
    isRedisReady = true;
    console.log('✅ Redis et rate limiters prêts');
  })
  .catch((error) => {
    console.error('⚠️ Redis non disponible, l\'API fonctionnera sans rate limiting:', error.message);
    isRedisReady = false;
  });

// Middleware conditionnel pour le rate limiting global
app.use(conditionalGeneralLimit);

// Routes principales (toujours disponibles)
app.get("/", (req, res) => {
    res.json({
      message: "🎫 Service BDD - Billetterie en Ligne",
      status: "✅ Opérationnel",
      version: "1.0.0",
      documentation: {
        swagger: `${req.protocol}://${req.get('host')}/api-docs`,
        description: "Documentation interactive Swagger UI"
      },
      endpoints: {
        health: "/health",
        redisStats: "/redis-stats",
        api: {
          auth: "/api/auth",
          events: "/api/events", 
          reservations: "/api/reservations",
          payments: "/api/payments",
          notifications: "/api/notifications",
          tickets: "/api/tickets",
          ticketTypes: "/api/ticket-types"
        }
      },
      features: [
        "🔐 Authentification JWT",
        "🎪 Gestion des événements", 
        "🎫 Types de billets configurables",
        "📅 Système de réservation",
        "💳 Traitement des paiements",
        "🔔 Notifications",
        "🚦 Rate limiting",
        "📊 Monitoring Redis"
      ]
    });
  });

  // Route de santé avec Redis
  app.get("/health", redisHealthCheck, (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    services: {
      mongodb: "connected",
      redis: "checked"
    }
  });
});

// Route pour les statistiques Redis (pour le monitoring)
app.get("/redis-stats", getRedisStats);

// Documentation Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true
  }
}));

// Route pour récupérer un utilisateur
app.use('/api/auth', authRoutes);
// route events
app.use('/api/events', eventRoutes);
// route reservation
app.use('/api/reservations', reservationRoutes);
// Route pour gérer les paiements
app.use('/api/payments', paymentRoutes);
// route notification
app.use('/api/notifications', notificationRoutes);
// Routes pour la gestion des billets
app.use('/api/tickets', ticketRoutes);
// Routes pour la gestion des types de billets
app.use('/api/ticket-types', ticketTypeRoutes);
// Routes pour la gestion du cache Redis
app.use('/api/cache', cacheRoutes);

// Middleware de gestion d'erreurs
app.use(errorHandler);

// Démarrer le serveur
const server = app.listen(PORT, () =>
  console.log(`📡 Service BDD en écoute sur le port ${PORT}`)
);

// Gestion gracieuse de l'arrêt du serveur
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown(signal) {
  console.log(`\n🔄 Signal ${signal} reçu. Arrêt gracieux du serveur...`);
    server.close(() => {
    console.log('✅ Serveur HTTP fermé.');
    
    // Fermer la connexion Redis
    disconnectRedis().then(() => {
      console.log('✅ Connexion Redis fermée.');
      
      mongoose.connection.close(false, () => {
        console.log('✅ Connexion MongoDB fermée.');
        process.exit(0);
      });
    });
  });
}
