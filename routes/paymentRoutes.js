import { Router } from 'express';
const router = Router();
import { protect, authorize } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import paymentValidation from '../validations/paymentValidation.js';
import paymentController from '../controllers/paymentController.js';
import { getPaymentLimiter } from '../middlewares/rateLimiter.js';
const { createPayment, getPaymentById, refundPayment } = paymentController;
const  { createPaymentValidation, refundValidation } = paymentValidation;

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Créer un paiement
 *     description: Traite un paiement pour une réservation
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reservationId
 *               - amount
 *               - paymentMethod
 *             properties:
 *               reservationId:
 *                 type: string
 *                 example: 64f7a1b2c3d4e5f6a7b8c9d0
 *                 description: ID de la réservation à payer
 *               amount:
 *                 type: number
 *                 minimum: 0
 *                 example: 300
 *                 description: Montant du paiement
 *               currency:
 *                 type: string
 *                 default: EUR
 *                 example: EUR
 *               paymentMethod:
 *                 type: string
 *                 enum: [carte_credit, paypal, virement, especes, autre]
 *                 example: carte_credit
 *               paymentDetails:
 *                 type: object
 *                 properties:
 *                   cardLast4:
 *                     type: string
 *                     example: "1234"
 *                   cardBrand:
 *                     type: string
 *                     example: "visa"
 *                   holderName:
 *                     type: string
 *                     example: "John Doe"
 *     responses:
 *       201:
 *         description: Paiement créé avec succès
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
 *                   example: Paiement traité avec succès
 *                 data:
 *                   $ref: '#/components/schemas/Payment'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Réservation non trouvée
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.route('/')
  .post(getPaymentLimiter, protect, validate(createPaymentValidation), createPayment);

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Récupérer un paiement
 *     description: Détails d'un paiement spécifique (propriétaire ou admin uniquement)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PaymentId'
 *     responses:
 *       200:
 *         description: Paiement récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Non autorisé à consulter ce paiement
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
  .get(protect, getPaymentById);

/**
 * @swagger
 * /api/payments/{id}/refund:
 *   put:
 *     summary: Rembourser un paiement
 *     description: Traite un remboursement total ou partiel (administrateurs uniquement)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PaymentId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - reason
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0
 *                 example: 150
 *                 description: Montant à rembourser
 *               reason:
 *                 type: string
 *                 example: Événement annulé
 *                 description: Raison du remboursement
 *     responses:
 *       200:
 *         description: Remboursement traité avec succès
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
 *                   example: Remboursement traité avec succès
 *                 data:
 *                   $ref: '#/components/schemas/Payment'
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
router.route('/:id/refund')
  .put(
    protect,
    authorize('admin'),
    validate(refundValidation),
    refundPayment
  );

export default router;
