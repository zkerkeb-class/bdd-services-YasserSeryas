import TicketType from '../models/ticketType.js';
import Event from '../models/eventSchema.js';
import asyncHandler from 'express-async-handler';
import { ApiResponse } from '../utils/apiResponse.js';

// @desc    Récupérer tous les types de billets d'un événement
// @route   GET /api/ticket-types/event/:eventId
// @access  Public
export const getEventTicketTypes = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  // Vérifier que l'événement existe
  const event = await Event.findById(eventId);
  if (!event) {
    return ApiResponse.error(res, 'Événement non trouvé', 404);
  }

  const ticketTypes = await TicketType.find({ 
    event: eventId,
    isAvailable: true 
  }).sort({ price: 1 });

  // Ajouter des informations de disponibilité
  const ticketTypesWithAvailability = ticketTypes.map(type => ({
    ...type.toObject(),
    isOnSale: type.isOnSale(),
    soldOut: type.quantity === 0
  }));

  ApiResponse.success(res, ticketTypesWithAvailability, 'Types de billets récupérés avec succès');
});

// @desc    Créer un nouveau type de billet
// @route   POST /api/ticket-types
// @access  Private (Organisateur/Admin)
export const createTicketType = asyncHandler(async (req, res) => {
  const {
    eventId,
    name,
    description,
    price,
    quantity,
    maxPerPurchase,
    saleStartDate,
    saleEndDate
  } = req.body;

  // Vérifier que l'événement existe
  const event = await Event.findById(eventId);
  if (!event) {
    return ApiResponse.error(res, 'Événement non trouvé', 404);
  }

  // Vérifier que l'utilisateur est autorisé (organisateur de l'événement ou admin)
  if (
    req.user.role !== 'administrateur' && 
    event.organizer.toString() !== req.user.id
  ) {
    return ApiResponse.error(res, 'Non autorisé à créer des types de billets pour cet événement', 403);
  }

  // Créer le type de billet
  const ticketType = new TicketType({
    event: eventId,
    name,
    description,
    price,
    quantity,
    initialQuantity: quantity,
    maxPerPurchase: maxPerPurchase || 10,
    saleStartDate: saleStartDate || Date.now(),
    saleEndDate
  });

  await ticketType.save();

  // Ajouter le type de billet à l'événement
  event.ticketTypes.push(ticketType._id);
  await event.save();

  ApiResponse.success(res, ticketType, 'Type de billet créé avec succès', 201);
});

// @desc    Modifier un type de billet
// @route   PUT /api/ticket-types/:id
// @access  Private (Organisateur/Admin)
export const updateTicketType = asyncHandler(async (req, res) => {
  const ticketType = await TicketType.findById(req.params.id).populate('event', 'organizer');

  if (!ticketType) {
    return ApiResponse.error(res, 'Type de billet non trouvé', 404);
  }

  // Vérifier que l'utilisateur est autorisé
  if (
    req.user.role !== 'administrateur' && 
    ticketType.event.organizer.toString() !== req.user.id
  ) {
    return ApiResponse.error(res, 'Non autorisé à modifier ce type de billet', 403);
  }

  // Restrictions sur les modifications
  const {
    name,
    description,
    price,
    quantity,
    maxPerPurchase,
    isAvailable,
    saleStartDate,
    saleEndDate
  } = req.body;

  // Ne pas permettre de réduire la quantité en dessous des billets déjà vendus
  if (quantity !== undefined) {
    const soldTickets = ticketType.initialQuantity - ticketType.quantity;
    if (quantity < soldTickets) {
      return ApiResponse.error(res, 
        `Impossible de réduire la quantité en dessous des billets déjà vendus (${soldTickets})`, 
        400
      );
    }
    ticketType.quantity = quantity - soldTickets; // Ajuster la quantité restante
  }

  // Mettre à jour les champs autorisés
  if (name !== undefined) ticketType.name = name;
  if (description !== undefined) ticketType.description = description;
  if (price !== undefined) ticketType.price = price;
  if (maxPerPurchase !== undefined) ticketType.maxPerPurchase = maxPerPurchase;
  if (isAvailable !== undefined) ticketType.isAvailable = isAvailable;
  if (saleStartDate !== undefined) ticketType.saleStartDate = saleStartDate;
  if (saleEndDate !== undefined) ticketType.saleEndDate = saleEndDate;

  await ticketType.save();

  ApiResponse.success(res, ticketType, 'Type de billet modifié avec succès');
});

// @desc    Supprimer un type de billet
// @route   DELETE /api/ticket-types/:id
// @access  Private (Organisateur/Admin)
export const deleteTicketType = asyncHandler(async (req, res) => {
  const ticketType = await TicketType.findById(req.params.id).populate('event', 'organizer');

  if (!ticketType) {
    return ApiResponse.error(res, 'Type de billet non trouvé', 404);
  }

  // Vérifier que l'utilisateur est autorisé
  if (
    req.user.role !== 'administrateur' && 
    ticketType.event.organizer.toString() !== req.user.id
  ) {
    return ApiResponse.error(res, 'Non autorisé à supprimer ce type de billet', 403);
  }

  // Vérifier qu'aucun billet n'a été vendu
  const soldTickets = ticketType.initialQuantity - ticketType.quantity;
  if (soldTickets > 0) {
    return ApiResponse.error(res, 
      'Impossible de supprimer un type de billet ayant des ventes', 
      400
    );
  }

  // Retirer le type de billet de l'événement
  const event = await Event.findById(ticketType.event._id);
  event.ticketTypes.pull(ticketType._id);
  await event.save();

  // Supprimer le type de billet
  await TicketType.findByIdAndDelete(req.params.id);

  ApiResponse.success(res, null, 'Type de billet supprimé avec succès');
});
