import Joi from 'joi'
const createEventValidation = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required().greater(Joi.ref('startDate')),
  location: Joi.object({
    name: Joi.string().required(),
    address: Joi.object({
      street: Joi.string(),
      city: Joi.string().required(),
      postalCode: Joi.string()
    }).required()
  }).required(),
  totalCapacity: Joi.number().required().min(1)
});

export {
  createEventValidation
};
