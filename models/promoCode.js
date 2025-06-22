import mongoose from "mongoose";
const Schema = mongoose.Schema;

const promoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
    },
    discountType: {
      type: String,
      enum: ["montant", "pourcentage"],
      required: true,
    },
    discountAmount: {
      type: Number,
      min: 0,
      validate: {
        validator: function (value) {
          return this.discountType === "montant" ? value > 0 : true;
        },
        message: "Le montant de la réduction est requis pour ce type de code",
      },
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
      validate: {
        validator: function (value) {
          return this.discountType === "pourcentage" ? value > 0 : true;
        },
        message: "Le pourcentage de réduction est requis pour ce type de code",
      },
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      validate: {
        validator: function (value) {
          return value > this.startDate;
        },
        message: "La date de fin doit être postérieure à la date de début",
      },
    },
    maxUses: {
      type: Number,
      min: 1,
    },
    maxUsesPerUser: {
      type: Number,
      min: 1,
    },
    applicableEvents: [
      {
        type: Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
    applicableTicketTypes: [
      {
        type: Schema.Types.ObjectId,
        ref: "TicketType",
      },
    ],
    applicableUserRoles: [
      {
        type: String,
        enum: ["client", "organisateur", "administrateur"],
      },
    ],
    timesUsed: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Méthodes du schéma...
promoCodeSchema.methods.isValid = function () {
  const now = new Date();
  return (
    this.isActive &&
    now >= this.startDate &&
    (!this.endDate || now <= this.endDate) &&
    (!this.maxUses || this.timesUsed < this.maxUses)
  );
};

promoCodeSchema.methods.applyDiscount = function (originalAmount) {
  if (this.discountType === "montant") {
    return Math.max(0, originalAmount - this.discountAmount);
  }
  if (this.discountType === "pourcentage") {
    return originalAmount * (1 - this.discountPercentage / 100);
  }
  return originalAmount;
};

promoCodeSchema.methods.incrementUsage = function () {
  if (this.maxUses && this.timesUsed >= this.maxUses) {
    throw new Error(
      "Ce code promo a atteint son nombre maximum d'utilisations"
    );
  }
  this.timesUsed += 1;
  return this.save();
};

promoCodeSchema.methods.isUserEligible = function (user) {
  return (
    !this.applicableUserRoles || this.applicableUserRoles.includes(user.role)
  );
};

promoCodeSchema.index({ code: 1 }, { unique: true });

promoCodeSchema.pre("validate", function (next) {
  if (this.endDate && this.endDate <= this.startDate) {
    next(new Error("La date de fin doit être postérieure à la date de début"));
  } else {
    next();
  }
});

const PromoCode = mongoose.model("PromoCode", promoCodeSchema);
// ✅ CORRECTION - Utiliser export default au lieu de module.exports
export default PromoCode;