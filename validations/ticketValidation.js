import Joi from 'joi';

// Validation pour le transfert de billet
export const transferTicketValidation = Joi.object({
  newOwnerEmail: Joi.string().email().required()
});

// Validation pour la création de type de billet
export const createTicketTypeValidation = Joi.object({
  eventId: Joi.string().required(),
  name: Joi.string().required().trim(),
  description: Joi.string(),
  price: Joi.number().min(0).required(),
  quantity: Joi.number().integer().min(1).required(),
  maxPerPurchase: Joi.number().integer().min(1).max(50).default(10),
  saleStartDate: Joi.date().default(() => new Date()),
  saleEndDate: Joi.date().greater(Joi.ref('saleStartDate'))
});

// Validation pour la modification de type de billet
export const updateTicketTypeValidation = Joi.object({
  name: Joi.string().trim(),
  description: Joi.string(),
  price: Joi.number().min(0),
  quantity: Joi.number().integer().min(0),
  maxPerPurchase: Joi.number().integer().min(1).max(50),
  isAvailable: Joi.boolean(),
  saleStartDate: Joi.date(),
  saleEndDate: Joi.date()
}).min(1); // Au moins un champ doit être fourni
