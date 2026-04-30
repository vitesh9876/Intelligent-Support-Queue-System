const mongoose = require('mongoose');

const agentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialization: { type: String, enum: ['Billing', 'Technical'], required: true },
  isAvailable: { type: Boolean, default: true },
  currentTicket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', default: null }
});

module.exports = mongoose.model('Agent', agentSchema);
