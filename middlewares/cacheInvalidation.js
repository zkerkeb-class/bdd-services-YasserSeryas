// middlewares/cacheInvalidation.js
import { invalidateCache, invalidateCachePattern } from './redisCache.js';

/**
 * 🔄 Middleware d'Invalidation Automatique du Cache
 * 
 * Invalide automatiquement le cache lors des opérations de modification
 * (POST, PUT, DELETE) pour maintenir la cohérence des données.
 */

/**
 * Middleware d'invalidation pour les événements
 */
export const invalidateEventsCache = async (req, res, next) => {
  // Stocker la méthode originale pour l'invalidation post-traitement
  const originalMethod = req.method;
  
  if (['POST', 'PUT', 'DELETE'].includes(originalMethod)) {
    // Intercepter la réponse pour invalider après succès
    const originalJson = res.json;
    res.json = function(data) {
      // Invalider seulement si la réponse est un succès
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Invalidation asynchrone pour ne pas bloquer la réponse
        Promise.resolve().then(async () => {
          try {
            const tagsToInvalidate = ['events'];
            
            // Ajouter des tags spécifiques selon l'opération
            if (req.params.id) {
              tagsToInvalidate.push(`id:${req.params.id}`);
            }
            
            if (req.user) {
              tagsToInvalidate.push(`user:${req.user.id}`);
            }
            
            // Invalider les patterns de cache d'événements
            await invalidateCache(tagsToInvalidate);
            await invalidateCachePattern('events:*');
            await invalidateCachePattern('api:GET:/api/events*');
            
            console.log(`🔄 Cache d'événements invalidé après ${originalMethod} ${req.path}`);
          } catch (error) {
            console.error('❌ Erreur invalidation cache événements:', error.message);
          }
        });
      }
      
      return originalJson.call(this, data);
    };
  }
  
  next();
};

/**
 * Middleware d'invalidation pour les types de billets
 */
export const invalidateTicketTypesCache = async (req, res, next) => {
  const originalMethod = req.method;
  
  if (['POST', 'PUT', 'DELETE'].includes(originalMethod)) {
    const originalJson = res.json;
    res.json = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        Promise.resolve().then(async () => {
          try {
            const tagsToInvalidate = ['ticket-types'];
            
            if (req.params.id) {
              tagsToInvalidate.push(`id:${req.params.id}`);
            }
            
            if (req.params.eventId) {
              tagsToInvalidate.push(`eventId:${req.params.eventId}`);
              // Invalider aussi le cache des événements car les prix peuvent changer
              tagsToInvalidate.push('events');
            }
            
            if (req.body.event) {
              tagsToInvalidate.push(`eventId:${req.body.event}`);
              tagsToInvalidate.push('events');
            }
            
            await invalidateCache(tagsToInvalidate);
            await invalidateCachePattern('ticket-types:*');
            await invalidateCachePattern('api:GET:/api/ticket-types*');
            await invalidateCachePattern('api:GET:/api/events*'); // Les prix des événements peuvent changer
            
            console.log(`🔄 Cache de types de billets invalidé après ${originalMethod} ${req.path}`);
          } catch (error) {
            console.error('❌ Erreur invalidation cache ticket types:', error.message);
          }
        });
      }
      
      return originalJson.call(this, data);
    };
  }
  
  next();
};

/**
 * Middleware d'invalidation pour les réservations
 */
export const invalidateReservationsCache = async (req, res, next) => {
  const originalMethod = req.method;
  
  if (['POST', 'PUT', 'DELETE'].includes(originalMethod)) {
    const originalJson = res.json;
    res.json = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        Promise.resolve().then(async () => {
          try {
            const tagsToInvalidate = ['reservations'];
            
            if (req.params.id) {
              tagsToInvalidate.push(`id:${req.params.id}`);
            }
            
            if (req.user) {
              tagsToInvalidate.push(`user:${req.user.id}`);
            }
            
            // Une réservation peut affecter la disponibilité des événements
            if (req.body.event || (data && data.event)) {
              tagsToInvalidate.push('events');
              tagsToInvalidate.push('ticket-types');
            }
            
            await invalidateCache(tagsToInvalidate);
            await invalidateCachePattern('api:GET:/api/reservations*');
            await invalidateCachePattern('api:GET:/api/events*'); // Capacité restante
            
            console.log(`🔄 Cache de réservations invalidé après ${originalMethod} ${req.path}`);
          } catch (error) {
            console.error('❌ Erreur invalidation cache réservations:', error.message);
          }
        });
      }
      
      return originalJson.call(this, data);
    };
  }
  
  next();
};

/**
 * Middleware d'invalidation pour les billets
 */
export const invalidateTicketsCache = async (req, res, next) => {
  const originalMethod = req.method;
  
  if (['POST', 'PUT', 'DELETE'].includes(originalMethod)) {
    const originalJson = res.json;
    res.json = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        Promise.resolve().then(async () => {
          try {
            const tagsToInvalidate = ['tickets'];
            
            if (req.params.id) {
              tagsToInvalidate.push(`id:${req.params.id}`);
            }
            
            if (req.user) {
              tagsToInvalidate.push(`user:${req.user.id}`);
            }
            
            // Transfert ou validation de billets peut affecter plusieurs utilisateurs
            if (req.body.newOwnerEmail) {
              // On ne peut pas facilement obtenir l'ID du nouveau propriétaire ici
              // Donc on invalide plus largement
              await invalidateCachePattern('user:*');
            }
            
            await invalidateCache(tagsToInvalidate);
            await invalidateCachePattern('api:GET:/api/tickets*');
            
            console.log(`🔄 Cache de billets invalidé après ${originalMethod} ${req.path}`);
          } catch (error) {
            console.error('❌ Erreur invalidation cache billets:', error.message);
          }
        });
      }
      
      return originalJson.call(this, data);
    };
  }
  
  next();
};

/**
 * Middleware d'invalidation pour les utilisateurs
 */
export const invalidateUsersCache = async (req, res, next) => {
  const originalMethod = req.method;
  
  if (['POST', 'PUT', 'DELETE'].includes(originalMethod)) {
    const originalJson = res.json;
    res.json = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        Promise.resolve().then(async () => {
          try {
            const tagsToInvalidate = ['user'];
            
            if (req.params.id) {
              tagsToInvalidate.push(`id:${req.params.id}`);
            }
            
            if (req.user) {
              tagsToInvalidate.push(`user:${req.user.id}`);
            }
            
            await invalidateCache(tagsToInvalidate);
            await invalidateCachePattern('user:*');
            await invalidateCachePattern('api:GET:/api/auth*');
            
            console.log(`🔄 Cache d'utilisateurs invalidé après ${originalMethod} ${req.path}`);
          } catch (error) {
            console.error('❌ Erreur invalidation cache utilisateurs:', error.message);
          }
        });
      }
      
      return originalJson.call(this, data);
    };
  }
  
  next();
};

/**
 * Middleware d'invalidation générique
 */
export const invalidateGenericCache = (tags = [], patterns = []) => {
  return async (req, res, next) => {
    const originalMethod = req.method;
    
    if (['POST', 'PUT', 'DELETE'].includes(originalMethod)) {
      const originalJson = res.json;
      res.json = function(data) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          Promise.resolve().then(async () => {
            try {
              // Invalider les tags
              if (tags.length > 0) {
                await invalidateCache(tags);
              }
              
              // Invalider les patterns
              for (const pattern of patterns) {
                await invalidateCachePattern(pattern);
              }
              
              console.log(`🔄 Cache générateur invalidé après ${originalMethod} ${req.path}`);
            } catch (error) {
              console.error('❌ Erreur invalidation cache générique:', error.message);
            }
          });
        }
        
        return originalJson.call(this, data);
      };
    }
    
    next();
  };
};

export default {
  invalidateEventsCache,
  invalidateTicketTypesCache,
  invalidateReservationsCache,
  invalidateTicketsCache,
  invalidateUsersCache,
  invalidateGenericCache
};
