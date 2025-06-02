import Notification from '../models/notification.js';
class NotificationController {
  // Créer une nouvelle notification
  async createNotification(req, res) {
    try {
      console.log('📥 Réception d\'une demande de création de notification:', req.body);
      
      const {
        type,
        recipient,
        subject,
        content,
        template,
        templateData,
        priority,
        scheduledFor,
        metadata
      } = req.body;

      // Validation basique
      if (!type || !recipient || !content || !template) {
        return res.status(400).json({
          success: false,
          message: 'Champs requis manquants: type, recipient, content, template'
        });
      }

      // Créer la notification
      const notification = new Notification({
        type,
        recipient,
        subject,
        content,
        template,
        templateData: templateData || {},
        priority: priority || 'normal',
        scheduledFor: scheduledFor || new Date(),
        metadata: metadata || {}
      });

      const savedNotification = await notification.save();
      
      console.log('✅ Notification créée avec succès:', savedNotification._id);

      res.status(201).json({
        success: true,
        message: 'Notification créée avec succès',
        data: {
          id: savedNotification._id,
          type: savedNotification.type,
          recipient: savedNotification.recipient,
          status: savedNotification.status,
          createdAt: savedNotification.createdAt
        }
      });

    } catch (error) {
      console.error('❌ Erreur lors de la création de la notification:', error);
      
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Récupérer toutes les notifications
  async getAllNotifications(req, res) {
    try {
      const {
        status,
        type,
        page = 1,
        limit = 10,
        userId
      } = req.query;

      // Construire le filtre
      const filter = {};
      if (status) filter.status = status;
      if (type) filter.type = type;
      if (userId) filter['metadata.userId'] = userId;

      // Pagination
      const skip = (page - 1) * limit;

      const notifications = await find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Notification.countDocuments(filter);

      res.json({
        success: true,
        data: notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error('❌ Erreur lors de la récupération des notifications:', error);
      
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Mettre à jour le statut d'une notification
  async updateNotificationStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, failureReason, sentAt } = req.body;

      const notification = await findById(id);
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification non trouvée'
        });
      }

      // Mettre à jour les champs
      if (status) notification.status = status;
      if (failureReason) notification.failureReason = failureReason;
      if (sentAt) notification.sentAt = new Date(sentAt);
      if (status === 'failed') notification.retryCount += 1;

      await notification.save();

      res.json({
        success: true,
        message: 'Statut de la notification mis à jour',
        data: notification
      });

    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour:', error);
      
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
}

export default new NotificationController();
