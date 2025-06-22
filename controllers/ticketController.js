import Ticket from '../models/ticket.js';
import asyncHandler from 'express-async-handler';
import { ApiResponse } from '../utils/apiResponse.js';

// @desc    Récupérer tous les billets de l'utilisateur connecté
// @route   GET /api/tickets/my
// @access  Private
export const getUserTickets = asyncHandler(async (req, res) => {
  const tickets = await Ticket.find({ owner: req.user.id })
    .populate('event', 'name startDate location')
    .populate('ticketType', 'name price')
    .populate('reservation', 'reservationNumber status')
    .sort({ createdAt: -1 });

  ApiResponse.success(res, tickets, 'Billets récupérés avec succès');
});

// @desc    Récupérer un billet spécifique par ID
// @route   GET /api/tickets/:id
// @access  Private
export const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id)
    .populate('event', 'name startDate endDate location')
    .populate('ticketType', 'name description price')
    .populate('owner', 'firstName lastName email')
    .populate('reservation', 'reservationNumber status');

  if (!ticket) {
    return ApiResponse.error(res, 'Billet non trouvé', 404);
  }

  // Vérifier que l'utilisateur est autorisé à voir ce billet
  if (ticket.owner._id.toString() !== req.user.id && req.user.role !== 'administrateur') {
    return ApiResponse.error(res, 'Non autorisé à consulter ce billet', 403);
  }

  ApiResponse.success(res, ticket, 'Billet récupéré avec succès');
});

// @desc    Valider un billet à l'entrée de l'événement
// @route   PUT /api/tickets/:id/validate
// @access  Private (Organisateur/Admin)
export const validateTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id)
    .populate('event', 'organizer startDate endDate')
    .populate('reservation', 'status');

  if (!ticket) {
    return ApiResponse.error(res, 'Billet non trouvé', 404);
  }

  // Vérifier que l'utilisateur est autorisé (organisateur de l'événement ou admin)
  if (
    req.user.role !== 'administrateur' && 
    ticket.event.organizer.toString() !== req.user.id
  ) {
    return ApiResponse.error(res, 'Non autorisé à valider ce billet', 403);
  }

  // Vérifier que la réservation est confirmée
  if (ticket.reservation.status !== 'confirmée') {
    return ApiResponse.error(res, 'La réservation n\'est pas confirmée', 400);
  }

  // Vérifier que le billet n'est pas déjà utilisé
  if (ticket.isUsed) {
    return ApiResponse.error(res, 'Ce billet a déjà été utilisé', 400);
  }

  // Vérifier que l'événement a commencé
  const now = new Date();
  if (now < ticket.event.startDate) {
    return ApiResponse.error(res, 'L\'événement n\'a pas encore commencé', 400);
  }

  // Vérifier que l'événement n'est pas terminé
  if (now > ticket.event.endDate) {
    return ApiResponse.error(res, 'L\'événement est terminé', 400);
  }

  // Marquer le billet comme utilisé
  await ticket.markAsUsed();

  ApiResponse.success(res, ticket, 'Billet validé avec succès');
});

// @desc    Transférer un billet à un autre utilisateur
// @route   PUT /api/tickets/:id/transfer
// @access  Private
export const transferTicket = asyncHandler(async (req, res) => {
  const { newOwnerEmail } = req.body;

  if (!newOwnerEmail) {
    return ApiResponse.error(res, 'Email du nouveau propriétaire requis', 400);
  }

  const ticket = await Ticket.findById(req.params.id)
    .populate('event', 'startDate')
    .populate('reservation', 'status');

  if (!ticket) {
    return ApiResponse.error(res, 'Billet non trouvé', 404);
  }

  // Vérifier que l'utilisateur est le propriétaire du billet
  if (ticket.owner.toString() !== req.user.id) {
    return ApiResponse.error(res, 'Non autorisé à transférer ce billet', 403);
  }

  // Vérifier que le billet est transférable
  if (!ticket.isTransferable) {
    return ApiResponse.error(res, 'Ce billet n\'est pas transférable', 400);
  }

  // Vérifier que le billet n'est pas utilisé
  if (ticket.isUsed) {
    return ApiResponse.error(res, 'Impossible de transférer un billet déjà utilisé', 400);
  }

  // Vérifier que la réservation est confirmée
  if (ticket.reservation.status !== 'confirmée') {
    return ApiResponse.error(res, 'Impossible de transférer un billet non confirmé', 400);
  }

  // Vérifier qu'il reste au moins 24h avant l'événement
  const now = new Date();
  const eventStart = new Date(ticket.event.startDate);
  const timeDiff = eventStart.getTime() - now.getTime();
  const hoursDiff = timeDiff / (1000 * 3600);

  if (hoursDiff < 24) {
    return ApiResponse.error(res, 'Impossible de transférer un billet moins de 24h avant l\'événement', 400);
  }
  // Trouver le nouveau propriétaire
  const User = (await import('../models/userSchema.js')).default;
  const newOwner = await User.findOne({ email: newOwnerEmail });

  if (!newOwner) {
    return ApiResponse.error(res, 'Utilisateur destinataire non trouvé', 404);
  }

  // Effectuer le transfert
  await ticket.transferTo(newOwner._id);

  ApiResponse.success(res, ticket, 'Billet transféré avec succès');
});
