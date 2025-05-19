import { Router } from 'express';
const router = Router();
import { protect, authorize } from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import paymentValidation from '../validations/paymentValidation.js';
import paymentController from '../controllers/paymentController.js';
const { createPayment, getPaymentById, refundPayment } = paymentController;
const  { createPaymentValidation, refundValidation } = paymentValidation;

router.route('/')
  .post(protect, validate(createPaymentValidation), createPayment);

router.route('/:id')
  .get(protect, getPaymentById);

router.route('/:id/refund')
  .put(
    protect,
    authorize('admin'),
    validate(refundValidation),
    refundPayment
  );

export default router;
