import express from 'express';
import { protect } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import { createReservationValidation } from '../validations/reservationValidation.js';
import { 
  createReservation, 
  getMyReservations, 
  getReservationById, 
  cancelReservation 
} from '../controllers/reservationController.js';

const router = express.Router();

router.route('/')
  .get(protect, getMyReservations)
  .post(protect, validate(createReservationValidation), createReservation);

router.route('/:id')
  .get(protect, getReservationById);

router.route('/:id/cancel')
  .put(protect, cancelReservation);

export default router;
