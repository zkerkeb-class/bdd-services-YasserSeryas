// Modèle Utilisateur

import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /.+\@.+\..+/,
    },
    password: {
      type: String,
      required: function() {
        // Le mot de passe n'est requis que pour les comptes locaux
        return this.provider === 'local' || !this.provider;
      },
      minlength: 8,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["client", "organisateur", "administrateur"],
      default: "client",
    },
    profilePicture: {
      type: String,
    },
    // Nouveau champ pour l'avatar des comptes OAuth
    avatar: {
      type: String,
    },
    // Nouveau champ pour identifier le fournisseur d'authentification
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    // Nouveau champ pour stocker l'ID Google
    googleId: {
      type: String,
      sparse: true, // Permet les valeurs null/undefined multiples
    },
    address: {
      street: {
        type: String,
        default: " ",
      },
      city: {
        type: String,
        default: " ",
      },
      postalCode: {
        type: String,
        default: " ",
      },
      country: {
        type: String,
        default: " ",
      },
    },
    isVerified: {
      type: Boolean,
      default: function() {
        // Les comptes OAuth sont automatiquement vérifiés
        return this.provider !== 'local';
      },
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    lastLogin: Date,
  },
  { timestamps: true }
);

// Index composé pour éviter les doublons de googleId
userSchema.index({ googleId: 1, provider: 1 }, { 
  unique: true, 
  sparse: true,
  partialFilterExpression: { googleId: { $exists: true } }
});

// Méthode pour hacher le mot de passe avant de sauvegarder
userSchema.pre("save", async function (next) {
  // Ne hacher que si le mot de passe est modifié et existe
  if (!this.isModified("password") || !this.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function (candidatePassword) {
  // Vérifier que l'utilisateur a un mot de passe (compte local)
  if (!this.password) {
    throw new Error("Ce compte utilise une authentification externe");
  }
  return bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour vérifier si c'est un compte OAuth
userSchema.methods.isOAuthAccount = function() {
  return this.provider && this.provider !== 'local';
};

// Méthode pour obtenir l'avatar (priorité à l'avatar OAuth puis profilePicture)
userSchema.methods.getAvatarUrl = function() {
  return this.avatar || this.profilePicture || null;
};

const User = mongoose.model("User", userSchema);
export default User;
