import { Router } from 'express';
const router = Router();
import { protect, authorize } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import paymentValidation from '../validations/paymentValidation.js';
import paymentController from '../controllers/paymentController.js';
import { conditionalPaymentLimit } from '../middlewares/conditionalRateLimit.js';
import { cacheConfig } from '../middlewares/redisCache.js';
import { invalidateGenericCache } from '../middlewares/cacheInvalidation.js';

const { createPayment, getAllPayments, getPaymentById, refundPayment, updatePayment } = paymentController;
const { createPaymentValidation, refundValidation } = paymentValidation;

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Récupérer tous les paiements
 *     description: Liste des paiements (admin voit tous, utilisateur voit ses propres paiements)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Numéro de page
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Nombre d'éléments par page
 *     responses:
 *       200:
 *         description: Liste des paiements récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Payment'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     totalPayments:
 *                       type: integer
 *                       example: 47
 *                     hasNext:
 *                       type: boolean
 *                       example: true
 *                     hasPrev:
 *                       type: boolean
 *                       example: false
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
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
  .get(protect, cacheConfig.payments, getAllPayments)
  .post(conditionalPaymentLimit, invalidateGenericCache(['payments'], ['api:GET:/api/payments*']), protect, validate(createPaymentValidation), createPayment);

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
  .get(protect, cacheConfig.payments, getPaymentById);

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
    invalidateGenericCache(['payments'], ['api:GET:/api/payments*']),
    protect,
    authorize('admin'),
    validate(refundValidation),
    refundPayment
  );
// PUT /api/payments/:id
router.put('/:id', protect, updatePayment);

export default router;
