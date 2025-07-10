import mongoose from "mongoose";
const Schema = mongoose.Schema;

const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["concert", "théâtre", "sport", "conférence", "festival", "autre"],
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    location: {
      name: {
        type: String,
        required: true,
      },
      address: {
        street: String,
        city: String,
        postalCode: String,
        country: String,
      },
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    organizer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    images: [
      {
        type: String,
      },
    ],
    totalCapacity: {
      type: Number,
      required: true,
      min: 1,
    },    remainingCapacity: {
      type: Number,
      required: true,
      default: function() { return this.totalCapacity; }
    },
    status: {
      type: String,
      enum: ["brouillon", "publié", "annulé", "complet", "terminé"],
      default: "brouillon",
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    tags: [
      {
        type: String,
      },
    ],
    ticketTypes: [
      {
        type: Schema.Types.ObjectId,
        ref: "TicketType",
      },
    ],
  },
  { timestamps: true }
);

// Méthode pour vérifier si l'événement est complet
eventSchema.methods.isSoldOut = function () {
  return this.remainingCapacity <= 0;
};

// Initialiser remainingCapacity avant la sauvegarde
eventSchema.pre('save', function(next) {
  if (this.isNew && !this.remainingCapacity) {
    this.remainingCapacity = this.totalCapacity;
  }
  next();
});

// Méthode pour mettre à jour la capacité restante
eventSchema.methods.updateRemainingCapacity = async function () {
  try {
    // Vérifier que les données de pricing existent
    if (!this.pricing || !this.pricing.ticketTypes || this.pricing.ticketTypes.length === 0) {
      console.warn('Aucun type de billet trouvé pour cet événement');
      this.remainingCapacity = this.totalCapacity || 0;
      return this.save();
    }

    // Calculer la capacité restante totale
    let totalRemaining = 0;
    
    this.pricing.ticketTypes.forEach((ticketType) => {
      // Utiliser la quantité restante (quantity) de chaque type de billet
      const remaining = ticketType.quantity || 0;
      totalRemaining += remaining;
    });

    // Mettre à jour les champs
    this.remainingCapacity = totalRemaining;
    this.pricing.totalAvailableTickets = totalRemaining;

    // Mettre à jour le statut si nécessaire
    if (this.remainingCapacity <= 0) {
      this.status = "complet";
    } else if (this.status === "complet" && this.remainingCapacity > 0) {
      this.status = "publié"; // Remettre en vente si des billets redeviennent disponibles
    }

    return this.save();
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la capacité restante:', error);
    throw error;
  }
};


const Event = mongoose.model("Event", eventSchema);
export default Event;
