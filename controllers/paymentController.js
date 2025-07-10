import Payment from '../models/payment.js';
import Reservation from '../models/reservationSchema.js'; // Import du modèle complet
import asyncHandler from 'express-async-handler';

// @desc    Créer un nouveau paiement
// @route   POST /api/payments
// @access  Private
const createPayment = asyncHandler(async (req, res) => {
  const { reservationId, paymentMethod, transactionId,status } = req.body;
  
  // Vérifier si la réservation existe
  const reservation = await Reservation.findById(reservationId);
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
    transactionId,
    status
  });
  
  // Marquer le paiement comme complété
  await payment.markAsCompleted(transactionId);
  
  // Mettre à jour la réservation avec la référence au paiement
  reservation.payment = payment._id;
  await reservation.save();
  
  res.status(201).json(payment);
});

// @desc    Obtenir tous les paiements
// @route   GET /api/payments
// @access  Private
const getAllPayments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  let query = {};
  let payments;
  let total;
  
  if (req.user.role === 'admin') {
    // Admin peut voir tous les paiements
    payments = await Payment.find(query)
      .populate({
        path: 'reservation',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    total = await Payment.countDocuments(query);
  } else {
    // Utilisateur normal ne peut voir que ses propres paiements
    const userReservations = await Reservation.find({ user: req.user.id }).select('_id');
    const reservationIds = userReservations.map(r => r._id);
    
    query.reservation = { $in: reservationIds };
    
    payments = await Payment.find(query)
      .populate('reservation')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    total = await Payment.countDocuments(query);
  }
  
  res.json({
    payments,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPayments: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  });
});

// @desc    Obtenir un paiement par ID
// @route   GET /api/payments/:id
// @access  Private
const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate('reservation');
  
  if (!payment) {
    res.status(404);
    throw new Error('Paiement non trouvé');
  }
  
  // Vérifier si l'utilisateur est autorisé
  const reservation = await Reservation.findById(payment.reservation);
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
  
  const payment = await Payment.findById(req.params.id);
  if (!payment) {
    res.status(404);
    throw new Error('Paiement non trouvé');
  }
  
  // Effectuer le remboursement
  await payment.refund(amount, reason);
  
  res.json(payment);
});

// @desc    Mettre à jour un paiement
// @route   PUT /api/payments/:id
// @access  Private
const updatePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  
  // Vérifier si le paiement existe
  const payment = await Payment.findById(id).populate('reservation');
  if (!payment) {
    res.status(404);
    throw new Error('Paiement non trouvé');
  }
  
  // Vérifier si l'utilisateur est autorisé
  const reservation = await Reservation.findById(payment.reservation._id);
  if (reservation.user.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(401);
    throw new Error('Non autorisé');
  }
  
  // Vérifier si le paiement peut être modifié
  if (payment.status === 'refunded') {
    res.status(400);
    throw new Error('Impossible de modifier un paiement remboursé');
  }
  
  // Champs autorisés à la mise à jour
  const allowedFields = ['paymentMethod', 'transactionId', 'status', 'notes'];
  const filteredUpdateData = {};
  
  Object.keys(updateData).forEach(key => {
    if (allowedFields.includes(key)) {
      filteredUpdateData[key] = updateData[key];
    }
  });
  
  // Empêcher la modification de certains champs sensibles
  if (updateData.amount && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Seuls les administrateurs peuvent modifier le montant');
  }
  
  if (updateData.amount && req.user.role === 'admin') {
    filteredUpdateData.amount = updateData.amount;
  }
  
  // Mettre à jour le paiement
  const updatedPayment = await Payment.findByIdAndUpdate(
    id,
    {
      ...filteredUpdateData,
      updatedAt: new Date()
    },
    {
      new: true,
      runValidators: true
    }
  ).populate('reservation');
  
  res.json({
    success: true,
    message: 'Paiement mis à jour avec succès',
    data: updatedPayment
  });
});

export default {
  createPayment,
  getAllPayments,
  getPaymentById,
  refundPayment,
  updatePayment
};
  