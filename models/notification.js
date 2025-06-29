import { Schema, model } from 'mongoose';

const notificationSchema = new Schema({
  type: {
    type: String,
    enum: ['email', 'sms', 'push'],
    required: true
  },
  recipient: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: function() { return this.type === 'email'; }
  },
  content: {
    type: String,
    required: true
  },
  template: {
    type: String,
    required: true
  },
  templateData: {
    type: Object,
    default: {}
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'delivered'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  scheduledFor: {
    type: Date,
    default: Date.now
  },
  sentAt: Date,
  failureReason: String,
  retryCount: {
    type: Number,
    default: 0
  },
  metadata: {
    userId: String,
    eventId: String,
    reservationId: String,
    source: String
  }
}, { timestamps: true });

// Index pour optimiser les requêtes
notificationSchema.index({ status: 1, scheduledFor: 1 });
notificationSchema.index({ 'metadata.userId': 1 });

export default model('Notification', notificationSchema);
