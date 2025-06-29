import Joi from 'joi';

const createPaymentValidation = Joi.object({
  reservationId: Joi.string().required(),
  paymentMethod: Joi.string().valid('carte_credit', 'paypal', 'virement', 'especes', 'autre').required(),
  transactionId: Joi.string().required(),
  paymentDetails: Joi.object({
    cardLast4: Joi.string(),
    cardBrand: Joi.string(),
    paypalEmail: Joi.string().email(),
    bankAccount: Joi.string()
  })
});

const refundValidation = Joi.object({
  amount: Joi.number().positive().required(),
  reason: Joi.string().required()
});

export default {
  createPaymentValidation,
  refundValidation
};
