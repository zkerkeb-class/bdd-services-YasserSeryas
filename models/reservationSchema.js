import mongoose from "mongoose";
const Schema = mongoose.Schema;

const reservationSchema = new mongoose.Schema(
  {
    reservationNumber: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    tickets: [
      {
        type: Schema.Types.ObjectId,
        ref: "Ticket",
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "EUR",
    },
    status: {
      type: String,
      enum: ["en attente", "confirmée", "annulée", "remboursée"],
      default: "en attente",
    },
    payment: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
    },
    promoCode: {
      code: String,
      discountAmount: Number,
      discountPercentage: Number,
    },
    notes: String,
  },
  { timestamps: true }
);

// Générer un numéro de réservation avant la sauvegarde
reservationSchema.pre("save", function (next) {
  if (!this.reservationNumber) {
    const timestamp = new Date().getTime().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    this.reservationNumber = `R-${timestamp}-${random}`;
  }
  next();
});

// Méthode pour calculer le montant total
reservationSchema.methods.calculateTotal = async function () {
  const Ticket = mongoose.model("Ticket");
  const tickets = await Ticket.find({ _id: { $in: this.tickets } });

  let total = 0;
  tickets.forEach((ticket) => {
    total += ticket.price;
  });

  // Appliquer une réduction si un code promo est utilisé
  if (this.promoCode) {
    if (this.promoCode.discountAmount) {
      total -= this.promoCode.discountAmount;
    } else if (this.promoCode.discountPercentage) {
      total *= 1 - this.promoCode.discountPercentage / 100;
    }
  }

  this.totalAmount = Math.max(0, total);
  return this.save();
};

// Méthode pour annuler la réservation
reservationSchema.methods.cancel = async function () {
  if (this.status === "confirmée") {
    this.status = "annulée";

    // Libérer les billets
    const TicketType = mongoose.model("TicketType");
    const Ticket = mongoose.model("Ticket");

    const tickets = await Ticket.find({ _id: { $in: this.tickets } });

    for (const ticket of tickets) {
      const ticketType = await TicketType.findById(ticket.ticketType);
      ticketType.quantity += 1;
      await ticketType.save();

      // Supprimer le billet
      await Ticket.deleteOne({ _id: ticket._id });
    }

    // Mettre à jour la capacité restante de l'événement
    const Event = mongoose.model("Event");
    const event = await Event.findById(this.event);
    await event.updateRemainingCapacity();

    return this.save();
  } else {
    throw new Error(
      `Impossible d'annuler une réservation avec le statut ${this.status}`
    );
  }
};

const Reservation = mongoose.model("Reservation", reservationSchema);
module.exports = Reservation;
