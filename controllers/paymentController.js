import Payment, { findById } from '../models/payment.js';
import { findById as _findById } from '../models/reservationSchema.js';
import asyncHandler from 'express-async-handler';

// @desc    Créer un nouveau paiement
// @route   POST /api/payments
// @access  Private
const createPayment = asyncHandler(async (req, res) => {
  const { reservationId, paymentMethod, transactionId } = req.body;
  
  // Vérifier si la réservation existe
  const reservation = await _findById(reservationId);
  if (!reservation) {
    res.status(404);
    throw new Error('Réservation non trouvée');
  }
  
  // Vérifier si l'utilisateur est autorisé
  if (reservation.user.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(401);
    throw new Error('Non autorisé');
  }
  
  // Vérifier si un paiement existe déjà
  if (reservation.payment) {
    res.status(400);
    throw new Error('Cette réservation a déjà un paiement associé');
  }
  
  // Créer le paiement
  const payment = new Payment({
    reservation: reservationId,
    amount: reservation.totalAmount,
    paymentMethod,
    transactionId
  });
  
  // Marquer le paiement comme complété
  await payment.markAsCompleted(transactionId);
  
  // Mettre à jour la réservation avec la référence au paiement
  reservation.payment = payment._id;
  await reservation.save();
  
  res.status(201).json(payment);
});

// @desc    Obtenir un paiement par ID
// @route   GET /api/payments/:id
// @access  Private
const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await findById(req.params.id)
    .populate('reservation');
  
  if (!payment) {
    res.status(404);
    throw new Error('Paiement non trouvé');
  }
  
  // Vérifier si l'utilisateur est autorisé
  const reservation = await _findById(payment.reservation);
  if (reservation.user.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(401);
    throw new Error('Non autorisé');
  }
  
  res.json(payment);
});

// @desc    Rembourser un paiement
// @route   PUT /api/payments/:id/refund
// @access  Private/Admin
const refundPayment = asyncHandler(async (req, res) => {
  const { amount, reason } = req.body;
  
  const payment = await findById(req.params.id);
  if (!payment) {
    res.status(404);
    throw new Error('Paiement non trouvé');
  }
  
  // Effectuer le remboursement
  await payment.refund(amount, reason);
  
  res.json(payment);
});

export default {
  createPayment,
  getPaymentById,
  refundPayment
};
