

import User from "../models/userSchema.js";
import { registerValidation } from "../validations/authValidation.js";

const getUserByEmail = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "Utilisateur non trouvé" 
      });
    }
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Erreur getUserByEmail:', error);
    res.status(500).json({ 
      success: false,
      message: "Erreur serveur", 
      error: error.message 
    });
  }
};
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "Utilisateur non trouvé" 
      });
    }
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Erreur getUserById:', error);
    res.status(500).json({ 
      success: false,
      message: "Erreur serveur", 
      error: error.message 
    });
  }
};
const createUser = async (req, res) => {
  try {
    // Validation des données avec Joi
    const { error, value } = registerValidation.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Données de validation invalides",
        details: error.details.map(detail => detail.message)
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email: value.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Un utilisateur avec cet email existe déjà"
      });
    }

    // Créer le nouvel utilisateur
    const newUser = new User(value);
    const savedUser = await newUser.save();

    // Retourner l'utilisateur sans le mot de passe
    const userResponse = savedUser.toObject();
    delete userResponse.password;
    delete userResponse.resetPasswordToken;
    delete userResponse.resetPasswordExpires;

    console.log(`✅ Nouvel utilisateur créé: ${savedUser.email}`);
    
    res.status(201).json({
      success: true,
      message: "Utilisateur créé avec succès",
      data: userResponse
    });

  } catch (error) {
    console.error('Erreur createUser:', error);
    
    // Gestion des erreurs de duplication (email unique)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Cet ${field} est déjà utilisé`
      });
    }
    
    // Gestion des erreurs de validation Mongoose
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Erreur de validation des données",
        details: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de l'utilisateur",
      error: error.message
    });
  }
};

export { getUserByEmail, createUser, getUserById };
