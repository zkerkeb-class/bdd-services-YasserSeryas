import express from "express";
const router = express.Router();
import { protect, authorize } from "../middlewares/auth.js";
import { createEventValidation } from "../validations/eventValidation.js";
import validate from "../middlewares/validate.js";
import {
  conditionalEventReadLimit,
  conditionalEventCreateLimit,
} from "../middlewares/conditionalRateLimit.js";
import { cacheConfig } from "../middlewares/redisCache.js";
import { invalidateEventsCache } from "../middlewares/cacheInvalidation.js";
import {
  getEvents,
  getEvent,
  getMyEvents,
  getEventWithPricing,
  createEvent,
  updateEvent,
  updateEventStatus,getPublishedEvents
} from "../controllers/eventController.js";

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Récupérer tous les événements
 *     description: Liste de tous les événements publics avec informations de l'organisateur et prix minimum disponible
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: Liste des événements récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Event'
 *                   - type: object
 *                     properties:
 *                       minPrice:
 *                         type: number
 *                         nullable: true
 *                         example: 25.00
 *                         description: Prix minimum disponible pour cet événement
 *                       currency:
 *                         type: string
 *                         example: EUR
 *                         description: Devise utilisée
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *  *   post:
 *     summary: Créer un nouvel événement
 *     description: Permet aux organisateurs et administrateurs de créer un événement. Un type de ticket "Standard" est créé automatiquement.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - category
 *               - startDate
 *               - endDate
 *               - location
 *               - totalCapacity
 *             properties:
 *               name:
 *                 type: string
 *                 example: Concert de Jazz
 *               description:
 *                 type: string
 *                 example: Un magnifique concert de jazz en plein air
 *               category:
 *                 type: string
 *                 enum: [concert, théâtre, sport, conférence, festival, autre]
 *                 example: concert
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-07-15T20:00:00Z"
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-07-15T23:00:00Z"
 *               location:
 *                 type: object
 *                 required:
 *                   - name
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: Parc de la Villette
 *                   address:
 *                     type: object
 *                     properties:
 *                       street:
 *                         type: string
 *                         example: 211 Avenue Jean Jaurès
 *                       city:
 *                         type: string
 *                         example: Paris
 *                       postalCode:
 *                         type: string
 *                         example: "75019"
 *                       country:
 *                         type: string
 *                         example: France
 *               totalCapacity:
 *                 type: number
 *                 minimum: 1
 *                 example: 500
 *               isPublic:
 *                 type: boolean
 *                 default: true
 *                 example: true
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["jazz", "musique", "plein-air"]
 *               defaultTicketPrice:
 *                 type: number
 *                 minimum: 0
 *                 example: 25
 *                 description: Prix du ticket Standard créé automatiquement (défaut 25€)
 *               defaultTicketQuantity:
 *                 type: number
 *                 minimum: 1
 *                 example: 100
 *                 description: Quantité du ticket Standard créé automatiquement (défaut 100)
 *               currency:
 *                 type: string
 *                 example: EUR
 *                 description: Devise pour les tickets (défaut EUR)
 *               maxPerPurchase:
 *                 type: number
 *                 minimum: 1
 *                 example: 10
 *                 description: Nombre maximum de tickets par achat (défaut 10)
 *               saleStartDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-07-01T09:00:00Z"
 *                 description: Date de début de vente des tickets (défaut maintenant)
 *               saleEndDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-07-15T18:00:00Z"
 *                 description: Date de fin de vente des tickets (défaut endDate de l'événement)
 *     responses:
 *       201:
 *         description: Événement créé avec succès avec un ticket Standard automatique
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               allOf:
 *                 - $ref: '#/components/schemas/Event'
 *                 - type: object
 *                   properties:
 *                     ticketTypes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TicketType'
 *                       description: Types de tickets créés automatiquement
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router
  .route("/")
  .get(conditionalEventReadLimit, cacheConfig.events, getEvents)
  .post(
    conditionalEventCreateLimit,
    invalidateEventsCache,
    protect,
    authorize("organisateur", "administrateur"),
    validate(createEventValidation),
    createEvent
  );
/**
 * @swagger
 * /api/events/my:
 *   get:
 *     summary: Récupérer mes événements
 *     description: Liste tous les événements créés par l'utilisateur connecté avec statistiques
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Événements de l'organisateur récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Event'
 *                   - type: object
 *                     properties:
 *                       stats:
 *                         type: object
 *                         properties:
 *                           totalTickets:
 *                             type: number
 *                             example: 500
 *                           soldTickets:
 *                             type: number
 *                             example: 150
 *                           availableTickets:
 *                             type: number
 *                             example: 350
 *                           ticketTypes:
 *                             type: number
 *                             example: 3
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/my",
  conditionalEventReadLimit,
  protect,
  cacheConfig.events,
  getMyEvents
);
router.get('/published', getPublishedEvents);
/**
 * @swagger
 * /api/events/{id}/pricing:
 *   get:
 *     summary: Récupérer un événement avec informations de prix détaillées
 *     description: Récupère un événement spécifique avec tous ses types de billets et statistiques de prix (min, max, moyenne)
 *     tags: [Events]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de l'événement
 *         schema:
 *           type: string
 *           example: 64f7a1b2c3d4e5f6a7b8c9d0
 *     responses:
 *       200:
 *         description: Événement avec informations de prix récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               allOf:
 *                 - $ref: '#/components/schemas/Event'
 *                 - type: object
 *                   properties:
 *                     pricing:
 *                       type: object
 *                       properties:
 *                         minPrice:
 *                           type: number
 *                           nullable: true
 *                           example: 25.00
 *                           description: Prix minimum disponible
 *                         maxPrice:
 *                           type: number
 *                           nullable: true
 *                           example: 150.00
 *                           description: Prix maximum disponible
 *                         avgPrice:
 *                           type: number
 *                           nullable: true
 *                           example: 87.50
 *                           description: Prix moyen des billets disponibles
 *                         currency:
 *                           type: string
 *                           example: EUR
 *                           description: Devise utilisée
 *                         totalAvailableTickets:
 *                           type: number
 *                           example: 150
 *                           description: Nombre total de billets disponibles
 *                         ticketTypes:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/TicketType'
 *                           description: Liste de tous les types de billets pour cet événement
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/:id/pricing",
  conditionalEventReadLimit,
  cacheConfig.events,
  getEventWithPricing
);

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Récupérer un événement spécifique
 *     description: Récupère les détails d'un événement par son ID
 *     tags: [Events]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de l'événement à récupérer
 *         schema:
 *           type: string
 *           example: 64f7a1b2c3d4e5f6a7b8c9d0
 *     responses:
 *       200:
 *         description: Événement récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Format d'ID invalide
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid event ID format
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 *
 *   put:
 *     summary: Modifier un événement
 *     description: Permet aux organisateurs et administrateurs de modifier un événement existant
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de l'événement à modifier
 *         schema:
 *           type: string
 *           example: 64f7a1b2c3d4e5f6a7b8c9d0
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Concert de Jazz Modifié
 *               description:
 *                 type: string
 *                 example: Description mise à jour
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: object
 *               totalCapacity:
 *                 type: number
 *                 minimum: 1
 *               status:
 *                 type: string
 *                 enum: [brouillon, publié, annulé, complet, terminé]
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router
  .route("/:id")
  .get(conditionalEventReadLimit, cacheConfig.events, getEvent)
  .put(
    invalidateEventsCache,
    protect,
    authorize("organisateur", "administrateur"),
    validate(createEventValidation),
    updateEvent
  );

  router.put('/:id/status', protect, authorize('organisateur', 'admin'), updateEventStatus);
  

export default router;
