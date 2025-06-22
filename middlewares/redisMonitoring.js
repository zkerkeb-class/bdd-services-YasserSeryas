import { redisClient } from '../config/redis.js';

// Middleware pour vérifier la santé de Redis
export const redisHealthCheck = async (req, res, next) => {
  try {
    if (!redisClient.isOpen) {
      console.warn('⚠️ Redis non connecté, continuons sans cache');
      return next();
    }
    
    // Test simple de ping Redis
    await redisClient.ping();
    next();
  } catch (error) {
    console.error('❌ Erreur Redis Health Check:', error.message);
    // Continuons sans Redis si une erreur survient
    next();
  }
};

// Middleware pour récupérer des statistiques Redis
export const getRedisStats = async (req, res) => {
  try {
    if (!redisClient.isOpen) {
      return res.status(503).json({
        status: 'Redis non connecté',
        connected: false
      });
    }

    const info = await redisClient.info();
    const memory = await redisClient.memory('usage');
    const dbSize = await redisClient.dbSize();

    res.json({
      status: 'Redis connecté',
      connected: true,
      database_size: dbSize,
      memory_usage: memory,
      server_info: {
        version: info.split('\r\n').find(line => line.startsWith('redis_version'))?.split(':')[1],
        uptime: info.split('\r\n').find(line => line.startsWith('uptime_in_seconds'))?.split(':')[1]
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'Erreur Redis',
      error: error.message,
      connected: false
    });
  }
};

// Utilitaire pour nettoyer les clés expirées manuellement
export const cleanupRedisKeys = async () => {
  try {
    if (!redisClient.isOpen) {
      console.warn('⚠️ Redis non connecté, impossible de nettoyer');
      return;
    }

    // Récupérer toutes les clés de rate limiting
    const keys = await redisClient.keys('rl:*');
    console.log(`🧹 Nettoyage Redis: ${keys.length} clés trouvées`);
    
    // Cette opération est automatique avec TTL, mais peut être utile pour le debug
    if (keys.length > 1000) {
      console.warn(`⚠️ Beaucoup de clés Redis (${keys.length}), vérifiez la configuration TTL`);
    }
    
    return keys.length;
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage Redis:', error.message);
  }
};
