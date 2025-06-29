import mongoose from "mongoose";
const Schema = mongoose.Schema;

const ticketTypeSchema = new mongoose.Schema(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "EUR",
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    initialQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    maxPerPurchase: {
      type: Number,
      default: 10,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    saleStartDate: {
      type: Date,
      default: Date.now,
    },
    saleEndDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Méthode pour vérifier si le type de billet est disponible à la vente
ticketTypeSchema.methods.isOnSale = function () {
  const now = new Date();
  return (
    this.isAvailable &&
    this.quantity > 0 &&
    now >= this.saleStartDate &&
    (!this.saleEndDate || now <= this.saleEndDate)
  );
};

// Méthode pour réduire la quantité disponible
ticketTypeSchema.methods.reduceQuantity = async function (amount) {
  if (this.quantity < amount) {
    throw new Error("Quantité insuffisante de billets disponibles");
  }

  this.quantity -= amount;
  if (this.quantity === 0) {
    this.isAvailable = false;
  }

  return this.save();
};

const TicketType = mongoose.model("TicketType", ticketTypeSchema);
export default TicketType;
