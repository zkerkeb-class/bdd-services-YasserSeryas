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
    },
    remainingCapacity: {
      type: Number,
      required: true,
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

// Méthode pour mettre à jour la capacité restante
eventSchema.methods.updateRemainingCapacity = async function () {
  const TicketType = mongoose.model("TicketType");
  const ticketTypes = await TicketType.find({ _id: { $in: this.ticketTypes } });

  let totalRemaining = 0;
  ticketTypes.forEach((type) => {
    totalRemaining += type.quantity;
  });

  this.remainingCapacity = totalRemaining;
  if (this.remainingCapacity <= 0) {
    this.status = "complet";
  }

  return this.save();
};

const Event = mongoose.model("Event", eventSchema);
export default Event;
