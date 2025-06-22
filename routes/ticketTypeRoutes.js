import { Router } from 'express';
import { protect, authorize } from '../middlewares/auth.js';
import { getGeneralLimiter } from '../middlewares/rateLimiter.js';
import validate from '../middlewares/validate.js';
import { 
  createTicketTypeValidation, 
  updateTicketTypeValidation 
} from '../validations/ticketValidation.js';
import {
  getEventTicketTypes,
  createTicketType,
  updateTicketType,
  deleteTicketType
} from '../controllers/ticketTypeController.js';

const router = Router();

/**
 * @swagger
 * /api/ticket-types/event/{eventId}:
 *   get:
 *     summary: Récupérer les types de billets d'un événement
 *     description: Liste tous les types de billets disponibles pour un événement spécifique
 *     tags: [TicketTypes]
 *     parameters:
 *       - $ref: '#/components/parameters/EventId'
 *     responses:
 *       200:
 *         description: Types de billets récupérés avec succès
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
 *                   example: Types de billets récupérés avec succès
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/TicketType'
 *                       - type: object
 *                         properties:
 *                           isOnSale:
 *                             type: boolean
 *                             example: true
 *                           soldOut:
 *                             type: boolean
 *                             example: false
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/event/:eventId', getEventTicketTypes);

/**
 * @swagger
 * /api/ticket-types:
 *   post:
 *     summary: Créer un nouveau type de billet
 *     description: Permet aux organisateurs et administrateurs de créer un type de billet pour un événement
 *     tags: [TicketTypes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - name
 *               - price
 *               - quantity
 *             properties:
 *               eventId:
 *                 type: string
 *                 example: 64f7a1b2c3d4e5f6a7b8c9d0
 *               name:
 *                 type: string
 *                 example: VIP Gold
 *               description:
 *                 type: string
 *                 example: Accès premium avec backstage
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 example: 150
 *               quantity:
 *                 type: number
 *                 minimum: 1
 *                 example: 50
 *               maxPerPurchase:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 50
 *                 default: 10
 *                 example: 5
 *               saleStartDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-06-01T00:00:00Z"
 *               saleEndDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-07-15T18:00:00Z"
 *     responses:
 *       201:
 *         description: Type de billet créé avec succès
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
 *                   example: Type de billet créé avec succès
 *                 data:
 *                   $ref: '#/components/schemas/TicketType'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Événement non trouvé
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', 
  getGeneralLimiter,
  protect, 
  authorize('organisateur', 'administrateur'),
  validate(createTicketTypeValidation), 
  createTicketType
);

/**
 * @swagger
 * /api/ticket-types/{id}:
 *   put:
 *     summary: Modifier un type de billet
 *     description: Permet de modifier un type de billet existant avec des restrictions sur la quantité
 *     tags: [TicketTypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TicketTypeId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: VIP Platinum
 *               description:
 *                 type: string
 *                 example: Accès ultra premium
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 example: 200
 *               quantity:
 *                 type: number
 *                 minimum: 0
 *                 example: 75
 *                 description: Ne peut pas être inférieur aux billets déjà vendus
 *               maxPerPurchase:
 *                 type: number
 *                 minimum: 1
 *                 example: 3
 *               isAvailable:
 *                 type: boolean
 *                 example: true
 *               saleStartDate:
 *                 type: string
 *                 format: date-time
 *               saleEndDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Type de billet modifié avec succès
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
 *                   example: Type de billet modifié avec succès
 *                 data:
 *                   $ref: '#/components/schemas/TicketType'
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
 * 
 *   delete:
 *     summary: Supprimer un type de billet
 *     description: Permet de supprimer un type de billet s'il n'a aucune vente
 *     tags: [TicketTypes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TicketTypeId'
 *     responses:
 *       200:
 *         description: Type de billet supprimé avec succès
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
 *                   example: Type de billet supprimé avec succès
 *       400:
 *         description: Impossible de supprimer un type avec des ventes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Impossible de supprimer un type de billet ayant des ventes
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:id', 
  protect, 
  authorize('organisateur', 'administrateur'),
  validate(updateTicketTypeValidation), 
  updateTicketType
);

router.delete('/:id', 
  protect, 
  authorize('organisateur', 'administrateur'), 
  deleteTicketType
);

export default router;
