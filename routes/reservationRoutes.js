import express from 'express';
import { protect } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import { createReservationValidation } from '../validations/reservationValidation.js';
import { conditionalReservationLimit } from '../middlewares/conditionalRateLimit.js';
import { 
  createReservation, 
  getMyReservations, 
  getReservationById, 
  cancelReservation 
} from '../controllers/reservationController.js';

const router = express.Router();

/**
 * @swagger
 * /api/reservations:
 *   get:
 *     summary: Récupérer mes réservations
 *     description: Liste toutes les réservations de l'utilisateur connecté avec détails des événements et billets
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Réservations récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Reservation'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 *   post:
 *     summary: Créer une nouvelle réservation
 *     description: Crée une réservation avec génération automatique de billets
 *     tags: [Reservations]
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
 *               - ticketTypeId
 *               - quantity
 *             properties:
 *               eventId:
 *                 type: string
 *                 example: 64f7a1b2c3d4e5f6a7b8c9d0
 *                 description: ID de l'événement
 *               ticketTypeId:
 *                 type: string
 *                 example: 64f7a1b2c3d4e5f6a7b8c9d1
 *                 description: ID du type de billet
 *               quantity:
 *                 type: number
 *                 minimum: 1
 *                 example: 2
 *                 description: Nombre de billets à réserver
 *               promoCode:
 *                 type: string
 *                 example: SUMMER2025
 *                 description: Code promotionnel optionnel
 *     responses:
 *       201:
 *         description: Réservation créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reservation'
 *       400:
 *         description: Erreur de validation ou de disponibilité
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
 *                   example: Quantité de billets insuffisante
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Événement ou type de billet non trouvé
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.route('/')
  .get(protect, getMyReservations)
  .post(conditionalReservationLimit, protect, validate(createReservationValidation), createReservation);

/**
 * @swagger
 * /api/reservations/{id}:
 *   get:
 *     summary: Récupérer une réservation spécifique
 *     description: Détails complets d'une réservation avec événement, billets et paiement
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ReservationId'
 *     responses:
 *       200:
 *         description: Réservation récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Reservation'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Non autorisé à consulter cette réservation
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
 *                   example: Non autorisé
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.route('/:id')
  .get(protect, getReservationById);

/**
 * @swagger
 * /api/reservations/{id}/cancel:
 *   put:
 *     summary: Annuler une réservation
 *     description: Annule une réservation confirmée et libère les billets
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ReservationId'
 *     responses:
 *       200:
 *         description: Réservation annulée avec succès
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
 *                   example: Réservation annulée avec succès
 *       400:
 *         description: Impossible d'annuler cette réservation
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
 *                   example: Impossible d'annuler une réservation avec le statut annulée
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Non autorisé à annuler cette réservation
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.route('/:id/cancel')
  .put(protect, cancelReservation);

export default router;
