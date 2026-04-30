const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  customerId: { type: String, required: true },
  type: { type: String, enum: ['Billing', 'Technical'], required: true },
  initialPriority: { type: Number, default: 1 },
  displacementCount: { type: Number, default: 0 },
  status: { type: String, enum: ['waiting', 'processing', 'resolved', 'cancelled'], default: 'waiting' },
  createdAt: { type: Date, default: Date.now },
  lastActivity: { type: Date, default: Date.now },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', default: null }
});

module.exports = mongoose.model('Ticket', ticketSchema);
