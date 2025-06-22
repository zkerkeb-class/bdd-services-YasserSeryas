import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// Configuration du client Redis
const redisConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
  }
};

// Créer le client Redis
const redisClient = createClient(redisConfig);

// Gestion des événements Redis
redisClient.on('connect', () => {
  console.log('🔌 Connexion à Redis en cours...');
});

redisClient.on('ready', () => {
  console.log('✅ Redis connecté et prêt');
});

redisClient.on('error', (err) => {
  console.error('❌ Erreur Redis:', err.message);
});

redisClient.on('end', () => {
  console.log('🔌 Connexion Redis fermée');
});

// Connecter Redis
const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    return redisClient;
  } catch (error) {
    console.error('❌ Erreur de connexion à Redis:', error.message);
    throw error;
  }
};

// Fermer la connexion Redis proprement
const disconnectRedis = async () => {
  try {
    if (redisClient.isOpen) {
      await redisClient.quit();
    }
  } catch (error) {
    console.error('❌ Erreur lors de la fermeture Redis:', error.message);
  }
};

export { redisClient, connectRedis, disconnectRedis };
