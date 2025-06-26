 // server/models/TaskModels.js
const mongoose = require('mongoose');

// --- Quiz Schema ---
const quizSchema = new mongoose.Schema({
    questionImageUrl: {
        type: String,
        required: true,
        trim: true
    },
    correctAnswer: {
        type: String,
        required: true,
        trim: true,
        uppercase: true 
    },
    rewardCoins: {
        type: Number,
        required: true,
        min: 0
    },
    isActive: { 
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// --- Social Task Schema ---
const socialTaskSchema = new mongoose.Schema({
    name: { 
        type: String,
        required: true,
        trim: true
    },
    description: { 
        type: String,
        trim: true
    },
    link: { 
        type: String,
        required: true,
        trim: true
    },
    rewardCoins: {
        type: Number,
        required: true,
        min: 0
    },
    type: { 
        type: String,
        required: true,
        enum: ['Toant', 'Partner']
    },
    isActive: { 
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Quiz = mongoose.model('Quiz', quizSchema);
const SocialTask = mongoose.model('SocialTask', socialTaskSchema);

module.exports = { Quiz, SocialTask };