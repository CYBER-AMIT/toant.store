 // models/ticketModel.js
const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    subject: { type: String, required: true },
    problemDescription: { type: String, required: true },
    ticketId: { type: String, unique: true }, // Auto-generated ID
    status: { type: String, default: 'Open' },
    createdAt: { type: Date, default: Date.now }
});

// Pre-save hook to generate ticketId
ticketSchema.pre('save', async function(next) {
    if (!this.ticketId) {
        let isUnique = false;
        let generatedId;
        while (!isUnique) {
            generatedId = 'TKT-' + Math.random().toString(36).substring(2, 9).toUpperCase();
            const existingTicket = await mongoose.models.Ticket.findOne({ ticketId: generatedId });
            if (!existingTicket) {
                isUnique = true;
            }
        }
        this.ticketId = generatedId;
    }
    next();
});

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;