import Joi from "joi"

const registerValidation = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  phoneNumber: Joi.string(),
  address: Joi.object({
    street: Joi.string(),
    city: Joi.string(),
    postalCode: Joi.string(),
    country: Joi.string()
  })
});

const loginValidation = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export {
  registerValidation,
  loginValidation
};
