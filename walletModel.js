const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  
        required: true
    },
    username: {  
        type: String,
        required: true
    },
    email: {  
        type: String,
        required: true
    },
    coinType: {
        type: String,
        enum: ['Ton', 'Toant'],  
        required: true
    },
    walletAddress: {
        type: String,
        required: true
    },
    requestedAmount: {  
        type: Number,
        required: true,
        min: 0
    },
    finalAmount: {  
        type: Number,
        required: true,
        min: 0
    },
    feeAmount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['Pending', 'In Processing', 'Completed', 'Rejected'],
        default: 'Pending'
    },
    requestTime: {
        type: Date,
        default: Date.now
    },
    processingTime: {  
        type: Date
    },
    completionTime: {  
        type: Date
    },
    transactionHash: {  
        type: String,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('Withdrawal', withdrawalSchema);