// middlewares/rateLimiter.js
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

// Variables pour stocker les limiters
let generalLimiter, authLimiter, reservationLimiter, paymentLimiter, notificationLimiter, eventReadLimiter, eventCreateLimiter;

// Fonction d'initialisation qui sera appelée APRÈS la connexion Redis
export const initializeRateLimiters = (redisClient) => {
  console.log('🔄 Création des rate limiters...');
  
  // Vérifier que le client Redis est fourni et connecté
  if (!redisClient) {
    throw new Error('Le client Redis n\'est pas fourni');
  }
  
  if (!redisClient.isOpen) {
    throw new Error('Le client Redis n\'est pas connecté');
  }

  // Rate limiter général pour toutes les routes
  generalLimiter = rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix: 'rl:general:'
    }),
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
      error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      return req.path === '/health' || req.path === '/';
    }
  });

  // Rate limiter strict pour l'authentification
  authLimiter = rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix: 'rl:auth:'
    }),
    windowMs: 15 * 60 * 1000,
    max:100,
    message: {
      error: 'Trop de tentatives de connexion, veuillez réessayer plus tard.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true
  });

  // Rate limiter pour les réservations
  reservationLimiter = rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix: 'rl:reservation:'
    }),
    windowMs: 60 * 1000,
    max: 100,
    message: {
      error: 'Limite de réservations atteinte, veuillez patienter avant de réessayer.',
      retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false
  });

  // Rate limiter pour les paiements
  paymentLimiter = rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix: 'rl:payment:'
    }),
    windowMs: 5 * 60 * 1000,
    max: 2,
    message: {
      error: 'Limite de paiements atteinte, veuillez patienter avant de réessayer.',
      retryAfter: '5 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
  });

  // Rate limiter pour les notifications
  notificationLimiter = rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix: 'rl:notification:'
    }),
    windowMs: 60 * 1000,
    max: 10,
    message: {
      error: 'Limite de notifications atteinte, veuillez patienter.',
      retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false
  });

  // Rate limiter pour les événements (lecture)
  eventReadLimiter = rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix: 'rl:event:read:'
    }),
    windowMs: 60 * 1000,
    max: 30,
    message: {
      error: 'Limite de consultation des événements atteinte.',
      retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false
  });

  // Rate limiter pour la création d'événements
  eventCreateLimiter = rateLimit({
    store: new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix: 'rl:event:create:'
    }),
    windowMs: 60 * 60 * 1000,
    max: 1000,
    message: {
      error: 'Limite de création d\'événements atteinte pour cette heure.',
      retryAfter: '1 heure'
    },
    standardHeaders: true,
    legacyHeaders: false
  });
  
  console.log('✅ Rate limiters créés avec succès');
};

// Getters pour accéder aux limiters
export const getGeneralLimiter = () => {
  if (!generalLimiter) {
    throw new Error('Rate limiters non initialisés. Appelez initializeRateLimiters() d\'abord.');
  }
  return generalLimiter;
};

export const getAuthLimiter = () => {
  if (!authLimiter) {
    throw new Error('Rate limiters non initialisés. Appelez initializeRateLimiters() d\'abord.');
  }
  return authLimiter;
};

export const getReservationLimiter = () => {
  if (!reservationLimiter) {
    throw new Error('Rate limiters non initialisés. Appelez initializeRateLimiters() d\'abord.');
  }
  return reservationLimiter;
};

export const getPaymentLimiter = () => {
  if (!paymentLimiter) {
    throw new Error('Rate limiters non initialisés. Appelez initializeRateLimiters() d\'abord.');
  }
  return paymentLimiter;
};

export const getNotificationLimiter = () => {
  if (!notificationLimiter) {
    throw new Error('Rate limiters non initialisés. Appelez initializeRateLimiters() d\'abord.');
  }
  return notificationLimiter;
};

export const getEventReadLimiter = () => {
  if (!eventReadLimiter) {
    throw new Error('Rate limiters non initialisés. Appelez initializeRateLimiters() d\'abord.');
  }
  return eventReadLimiter;
};

export const getEventCreateLimiter = () => {
  if (!eventCreateLimiter) {
    throw new Error('Rate limiters non initialisés. Appelez initializeRateLimiters() d\'abord.');
  }
  return eventCreateLimiter;
};

// Exports pour la compatibilité (à utiliser après initialisation)
export { generalLimiter, authLimiter, reservationLimiter, paymentLimiter, notificationLimiter, eventReadLimiter, eventCreateLimiter };
