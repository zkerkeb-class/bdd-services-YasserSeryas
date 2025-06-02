import { Router } from 'express';
const router = Router();
import NotificationController from '../controllers/notificationController.js';

// POST /api/notifications - Créer une nouvelle notification
router.post('/', NotificationController.createNotification);

// GET /api/notifications - Récupérer toutes les notifications
router.get('/', NotificationController.getAllNotifications);

// PUT /api/notifications/:id/status - Mettre à jour le statut
router.put('/:id/status', NotificationController.updateNotificationStatus);

export default router;
