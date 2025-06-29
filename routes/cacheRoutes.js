// routes/cacheRoutes.js
import { Router } from 'express';
import { protect, authorize } from '../middlewares/auth.js';
import { conditionalGeneralLimit } from '../middlewares/conditionalRateLimit.js';
import { 
  getCacheStats, 
  clearAllCache, 
  invalidateCache, 
  invalidateCachePattern 
} from '../middlewares/redisCache.js';

const router = Router();

/**
 * @swagger
 * /api/cache/stats:
 *   get:
 *     summary: Statistiques du cache Redis
 *     description: Récupère les statistiques détaillées du cache Redis (admin seulement)
 *     tags: [Cache Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques du cache récupérées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     memory:
 *                       type: string
 *                       description: Informations mémoire Redis
 *                     keyspace:
 *                       type: string
 *                       description: Informations sur les clés
 *                     stats:
 *                       type: string
 *                       description: Statistiques Redis
 *                     isConnected:
 *                       type: boolean
 *                       description: État de la connexion Redis
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/stats', 
  conditionalGeneralLimit,
  protect, 
  authorize('administrateur'), 
  async (req, res) => {
    try {
      const stats = await getCacheStats();
      
      if (!stats) {
        return res.status(503).json({
          success: false,
          message: 'Cache Redis non disponible'
        });
      }
      
      res.json({
        success: true,
        message: 'Statistiques du cache récupérées',
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/cache/clear:
 *   delete:
 *     summary: Vider tout le cache
 *     description: Supprime toutes les entrées du cache Redis (admin seulement)
 *     tags: [Cache Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache vidé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Cache vidé avec succès"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.delete('/clear', 
  conditionalGeneralLimit,
  protect, 
  authorize('administrateur'), 
  async (req, res) => {
    try {
      const success = await clearAllCache();
      
      if (!success) {
        return res.status(503).json({
          success: false,
          message: 'Impossible de vider le cache - Redis non disponible'
        });
      }
      
      res.json({
        success: true,
        message: 'Cache vidé avec succès'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors du vidage du cache',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/cache/invalidate/tags:
 *   post:
 *     summary: Invalider le cache par tags
 *     description: Invalide les entrées de cache associées aux tags spécifiés (admin seulement)
 *     tags: [Cache Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tags
 *             properties:
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["events", "ticket-types"]
 *                 description: Liste des tags à invalider
 *     responses:
 *       200:
 *         description: Cache invalidé avec succès
 *       400:
 *         description: Tags manquants
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/invalidate/tags', 
  conditionalGeneralLimit,
  protect, 
  authorize('administrateur'), 
  async (req, res) => {
    try {
      const { tags } = req.body;
      
      if (!tags || !Array.isArray(tags) || tags.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Liste de tags requise'
        });
      }
      
      const success = await invalidateCache(tags);
      
      if (!success) {
        return res.status(503).json({
          success: false,
          message: 'Impossible d\'invalider le cache - Redis non disponible'
        });
      }
      
      res.json({
        success: true,
        message: `Cache invalidé pour les tags: ${tags.join(', ')}`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'invalidation du cache',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/cache/invalidate/pattern:
 *   post:
 *     summary: Invalider le cache par pattern
 *     description: Invalide les entrées de cache correspondant au pattern spécifié (admin seulement)
 *     tags: [Cache Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pattern
 *             properties:
 *               pattern:
 *                 type: string
 *                 example: "api:GET:/api/events*"
 *                 description: Pattern Redis pour les clés à invalider
 *     responses:
 *       200:
 *         description: Cache invalidé avec succès
 *       400:
 *         description: Pattern manquant
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post('/invalidate/pattern', 
  conditionalGeneralLimit,
  protect, 
  authorize('administrateur'), 
  async (req, res) => {
    try {
      const { pattern } = req.body;
      
      if (!pattern || typeof pattern !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Pattern requis'
        });
      }
      
      const success = await invalidateCachePattern(pattern);
      
      if (!success) {
        return res.status(503).json({
          success: false,
          message: 'Impossible d\'invalider le cache - Redis non disponible'
        });
      }
      
      res.json({
        success: true,
        message: `Cache invalidé pour le pattern: ${pattern}`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'invalidation du cache',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /api/cache/health:
 *   get:
 *     summary: État de santé du cache
 *     description: Vérifie l'état de santé du système de cache Redis
 *     tags: [Cache Management]
 *     responses:
 *       200:
 *         description: Cache opérationnel
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 message:
 *                   type: string
 *                   example: "Cache Redis opérationnel"
 *       503:
 *         description: Cache non disponible
 */
router.get('/health', 
  conditionalGeneralLimit,
  async (req, res) => {
    try {
      const stats = await getCacheStats();
      
      if (!stats || !stats.isConnected) {
        return res.status(503).json({
          success: false,
          status: 'unhealthy',
          message: 'Cache Redis non disponible'
        });
      }
      
      res.json({
        success: true,
        status: 'healthy',
        message: 'Cache Redis opérationnel',
        data: {
          isConnected: stats.isConnected
        }
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        message: 'Erreur lors de la vérification du cache',
        error: error.message
      });
    }
  }
);

export default router;
