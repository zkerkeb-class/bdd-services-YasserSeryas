import { Router } from 'express';
const router = Router();
import NotificationController from '../controllers/notificationController.js';
import { conditionalNotificationLimit } from '../middlewares/conditionalRateLimit.js';
import { cacheConfig } from '../middlewares/redisCache.js';
import { invalidateGenericCache } from '../middlewares/cacheInvalidation.js';

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Créer une notification
 *     description: Crée et envoie une nouvelle notification (email, SMS ou push)
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - recipient
 *               - content
 *               - template
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [email, sms, push]
 *                 example: email
 *               recipient:
 *                 type: string
 *                 example: user@example.com
 *                 description: Email, numéro de téléphone ou device token selon le type
 *               subject:
 *                 type: string
 *                 example: Confirmation de réservation
 *                 description: Requis pour les emails
 *               content:
 *                 type: string
 *                 example: Votre réservation a été confirmée
 *               template:
 *                 type: string
 *                 example: reservation_confirmation
 *               templateData:
 *                 type: object
 *                 example: { "userName": "John", "eventName": "Concert de Jazz" }
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *                 default: normal
 *                 example: normal
 *               scheduledFor:
 *                 type: string
 *                 format: date-time
 *                 description: Date d'envoi programmée (optionnel)
 *     responses:
 *       201:
 *         description: Notification créée avec succès
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
 *                   example: Notification créée avec succès
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 *   get:
 *     summary: Récupérer toutes les notifications
 *     description: Liste toutes les notifications du système avec filtres possibles
 *     tags: [Notifications]
 *     parameters:
 *       - name: status
 *         in: query
 *         description: Filtrer par statut
 *         schema:
 *           type: string
 *           enum: [pending, sent, failed, delivered]
 *       - name: type
 *         in: query
 *         description: Filtrer par type
 *         schema:
 *           type: string
 *           enum: [email, sms, push]
 *       - name: priority
 *         in: query
 *         description: Filtrer par priorité
 *         schema:
 *           type: string
 *           enum: [low, normal, high, urgent]
 *     responses:
 *       200:
 *         description: Notifications récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', conditionalNotificationLimit, invalidateGenericCache(['notifications'], ['api:GET:/api/notifications*']), NotificationController.createNotification);
router.get('/', conditionalNotificationLimit, cacheConfig.notifications, NotificationController.getAllNotifications);

/**
 * @swagger
 * /api/notifications/{id}/status:
 *   put:
 *     summary: Mettre à jour le statut d'une notification
 *     description: Met à jour le statut d'une notification (sent, failed, delivered)
 *     tags: [Notifications]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID de la notification
 *         schema:
 *           type: string
 *           example: 64f7a1b2c3d4e5f6a7b8c9d0
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, sent, failed, delivered]
 *                 example: sent
 *               failureReason:
 *                 type: string
 *                 example: Invalid email address
 *                 description: Requis si status = failed
 *               sentAt:
 *                 type: string
 *                 format: date-time
 *                 description: Date d'envoi (auto si non fournie)
 *     responses:
 *       200:
 *         description: Statut mis à jour avec succès
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
 *                   example: Statut de notification mis à jour
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:id/status', conditionalNotificationLimit, invalidateGenericCache(['notifications'], ['api:GET:/api/notifications*']), NotificationController.updateNotificationStatus);

export default router;
