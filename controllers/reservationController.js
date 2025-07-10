import Reservation from '../models/reservationSchema.js';
import Ticket from '../models/ticket.js';
import TicketType from '../models/ticketType.js';
import Event from '../models/eventSchema.js';
import asyncHandler from 'express-async-handler';
import crypto from 'crypto';
import  sendNotification  from '../utils/notificationService.js';
// Fonction utilitaire pour générer un numéro de billet unique
const generateTicketNumber = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `TKT-${timestamp}-${randomStr}`;
};

// Fonction utilitaire pour générer un QR code unique
const generateQRCode = () => {
  return crypto.randomBytes(16).toString('hex');
};

// @desc    Créer une nouvelle réservation
// @route   POST /api/reservations
// @access  Private
export const createReservation = asyncHandler(async (req, res) => {
  const { eventId, ticketTypeId, quantity } = req.body;
  
  // Validation des données d'entrée
  if (!eventId || !ticketTypeId || !quantity) {
    res.status(400);
    throw new Error('Données manquantes: eventId, ticketTypeId et quantity sont requis');
  }

  if (quantity <= 0 || quantity > 50) {
    res.status(400);
    throw new Error('La quantité doit être entre 1 et 50');
  }
  
  // Vérifier si l'événement existe
  const event = await Event.findById(eventId);
  if (!event) {
    res.status(404);
    throw new Error('Événement non trouvé');
  }

  // Vérifier si l'événement est encore actif
  if (new Date() > new Date(event.startDate)) {
    res.status(400);
    throw new Error('Impossible de réserver pour un événement passé');
  }
  
  // Vérifier si le type de billet existe et appartient à cet événement
  const ticketType = await TicketType.findById(ticketTypeId);
  if (!ticketType) {
    res.status(404);
    throw new Error('Type de billet non trouvé');
  }

  if (ticketType.event.toString() !== eventId) {
    res.status(400);
    throw new Error('Ce type de billet n\'appartient pas à cet événement');
  }

  if (!ticketType.isAvailable) {
    res.status(400);
    throw new Error('Ce type de billet n\'est plus disponible');
  }
  
  // Vérifier la disponibilité
  if (ticketType.quantity < quantity) {
    res.status(400);
    throw new Error(`Quantité insuffisante. Seulement ${ticketType.quantity} billets disponibles`);
  }

  // Vérifier la limite par achat
  if (quantity > ticketType.maxPerPurchase) {
    res.status(400);
    throw new Error(`Maximum ${ticketType.maxPerPurchase} billets par achat pour ce type`);
  }

  let reservation;
  try {
    // Générer un numéro de réservation unique
    const reservationNumber = `RES-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    
    // Créer la réservation
    reservation = new Reservation({
      user: req.user.id,
      event: eventId,
      totalAmount: ticketType.price * quantity,
      reservationNumber,
      status: 'confirmée' // ou 'pending' selon votre logique métier
    });

    // Sauvegarder la réservation d'abord pour obtenir l'ID
    await reservation.save();
    
    // Créer les billets avec tous les champs requis
    const ticketPromises = [];
    for (let i = 0; i < quantity; i++) {
      const ticket = new Ticket({
        event: eventId,
        ticketType: ticketTypeId,
        owner: req.user.id,
        originalOwner: req.user.id, // Propriétaire original
        reservation: reservation._id,
        price: ticketType.price,
        ticketNumber: generateTicketNumber(), // Générer le numéro de billet
        qrCode: generateQRCode(), // Générer le QR code
        isUsed: false,
        isTransferable: true, // Par défaut transférable
        purchaseDate: new Date()
      });
      ticketPromises.push(ticket.save());
    }
    
    const tickets = await Promise.all(ticketPromises);
    
    // Ajouter les billets à la réservation
    reservation.tickets = tickets.map(ticket => ticket._id);
    await reservation.save();
    
    // Mettre à jour la quantité de billets disponibles
    ticketType.quantity -= quantity;
    await ticketType.save();
    
    // Mettre à jour la capacité restante de l'événement
    if (event.updateRemainingCapacity) {
      await event.updateRemainingCapacity();
    }

    // Populate la réservation pour la réponse
    const populatedReservation = await Reservation.findById(reservation._id)
      .populate('event', 'title startDate location')
      .populate('tickets')
      .populate('user', 'firstName lastName email');
    try {
      const notificationData = {
        type: "email",
        recipient: populatedReservation.user.email,
        subject: "Confirmation de réservation",
        template: "reservation-confirmation",
        templateData: {
          userName: `${populatedReservation.user.firstName} ${populatedReservation.user.lastName}`,
          eventName: populatedReservation.event.title,
          eventDate: new Date(populatedReservation.event.startDate).toISOString().split('T')[0],
          reservationNumber: populatedReservation.reservationNumber,
          quantity: quantity,
          totalAmount: populatedReservation.totalAmount,
          ticketNumbers: tickets.map(t => t.ticketNumber).join(', ')
        },
        priority: "high",
        metadata: {
          userId: populatedReservation.user._id.toString(),
          eventId: populatedReservation.event._id.toString(),
          reservationId: populatedReservation._id.toString()
        }
      };

      await sendNotification(notificationData);      console.log('Notification envoyée avec succès pour la réservation:', reservationNumber);
    } catch (notificationError) {
      // Log l'erreur mais ne fait pas échouer la réservation
      console.error('Erreur lors de l\'envoi de la notification:', notificationError);
      // Optionnel : vous pourriez stocker cette erreur dans une queue pour retry plus tard
    }

    res.status(201).json({
      success: true,
      message: 'Réservation créée avec succès',
      data: populatedReservation,
      summary: {
        reservationNumber: reservation.reservationNumber,
        eventTitle: event.title,
        ticketType: ticketType.name,
        quantity: quantity,
        totalAmount: reservation.totalAmount,
        ticketNumbers: tickets.map(t => t.ticketNumber)
      }
    });

  } catch (error) {
    // En cas d'erreur, supprimer la réservation partiellement créée si elle existe
    if (reservation && reservation._id) {
      await Reservation.findByIdAndDelete(reservation._id);
    }
    
    console.error('Erreur lors de la création de la réservation:', error);
    res.status(500);
    throw new Error('Erreur lors de la création de la réservation: ' + error.message);
  }
});

// @desc    Obtenir toutes les réservations d'un utilisateur
// @route   GET /api/reservations/my
// @access  Private
export const getMyReservations = asyncHandler(async (req, res) => {
  const reservations = await Reservation.find({ user: req.user.id })
    .populate('event', 'title startDate location totalCapacity')
    .populate({
      path: 'tickets',
      populate: {
        path: 'ticketType',
        select: 'name description'
      }
    })
    .sort({ createdAt: -1 });
  
  res.json({
    success: true,
    count: reservations.length,
    data: reservations
  });
});

// @desc    Obtenir une réservation par ID
// @route   GET /api/reservations/:id
// @access  Private
export const getReservationById = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id)
    .populate('event', 'title description startDate endDate location')
    .populate({
      path: 'tickets',
      populate: {
        path: 'ticketType',
        select: 'name description price currency'
      }
    })
    .populate('user', 'firstName lastName email')
    .populate('payment');
  
  if (!reservation) {
    res.status(404);
    throw new Error('Réservation non trouvée');
  }
  
  // Vérifier si l'utilisateur est autorisé à voir cette réservation
  if (reservation.user._id.toString() !== req.user.id && !['organisateur', 'administrateur'].includes(req.user.role)) {
    res.status(403);
    throw new Error('Non autorisé à accéder à cette réservation');
  }
  
  res.json({
    success: true,
    data: reservation
  });
});

// @desc    Annuler une réservation
// @route   PUT /api/reservations/:id/cancel
// @access  Private
export const cancelReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id)
    .populate('event')
    .populate('tickets');
  
  if (!reservation) {
    res.status(404);
    throw new Error('Réservation non trouvée');
  }
  
  // Vérifier si l'utilisateur est autorisé à annuler cette réservation
  if (reservation.user.toString() !== req.user.id && !['organisateur', 'administrateur'].includes(req.user.role)) {
    res.status(403);
    throw new Error('Non autorisé à annuler cette réservation');
  }

  // Vérifier si la réservation peut être annulée
  if (reservation.status === 'Annulée') {
    res.status(400);
    throw new Error('Cette réservation est déjà annulée');
  }

  // Vérifier si l'événement n'est pas déjà passé
  if (new Date() > new Date(reservation.event.startDate)) {
    res.status(400);
    throw new Error('Impossible d\'annuler une réservation pour un événement passé');
  }

  try {
    // Remettre les billets en stock
    const ticketType = await TicketType.findById(reservation.tickets[0].ticketType);
    if (ticketType) {
      ticketType.quantity += reservation.tickets.length;
      await ticketType.save();
    }

    // Marquer les billets comme annulés
    await Ticket.updateMany(
      { reservation: reservation._id },
      { isUsed: true, status: 'annulée' }
    );

    // Mettre à jour le statut de la réservation
    reservation.status = 'annulée';
    reservation.cancelledAt = new Date();
    await reservation.save();

    // Mettre à jour la capacité de l'événement
    if (reservation.event.updateRemainingCapacity) {
      await reservation.event.updateRemainingCapacity();
    }
    
    res.json({
      success: true,
      message: 'Réservation annulée avec succès',
      data: {
        reservationId: reservation._id,
        reservationNumber: reservation.reservationNumber,
        cancelledAt: reservation.cancelledAt,
        refundAmount: reservation.totalAmount
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'annulation:', error);
    res.status(500);
    throw new Error('Erreur lors de l\'annulation de la réservation');
  }
});

// @desc    Obtenir les statistiques de réservations (pour organisateurs/admins)
// @route   GET /api/reservations/stats
// @access  Private (organisateur/admin)
export const getReservationStats = asyncHandler(async (req, res) => {
  if (!['organisateur', 'administrateur'].includes(req.user.role)) {
    res.status(403);
    throw new Error('Accès non autorisé');
  }

  const stats = await Reservation.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' }
      }
    }
  ]);

  const totalReservations = await Reservation.countDocuments();
  const totalRevenue = await Reservation.aggregate([
    { $match: { status: 'confirmée' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);

  res.json({
    success: true,
    data: {
      totalReservations,
      totalRevenue: totalRevenue[0]?.total || 0,
      statusBreakdown: stats
    }
  });
});