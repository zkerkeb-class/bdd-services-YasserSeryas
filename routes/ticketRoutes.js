import { Router } from 'express';
import { protect, authorize } from '../middlewares/auth.js';
import { conditionalGeneralLimit } from '../middlewares/conditionalRateLimit.js';
import { cacheConfig } from '../middlewares/redisCache.js';
import { invalidateTicketsCache } from '../middlewares/cacheInvalidation.js';
import validate from '../middlewares/validate.js';
import { transferTicketValidation } from '../validations/ticketValidation.js';
import {
  getTicketById,
  validateTicket,
  transferTicket,
  getUserTickets
} from '../controllers/ticketController.js';

const router = Router();

/**
 * @swagger
 * /api/tickets/my:
 *   get:
 *     summary: Récupérer mes billets
 *     description: Liste tous les billets de l'utilisateur connecté avec détails des événements
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Billets récupérés avec succès
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
 *                   example: Billets récupérés avec succès
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Ticket'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/my', conditionalGeneralLimit, protect, cacheConfig.tickets, getUserTickets);

/**
 * @swagger
 * /api/tickets/{id}:
 *   get:
 *     summary: Récupérer un billet spécifique
 *     description: Détails complets d'un billet avec QR code (propriétaire ou admin uniquement)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TicketId'
 *     responses:
 *       200:
 *         description: Billet récupéré avec succès
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
 *                   example: Billet récupéré avec succès
 *                 data:
 *                   $ref: '#/components/schemas/Ticket'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Non autorisé à consulter ce billet
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
 *                   example: Non autorisé à consulter ce billet
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', conditionalGeneralLimit, protect, cacheConfig.tickets, getTicketById);

/**
 * @swagger
 * /api/tickets/{id}/validate:
 *   put:
 *     summary: Valider un billet à l'entrée
 *     description: Marque un billet comme utilisé lors de l'entrée à l'événement (organisateurs et admins)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TicketId'
 *     responses:
 *       200:
 *         description: Billet validé avec succès
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
 *                   example: Billet validé avec succès
 *                 data:
 *                   $ref: '#/components/schemas/Ticket'
 *       400:
 *         description: Erreur de validation du billet
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
 *                   example: Ce billet a déjà été utilisé
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:id/validate', 
  conditionalGeneralLimit,
  invalidateTicketsCache,
  protect, 
  authorize('organisateur', 'administrateur'), 
  validateTicket
);

/**
 * @swagger
 * /api/tickets/{id}/transfer:
 *   put:
 *     summary: Transférer un billet
 *     description: Transférer la propriété d'un billet à un autre utilisateur (minimum 24h avant l'événement)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/TicketId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newOwnerEmail
 *             properties:
 *               newOwnerEmail:
 *                 type: string
 *                 format: email
 *                 example: nouveau@proprietaire.com
 *                 description: Email du nouveau propriétaire du billet
 *     responses:
 *       200:
 *         description: Billet transféré avec succès
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
 *                   example: Billet transféré avec succès
 *                 data:
 *                   $ref: '#/components/schemas/Ticket'
 *       400:
 *         description: Erreur de transfert
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
 *                   example: Impossible de transférer un billet moins de 24h avant l'événement
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Non autorisé à transférer ce billet
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
 *                   example: Non autorisé à transférer ce billet
 *       404:
 *         description: Billet ou utilisateur destinataire non trouvé
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:id/transfer', 
  conditionalGeneralLimit,
  invalidateTicketsCache,
  protect,
  validate(transferTicketValidation), 
  transferTicket
);

export default router;
