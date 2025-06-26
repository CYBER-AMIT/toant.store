 // models/sponsorshipModel.js
const mongoose = require('mongoose');

const sponsorshipSchema = new mongoose.Schema({
    sponsorName: { type: String, required: true },
    sponsorProjectName: { type: String, required: true },
    sponsorProjectLink: { type: String },
    sponsorBusinessEmail: { type: String, required: true },
    userNeed: { type: Number, required: true },
    budget: { type: String },
    projectDescription: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Sponsorship = mongoose.model('Sponsorship', sponsorshipSchema);

module.exports = Sponsorship;