import mongoose from "mongoose";
const Schema = mongoose.Schema;

const paymentSchema = new mongoose.Schema(
  {
    reservation: {
      type: Schema.Types.ObjectId,
      ref: "Reservation",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "EUR",
    },
    paymentMethod: {
      type: String,
      enum: ["carte_credit", "paypal", "virement", "especes", "autre"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "en attente",
        "traitement",
        "complété",
        "échoué",
        "remboursé",
        "annulé",
      ],
      default: "en attente",
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    paymentDate: {
      type: Date,
    },
    paymentDetails: {
      cardLast4: String,
      cardBrand: String,
      paypalEmail: String,
      bankAccount: String,
      receiptUrl: String,
    },
    billingAddress: {
      name: String,
      street: String,
      city: String,
      postalCode: String,
      country: String,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundDate: {
      type: Date,
    },
    refundReason: String,
    notes: String,
  },
  { timestamps: true }
);

// Méthode pour marquer le paiement comme complété
paymentSchema.methods.markAsCompleted = async function (transactionId) {
  this.status = "complété";
  this.paymentDate = new Date();
  this.transactionId = transactionId;

  // Mettre à jour le statut de la réservation
  const Reservation = mongoose.model("Reservation");
  const reservation = await Reservation.findById(this.reservation);
  reservation.status = "confirmée";
  await reservation.save();

  return this.save();
};

// Méthode pour effectuer un remboursement
paymentSchema.methods.refund = async function (amount, reason) {
  if (this.status !== "complété") {
    throw new Error("Seuls les paiements complétés peuvent être remboursés");
  }

  if (amount > this.amount - this.refundAmount) {
    throw new Error(
      "Le montant du remboursement ne peut pas dépasser le montant restant"
    );
  }

  this.refundAmount += amount;
  this.refundDate = new Date();
  this.refundReason = reason;

  if (this.refundAmount >= this.amount) {
    this.status = "remboursé";

    // Mettre à jour le statut de la réservation
    const Reservation = mongoose.model("Reservation");
    const reservation = await Reservation.findById(this.reservation);
    reservation.status = "remboursée";
    await reservation.save();
  }

  return this.save();
};

paymentSchema.statics.findById = function (id) {
  return this.findOne({ _id: id });
};


// Export nommé de la fonction (statique)




const Payment = mongoose.model("Payment", paymentSchema);
export const findById = Payment.findById.bind(Payment);
export default Payment;
