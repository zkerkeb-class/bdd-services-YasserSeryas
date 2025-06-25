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

    // Récupérer les informations générales
    const info = await redisClient.info();
    const dbSize = await redisClient.dbSize();

    // Parser les informations pour extraire les données importantes
    const infoLines = info.split('\r\n');
    const serverInfo = {};
    const memoryInfo = {};
    const statsInfo = {};

    infoLines.forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        if (key && value) {
          serverInfo[key.trim()] = value.trim();
          
          // Extraire spécifiquement les infos mémoire
          if (key.includes('memory')) {
            memoryInfo[key.trim()] = value.trim();
          }
          
          // Extraire les stats de performance
          if (key.includes('keyspace') || key.includes('ops') || key.includes('connections')) {
            statsInfo[key.trim()] = value.trim();
          }
        }
      }
    });

    // Calculer le hit rate si les données sont disponibles
    const hits = parseInt(statsInfo.keyspace_hits) || 0;
    const misses = parseInt(statsInfo.keyspace_misses) || 0;
    const total = hits + misses;
    const hitRate = total > 0 ? ((hits / total) * 100).toFixed(2) + '%' : 'N/A';

    res.json({
      status: 'Redis connecté',
      connected: true,
      database_size: dbSize,
      memory_info: {
        used_memory: memoryInfo.used_memory || 'N/A',
        used_memory_human: memoryInfo.used_memory_human || 'N/A',
        used_memory_peak: memoryInfo.used_memory_peak || 'N/A',
        used_memory_peak_human: memoryInfo.used_memory_peak_human || 'N/A'
      },
      performance_stats: {
        keyspace_hits: statsInfo.keyspace_hits || '0',
        keyspace_misses: statsInfo.keyspace_misses || '0',
        hit_rate: hitRate,
        instantaneous_ops_per_sec: statsInfo.instantaneous_ops_per_sec || '0',
        total_connections_received: statsInfo.total_connections_received || '0',
        connected_clients: statsInfo.connected_clients || '0'
      },
      server_info: {
        version: serverInfo.redis_version || 'Inconnue',
        uptime_seconds: serverInfo.uptime_in_seconds || 'Inconnu',
        uptime_days: serverInfo.uptime_in_days || 'Inconnu',
        role: serverInfo.role || 'Inconnu',
        total_commands_processed: serverInfo.total_commands_processed || '0'
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
      return { error: 'Redis non connecté' };
    }

    // Récupérer différents types de clés
    const allKeys = await redisClient.keys('*');
    const rateLimitKeys = await redisClient.keys('rl:*');
    const cacheKeys = await redisClient.keys('api:*');
    const tagKeys = await redisClient.keys('tag:*');
    
    console.log(`🧹 Analyse Redis:`);
    console.log(`   📊 Total clés: ${allKeys.length}`);
    console.log(`   🚦 Rate limit: ${rateLimitKeys.length}`);
    console.log(`   💾 Cache API: ${cacheKeys.length}`);
    console.log(`   🏷️ Tags: ${tagKeys.length}`);
    
    // Avertissement si trop de clés
    if (allKeys.length > 10000) {
      console.warn(`⚠️ Beaucoup de clés Redis (${allKeys.length}), vérifiez la configuration TTL`);
    }
    
    // Vérifier les TTL d'un échantillon de clés
    let keysWithoutTTL = 0;
    const sampleSize = Math.min(50, allKeys.length);
    const sampleKeys = allKeys.slice(0, sampleSize);
    
    for (const key of sampleKeys) {
      try {
        const ttl = await redisClient.ttl(key);
        if (ttl === -1) { // Pas de TTL
          keysWithoutTTL++;
          console.warn(`⚠️ Clé sans TTL: ${key}`);
        }
      } catch (error) {
        console.warn(`⚠️ Erreur vérification TTL pour ${key}:`, error.message);
      }
    }
    
    const result = {
      total_keys: allKeys.length,
      rate_limit_keys: rateLimitKeys.length,
      cache_keys: cacheKeys.length,
      tag_keys: tagKeys.length,
      keys_without_ttl: keysWithoutTTL,
      sample_size: sampleSize,
      recommendations: []
    };
    
    // Recommandations
    if (keysWithoutTTL > 0) {
      result.recommendations.push(`${keysWithoutTTL} clés sans TTL détectées - vérifiez la configuration`);
    }
    
    if (allKeys.length > 5000) {
      result.recommendations.push('Nombre élevé de clés - considérez un nettoyage');
    }
    
    if (rateLimitKeys.length > cacheKeys.length * 2) {
      result.recommendations.push('Beaucoup de clés rate limiting - TTL peut-être trop long');
    }
    
    console.log(`✅ Analyse terminée: ${result.recommendations.length} recommandations`);
    
    return result;
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage Redis:', error.message);
    return { error: error.message };
  }
};
