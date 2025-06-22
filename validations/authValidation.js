import Joi from "joi";

const registerValidation = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).when('provider', {
    is: Joi.exist().valid('google'),
    then: Joi.optional(), // Optionnel pour OAuth
    otherwise: Joi.required() // Requis pour les comptes locaux
  }),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  phoneNumber: Joi.string().allow('').optional(),
  role: Joi.string().valid("client", "organisateur", "administrateur").default("client"),
  
  // Nouveaux champs pour OAuth
  provider: Joi.string().valid("local", "google").default("local"),
  googleId: Joi.string().optional(),
  avatar: Joi.string().uri().optional(),
  isVerified: Joi.boolean().default(false),

  address: Joi.object({
    street: Joi.string().allow('').optional(),
    city: Joi.string().allow('').optional(),
    postalCode: Joi.string().allow('').optional(),
    country: Joi.string().allow('').optional()
  }).optional()
});

const loginValidation = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Nouvelle validation spécifique pour les comptes OAuth
const oauthUserValidation = Joi.object({
  email: Joi.string().email().required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  googleId: Joi.string().required(),
  provider: Joi.string().valid("google").required(),
  avatar: Joi.string().uri().optional(),
  isVerified: Joi.boolean().default(true),
  phoneNumber: Joi.string().allow('').default(' '),
  
  address: Joi.object({
    street: Joi.string().default(' '),
    city: Joi.string().default(' '),
    postalCode: Joi.string().default(' '),
    country: Joi.string().default(' ')
  }).default({
    street: ' ',
    city: ' ',
    postalCode: ' ',
    country: ' '
  })
});

// Validation pour la mise à jour de profil (sans mot de passe)
const updateProfileValidation = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  phoneNumber: Joi.string().allow('').optional(),
  
  address: Joi.object({
    street: Joi.string().allow('').optional(),
    city: Joi.string().allow('').optional(),
    postalCode: Joi.string().allow('').optional(),
    country: Joi.string().allow('').optional()
  }).optional()
});

export {
  registerValidation,
  loginValidation,
  oauthUserValidation,
  updateProfileValidation
};
