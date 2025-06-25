// middlewares/redisCache.js
import { getRedisClient } from '../config/redis.js';

/**
 * 🚀 Middleware de Cache Redis
 * 
 * Système de cache intelligent avec:
 * - TTL configurables par route
 * - Invalidation automatique
 * - Fallback en cas d'erreur Redis
 * - Support des tags pour invalidation groupée
 */

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

function log(level, message) {
  const colors = {
    HIT: COLORS.green,
    MISS: COLORS.blue,
    SET: COLORS.yellow,
    ERROR: COLORS.red
  };
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`${colors[level] || COLORS.reset}[${timestamp}] CACHE ${level}: ${message}${COLORS.reset}`);
}

/**
 * Génère une clé de cache basée sur la route et les paramètres
 */
function generateCacheKey(req, prefix = 'api') {
  const userId = req.user ? req.user.id : 'anonymous';
  const path = req.route ? req.route.path : req.path;
  const method = req.method;
  const query = JSON.stringify(req.query);
  const params = JSON.stringify(req.params);
  
  return `${prefix}:${method}:${path}:${userId}:${Buffer.from(query + params).toString('base64')}`;
}

/**
 * Génère des tags pour l'invalidation groupée
 */
function generateCacheTags(req, customTags = []) {
  const tags = [...customTags];
  
  // Tags automatiques basés sur la route
  if (req.route && req.route.path) {
    const pathParts = req.route.path.split('/').filter(part => part && !part.startsWith(':'));
    tags.push(...pathParts);
  }
  
  // Tags basés sur les paramètres
  if (req.params) {
    Object.keys(req.params).forEach(param => {
      if (param === 'id' || param.endsWith('Id')) {
        tags.push(`${param}:${req.params[param]}`);
      }
    });
  }
  
  // Tag utilisateur
  if (req.user) {
    tags.push(`user:${req.user.id}`);
  }
  
  return tags;
}

/**
 * Middleware principal de cache
 */
export const cache = (options = {}) => {
  const {
    ttl = 300, // 5 minutes par défaut
    prefix = 'api',
    tags = [],
    condition = () => true, // Condition pour activer le cache
    skipCache = false,
    skipPrivate = true // Skip cache pour les données privées par défaut
  } = options;

  return async (req, res, next) => {
    // Vérifier si le cache doit être ignoré
    if (skipCache || !condition(req)) {
      return next();
    }

    // Skip cache pour les requêtes privées si configuré
    if (skipPrivate && req.user && req.method === 'GET') {
      // Permettre le cache pour certaines routes publiques même avec utilisateur connecté
      const publicRoutes = ['/api/events', '/api/events/:id', '/api/events/:id/pricing'];
      const isPublicRoute = publicRoutes.some(route => {
        const routeRegex = new RegExp('^' + route.replace(/:\w+/g, '[^/]+') + '$');
        return routeRegex.test(req.route?.path || req.path);
      });
      
      if (!isPublicRoute) {
        return next();
      }
    }

    // Seulement pour GET (lectures)
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const redisClient = getRedisClient();
      if (!redisClient || !redisClient.isOpen) {
        log('ERROR', 'Redis non disponible, skip cache');
        return next();
      }

      const cacheKey = generateCacheKey(req, prefix);
      const cacheTags = generateCacheTags(req, tags);

      // Essayer de récupérer depuis le cache
      const cachedData = await redisClient.get(cacheKey);
      
      if (cachedData) {
        log('HIT', `${cacheKey}`);
        const parsed = JSON.parse(cachedData);
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);
        return res.json(parsed);
      }

      log('MISS', `${cacheKey}`);
      res.set('X-Cache', 'MISS');
      res.set('X-Cache-Key', cacheKey);

      // Intercepter la réponse pour la mettre en cache
      const originalJson = res.json;
      res.json = function(data) {
        // Mettre en cache seulement les réponses 200
        if (res.statusCode === 200) {
          const cacheData = JSON.stringify(data);
          
          // Sauvegarder en cache de manière asynchrone
          Promise.resolve().then(async () => {
            try {
              // Sauvegarder la donnée avec TTL
              await redisClient.setEx(cacheKey, ttl, cacheData);
              
              // Sauvegarder les tags pour invalidation groupée
              if (cacheTags.length > 0) {
                const pipeline = redisClient.multi();
                cacheTags.forEach(tag => {
                  pipeline.sAdd(`tag:${tag}`, cacheKey);
                  pipeline.expire(`tag:${tag}`, ttl + 60); // Tags durent un peu plus longtemps
                });
                await pipeline.exec();
              }
              
              log('SET', `${cacheKey} (${cacheTags.join(', ')})`);
            } catch (error) {
              log('ERROR', `Erreur sauvegarde cache: ${error.message}`);
            }
          });
        }
        
        return originalJson.call(this, data);
      };

      next();

    } catch (error) {
      log('ERROR', `Erreur cache middleware: ${error.message}`);
      next();
    }
  };
};

/**
 * Invalidation de cache par tags
 */
export const invalidateCache = async (tags = [], prefix = 'api') => {
  try {
    const redisClient = getRedisClient();
    if (!redisClient || !redisClient.isOpen) {
      log('ERROR', 'Redis non disponible pour invalidation');
      return false;
    }

    const pipeline = redisClient.multi();
    let totalKeys = 0;

    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      const keys = await redisClient.sMembers(tagKey);
      
      if (keys.length > 0) {
        // Supprimer toutes les clés associées au tag
        keys.forEach(key => pipeline.del(key));
        totalKeys += keys.length;
      }
      
      // Supprimer le tag lui-même
      pipeline.del(tagKey);
    }

    if (totalKeys > 0) {
      await pipeline.exec();
      log('SET', `Invalidated ${totalKeys} keys for tags: ${tags.join(', ')}`);
    }

    return true;
  } catch (error) {
    log('ERROR', `Erreur invalidation cache: ${error.message}`);
    return false;
  }
};

/**
 * Invalidation de cache par pattern
 */
export const invalidateCachePattern = async (pattern) => {
  try {
    const redisClient = getRedisClient();
    if (!redisClient || !redisClient.isOpen) {
      return false;
    }

    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      log('SET', `Invalidated ${keys.length} keys for pattern: ${pattern}`);
    }

    return true;
  } catch (error) {
    log('ERROR', `Erreur invalidation pattern: ${error.message}`);
    return false;
  }
};

/**
 * Vider tout le cache
 */
export const clearAllCache = async () => {
  try {
    const redisClient = getRedisClient();
    if (!redisClient || !redisClient.isOpen) {
      return false;
    }

    await redisClient.flushDb();
    log('SET', 'Tout le cache a été vidé');
    return true;
  } catch (error) {
    log('ERROR', `Erreur clear cache: ${error.message}`);
    return false;
  }
};

/**
 * Statistiques du cache
 */
export const getCacheStats = async () => {
  try {
    const redisClient = getRedisClient();
    if (!redisClient || !redisClient.isOpen) {
      return null;
    }

    const info = await redisClient.info('memory');
    const keyspace = await redisClient.info('keyspace');
    const stats = await redisClient.info('stats');

    return {
      memory: info,
      keyspace: keyspace,
      stats: stats,
      isConnected: redisClient.isOpen
    };
  } catch (error) {
    log('ERROR', `Erreur stats cache: ${error.message}`);
    return null;
  }
};

/**
 * Middlewares de cache pré-configurés pour différents types de données
 */
export const cacheConfig = {
  // Cache court pour les données qui changent souvent
  short: cache({ ttl: 60 }), // 1 minute
  
  // Cache moyen pour les données semi-statiques
  medium: cache({ ttl: 300 }), // 5 minutes
  
  // Cache long pour les données statiques
  long: cache({ ttl: 3600 }), // 1 heure
  
  // Cache très long pour les données rarement modifiées
  veryLong: cache({ ttl: 86400 }), // 24 heures
  
  // Cache spécialisés
  events: cache({ 
    ttl: 300, 
    prefix: 'events',
    tags: ['events'],
    condition: (req) => req.method === 'GET'
  }),
  
  ticketTypes: cache({ 
    ttl: 600, 
    prefix: 'ticket-types',
    tags: ['ticket-types'],
    condition: (req) => req.method === 'GET'
  }),
  
  userProfile: cache({ 
    ttl: 180, 
    prefix: 'user',
    tags: ['user'],
    skipPrivate: false, // Permettre le cache pour les données utilisateur
    condition: (req) => req.method === 'GET' && req.user
  }),
  
  // Cache pour les réservations (données privées)
  reservations: cache({
    ttl: 120, // 2 minutes
    prefix: 'reservations',
    tags: ['reservations'],
    skipPrivate: false,
    condition: (req) => req.method === 'GET' && req.user
  }),
  
  // Cache pour les billets (données privées)
  tickets: cache({
    ttl: 300, // 5 minutes
    prefix: 'tickets',
    tags: ['tickets'],
    skipPrivate: false,
    condition: (req) => req.method === 'GET' && req.user
  }),
  
  // Cache pour les paiements (données sensibles, cache court)
  payments: cache({
    ttl: 60, // 1 minute
    prefix: 'payments',
    tags: ['payments'],
    skipPrivate: false,
    condition: (req) => req.method === 'GET' && req.user
  }),
  
  // Cache pour les notifications
  notifications: cache({
    ttl: 120, // 2 minutes
    prefix: 'notifications',
    tags: ['notifications'],
    condition: (req) => req.method === 'GET'
  }),
  
  // Cache pour les données d'authentification (très court)
  auth: cache({
    ttl: 30, // 30 secondes
    prefix: 'auth',
    tags: ['auth'],
    condition: (req) => req.method === 'GET'
  })
};

export default {
  cache,
  invalidateCache,
  invalidateCachePattern,
  clearAllCache,
  getCacheStats,
  cacheConfig
};
