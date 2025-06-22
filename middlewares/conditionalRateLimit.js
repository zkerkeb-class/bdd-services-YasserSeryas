// middlewares/conditionalRateLimit.js
import { 
  getAuthLimiter, 
  getReservationLimiter, 
  getPaymentLimiter, 
  getNotificationLimiter,
  getEventReadLimiter,
  getEventCreateLimiter 
} from './rateLimiter.js';

// Middleware conditionnel pour appliquer le rate limiting seulement si Redis est disponible
export const conditionalRateLimit = (getLimiterFn) => {
  return (req, res, next) => {
    try {
      const limiter = getLimiterFn();
      return limiter(req, res, next);
    } catch (error) {
      console.warn(`⚠️ Rate limiter non disponible pour ${req.path}:`, error.message);
      next();
    }
  };
};

// Middlewares spécifiques exportés
export const conditionalAuthLimit = conditionalRateLimit(getAuthLimiter);
export const conditionalReservationLimit = conditionalRateLimit(getReservationLimiter);
export const conditionalPaymentLimit = conditionalRateLimit(getPaymentLimiter);
export const conditionalNotificationLimit = conditionalRateLimit(getNotificationLimiter);
export const conditionalEventReadLimit = conditionalRateLimit(getEventReadLimiter);
export const conditionalEventCreateLimit = conditionalRateLimit(getEventCreateLimiter);
