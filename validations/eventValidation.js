import Joi from "joi";

const createEventValidation = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  category: Joi.string()
    .valid("concert", "théâtre", "sport", "conférence", "festival", "autre")
    .required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required().greater(Joi.ref("startDate")),
  location: Joi.object({
    name: Joi.string().required(),
    address: Joi.object({
      street: Joi.string(),
      city: Joi.string().required(),
      postalCode: Joi.string().required(),
      country: Joi.string().required(),
    }).required(),
  }).required(),
  totalCapacity: Joi.number().required().min(1),

  // Champs optionnels pour l'événement
  isPublic: Joi.boolean().default(true),
  tags: Joi.array().items(Joi.string()),

  // Champs optionnels pour le ticket Standard créé automatiquement
  defaultTicketPrice: Joi.number().min(0).default(25),
  defaultTicketQuantity: Joi.number().min(1).default(100),
  currency: Joi.string().default("EUR"),
  maxPerPurchase: Joi.number().min(1).default(10),
  saleStartDate: Joi.date().default(() => new Date()),
  saleEndDate: Joi.date().when("endDate", {
    is: Joi.exist(),
    then: Joi.date().max(Joi.ref("endDate")),
    otherwise: Joi.date(),
  }),
});

export { createEventValidation };
