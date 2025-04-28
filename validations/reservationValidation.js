import Joi from 'joi';

export const createReservationValidation = Joi.object({
  eventId: Joi.string().required(),
  ticketTypeId: Joi.string().required(),
  quantity: Joi.number().integer().min(1).required(),
  promoCode: Joi.string()
});
