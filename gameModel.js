// server/models/GameModel.js (this is gamini code)

const mongoose = require('mongoose');

const gameDataSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    playerName: { // This could be the user's username or a specific in-game name
        type: String,
        required: true
    },
    level: {
        type: Number,
        required: true,
        default: 1
    },
    points: { // This field will store the ball score for a given game session
        type: Number,
        required: true,
        default: 0
    },
    stars: {
        type: Number,
        required: true,
        default: 0
    },
    playedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('GameData', gameDataSchema);