// server/models/SalaryAchievementModel.js
const mongoose = require('mongoose');

const SalaryAchievementSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    coinsRequired: {
        type: Number,
        required: true
    },
    bonusCoins: {
        type: Number,
        default: 0
    },
    awardedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('SalaryAchievement', SalaryAchievementSchema);