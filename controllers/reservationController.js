import Reservation from '../models/reservationSchema.js';
import Ticket from '../models/ticket.js';
import TicketType from '../models/ticketType.js';
import Event from '../models/eventSchema.js';
import asyncHandler from 'express-async-handler';

// @desc    Créer une nouvelle réservation
// @route   POST /api/reservations
// @access  Private
export const createReservation = asyncHandler(async (req, res) => {
  const { eventId, ticketTypeId, quantity } = req.body;
  
  // Vérifier si l'événement existe
  const event = await Event.findById(eventId);
  if (!event) {
    res.status(404);
    throw new Error('Événement non trouvé');
  }
  
  // Vérifier si le type de billet existe
  const ticketType = await TicketType.findById(ticketTypeId);
  if (!ticketType) {
    res.status(404);
    throw new Error('Type de billet non trouvé');
  }
  
  // Vérifier la disponibilité
  if (ticketType.quantity < quantity) {
    res.status(400);
    throw new Error('Quantité de billets insuffisante');
  }
  
  // Créer la réservation
  const reservation = new Reservation({
    user: req.user.id,
    event: eventId,
    totalAmount: ticketType.price * quantity
  });
  
  // Créer les billets
  const ticketPromises = [];
  for (let i = 0; i < quantity; i++) {
    const ticket = new Ticket({
      event: eventId,
      ticketType: ticketTypeId,
      owner: req.user.id,
      reservation: reservation._id,
      price: ticketType.price
    });
    ticketPromises.push(ticket.save());
  }
  
  const tickets = await Promise.all(ticketPromises);
  
  // Ajouter les billets à la réservation
  reservation.tickets = tickets.map(ticket => ticket._id);
  
  // Sauvegarder la réservation
  await reservation.save();
  
  // Mettre à jour la quantité de billets disponibles
  ticketType.quantity -= quantity;
  await ticketType.save();
  
  // Mettre à jour la capacité restante de l'événement
  await event.updateRemainingCapacity();
  
  res.status(201).json(reservation);
});

// @desc    Obtenir toutes les réservations d'un utilisateur
// @route   GET /api/reservations
// @access  Private
export const getMyReservations = asyncHandler(async (req, res) => {
  const reservations = await Reservation.find({ user: req.user.id })
    .populate('event', 'name startDate location')
    .populate('tickets');
  
  res.json(reservations);
});

// @desc    Obtenir une réservation par ID
// @route   GET /api/reservations/:id
// @access  Private
export const getReservationById = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id)
    .populate('event', 'name startDate location')
    .populate('tickets')
    .populate('payment');
  
  if (!reservation) {
    res.status(404);
    throw new Error('Réservation non trouvée');
  }
  
  // Vérifier si l'utilisateur est autorisé à voir cette réservation
  if (reservation.user.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(401);
    throw new Error('Non autorisé');
  }
  
  res.json(reservation);
});

// @desc    Annuler une réservation
// @route   PUT /api/reservations/:id/cancel
// @access  Private
export const cancelReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  
  if (!reservation) {
    res.status(404);
    throw new Error('Réservation non trouvée');
  }
  
  // Vérifier si l'utilisateur est autorisé à annuler cette réservation
  if (reservation.user.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(401);
    throw new Error('Non autorisé');
  }
  
  // Annuler la réservation
  await reservation.cancel();
  
  res.json({ message: 'Réservation annulée avec succès' });
});
// import Reservation from '../models/reservationSchema.js';
// import Event from '../models/eventSchema.js';
// import TicketType from '../models/ticketType.js';
// import Ticket from '../models/ticket.js';
// import mongoose from 'mongoose';

// export class ReservationService {
//   static async createReservation(userId, eventId, ticketTypeId, quantity) {
//     const session = await mongoose.startSession();
//     session.startTransaction();
    
//     try {
//       // Vérifications
//       const event = await Event.findById(eventId).session(session);
//       if (!event) {
//         throw new Error('Événement non trouvé');
//       }
      
//       const ticketType = await TicketType.findById(ticketTypeId).session(session);
//       if (!ticketType) {
//         throw new Error('Type de billet non trouvé');
//       }
      
//       if (ticketType.quantity < quantity) {
//         throw new Error('Quantité de billets insuffisante');
//       }
      
//       // Créer la réservation
//       const reservation = new Reservation({
//         user: userId,
//         event: eventId,
//         totalAmount: ticketType.price * quantity
//       });
      
//       await reservation.save({ session });
      
//       // Créer les billets
//       const tickets = [];
//       for (let i = 0; i < quantity; i++) {
//         const ticket = new Ticket({
//           event: eventId,
//           ticketType: ticketTypeId,
//           owner: userId,
//           reservation: reservation._id,
//           price: ticketType.price
//         });
//         await ticket.save({ session });
//         tickets.push(ticket);
//       }
      
//       // Mettre à jour les quantités
//       ticketType.quantity -= quantity;
//       await ticketType.save({ session });
      
//       await event.updateRemainingCapacity();
      
//       await session.commitTransaction();
      
//       return { reservation, tickets };
      
//     } catch (error) {
//       await session.abortTransaction();
//       throw error;
//     } finally {
//       session.endSession();
//     }
//   }
// }