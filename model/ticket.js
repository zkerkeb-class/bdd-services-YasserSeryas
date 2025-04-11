import mongoose from "mongoose";
const Schema = mongoose.Schema;
import QRCode from "qrcode";
import crypto from "crypto";

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
    },
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    ticketType: {
      type: Schema.Types.ObjectId,
      ref: "TicketType",
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reservation: {
      type: Schema.Types.ObjectId,
      ref: "Reservation",
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "EUR",
    },
    qrCode: {
      type: String,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    usedAt: {
      type: Date,
    },
    seat: {
      section: String,
      row: String,
      number: String,
    },
    isTransferable: {
      type: Boolean,
      default: true,
    },
    transferHistory: [
      {
        fromUser: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        toUser: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        transferDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// Générer un numéro de billet et un QR code avant la sauvegarde
ticketSchema.pre("save", async function (next) {
  if (!this.ticketNumber) {
    // Générer un numéro de billet unique
    this.ticketNumber = crypto.randomBytes(8).toString("hex").toUpperCase();
  }

  if (!this.qrCode) {
    // Générer le contenu du QR code (informations du billet en JSON)
    const qrContent = JSON.stringify({
      ticketNumber: this.ticketNumber,
      eventId: this.event,
      ticketTypeId: this.ticketType,
      ownerId: this.owner,
    });

    // Générer le QR code en base64
    try {
      this.qrCode = await QRCode.toDataURL(qrContent);
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Méthode pour marquer le billet comme utilisé
ticketSchema.methods.markAsUsed = function () {
  this.isUsed = true;
  this.usedAt = new Date();
  return this.save();
};

// Méthode pour transférer le billet à un autre utilisateur
ticketSchema.methods.transferTo = function (newOwnerId) {
  if (!this.isTransferable || this.isUsed) {
    throw new Error("Ce billet ne peut pas être transféré");
  }

  const oldOwnerId = this.owner;
  this.transferHistory.push({
    fromUser: oldOwnerId,
    toUser: newOwnerId,
    transferDate: new Date(),
  });

  this.owner = newOwnerId;
  return this.save();
};

const Ticket = mongoose.model("Ticket", ticketSchema);
module.exports = Ticket;
