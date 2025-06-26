const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    totalCoins: { 
        type: Number,
        default: 0
    },
    tonBalance: {
        type: Number,
        default: 0,
        min: 0
    },
    toantBalance: {
        type: Number,
        default: 0,
        min: 0
    },
    totalBallScore: {
        type: Number,
        default: 0
    },
    totalStarScore: {
        type: Number,
        default: 0
    },
    highestLevelReached: {
        type: Number,
        default: 1
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    dailyClaimState: {
        lastClaimedDay: { 
            type: Number,
            default: 0 
        },
        lastClaimTime: { 
            type: Date,
            default: null
        }
    },
    quizState: {
        lastSubmissionTime: {
            type: Date,
            default: null
        },
        currentQuizId: { 
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Quiz',
            default: null
        },
        completedQuizIds: [{ 
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Quiz'
        }]
    },
    completedSocialTasks: [{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SocialTask'
    }],
    // --- Referral System Fields ---
    referralCode: { 
        type: String, 
        unique: true, 
        sparse: true 
    }, 
    referredBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        default: null 
    }, 
    referrals: [ 
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            generation: { type: Number, required: true }, 
            earnedCoins: { type: Number, default: 0 }, 
            referredAt: { type: Date, default: Date.now } 
        }
    ],
    totalDirectReferrals: { type: Number, default: 0 }, 
    totalReferrals: { type: Number, default: 0 }, 
    highestReferralLevelReached: { type: Number, default: 0 } 
});

// Password hashing before saving
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }

    if (this.isNew && !this.referralCode) {
        let uniqueCode = false;
        let generatedCode;
        while (!uniqueCode) {
            generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            const existingUser = await mongoose.models.User.findOne({ referralCode: generatedCode });
            if (!existingUser) {
                uniqueCode = true;
            }
        }
        this.referralCode = generatedCode;
    }
    next();
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);