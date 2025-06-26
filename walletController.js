// server/controllers/walletController.js

const User = require('../models/user'); 
const Withdrawal = require('../models/WalletModel');
const WITHDRAWAL_FEE_PERCENTAGE = 0.5; // 0.5%

const calculateWithdrawalAmounts = (requestedAmount) => {
    console.log(`[calculateWithdrawalAmounts] Calculating for amount: ${requestedAmount}`);
    const feeDecimal = WITHDRAWAL_FEE_PERCENTAGE / 100;
    const feeAmount = requestedAmount * feeDecimal;
    const finalAmount = requestedAmount - feeAmount;
    console.log(`[calculateWithdrawalAmounts] Fee: ${feeAmount}, Final Amount: ${finalAmount}`);
    return { feeAmount, finalAmount };
};

exports.getWalletBalance = async (req, res) => {
    console.log(`[getWalletBalance] Fetching wallet balance for user: ${req.user.id}`);
    try {
        const user = await User.findById(req.user.id).select('tonBalance toantBalance');

        if (!user) {
            console.warn(`[getWalletBalance] User not found for ID: ${req.user.id}`);
            return res.status(404).json({ message: 'User not found.' });
        }

        console.log(`[getWalletBalance] Balances for ${req.user.id}: TON=${user.tonBalance}, TOANT=${user.toantBalance}`);
        res.status(200).json({
            tonBalance: user.tonBalance,
            toantBalance: user.toantBalance,
            totalBalance: user.tonBalance + user.toantBalance 
        });

    } catch (error) {
        console.error('[getWalletBalance] Error fetching wallet balance:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.requestWithdrawal = async (req, res) => {
    const { coinType, walletAddress, amount } = req.body;
    console.log(`[requestWithdrawal] Request received from user: ${req.user.id} for ${amount} ${coinType} to ${walletAddress}`);

    if (!coinType || !walletAddress || !amount || amount <= 0) {
        console.warn('[requestWithdrawal] Invalid input provided for withdrawal.');
        return res.status(400).json({ message: 'Please provide coin type, valid wallet address, and amount.' });
    }

    if (coinType !== 'Ton') {
        console.warn(`[requestWithdrawal] Unsupported coin type: ${coinType}`);
        return res.status(400).json({ message: 'Currently only Ton coin withdrawals are supported.' });
    }

    try {
        const user = await User.findById(req.user.id); 

        if (!user) {
            console.warn(`[requestWithdrawal] User not found for ID: ${req.user.id}`);
            return res.status(404).json({ message: 'User not found.' });
        }

        if (user.tonBalance < amount) {
            console.warn(`[requestWithdrawal] Insufficient balance for user ${req.user.id}. Requested: ${amount}, Available: ${user.tonBalance}`);
            return res.status(400).json({ message: `Insufficient TON balance. Your current balance is ${user.tonBalance}.` });
        }

        const { feeAmount, finalAmount } = calculateWithdrawalAmounts(amount);

        const withdrawal = new Withdrawal({
            userId: user._id,
            username: user.username, 
            email: user.email,       
            coinType: coinType,
            walletAddress: walletAddress,
            requestedAmount: amount,
            finalAmount: finalAmount,
            feeAmount: feeAmount,
            status: 'Pending',
            requestTime: new Date()
        });

        await withdrawal.save();
        user.tonBalance -= amount;
        await user.save();
        console.log(`[requestWithdrawal] Withdrawal request saved for user ${req.user.id}. ID: ${withdrawal._id}`);

        res.status(201).json({
            message: 'Withdrawal request submitted successfully. It will be reviewed by admin.',
            withdrawalId: withdrawal._id,
            status: withdrawal.status,
            finalAmount: finalAmount
        });

    } catch (error) {
        console.error('[requestWithdrawal] Error requesting withdrawal:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getWithdrawalHistory = async (req, res) => {
    console.log(`[getWithdrawalHistory] Fetching history for user: ${req.user.id}`);
    try {
        const userId = req.user.id;
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const history = await Withdrawal.find({
            userId: userId,
            requestTime: { $gte: sixMonthsAgo }
        })
        .sort({ requestTime: -1 }) 
        .limit(20);
        console.log(`[getWithdrawalHistory] Found ${history.length} records for user ${userId}.`);

        const updatedHistory = history.map(item => {
            if (item.status === 'Pending') {
                const now = new Date();
                const requestTime = new Date(item.requestTime);
                const twoMinutes = 2 * 60 * 1000; 

                if (now.getTime() - requestTime.getTime() > twoMinutes) {
                    item = item.toObject(); 
                    item.status = 'In Processing';
                    console.log(`[getWithdrawalHistory] Withdrawal ${item._id} status updated to 'In Processing' due to time elapsed.`);
                }
            }
            return item;
        });


        res.status(200).json(updatedHistory);

    } catch (error) {
        console.error('[getWithdrawalHistory] Error fetching withdrawal history:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateWithdrawalStatus = async (req, res) => 
    console.log(`[updateWithdrawalStatus] Admin action initiated for withdrawal ID: ${req.params.id}`);
    // উদাহরণ:
    // const { status } = req.body; // 'Completed', 'Rejected'
    // const withdrawal = await Withdrawal.findById(req.params.id);
    // if (!withdrawal) {
    //     console.warn(`[updateWithdrawalStatus] Withdrawal request ${req.params.id} not found.`);
    //     return res.status(404).json({ message: 'উত্তোলনের অনুরোধ পাওয়া যায়নি' });
    // }
    // withdrawal.status = status;
    // if (status === 'Completed' || status === 'Rejected') {
    //    withdrawal.completionTime = new Date();
    //    console.log(`[updateWithdrawalStatus] Withdrawal ${req.params.id} completion time set.`);
    // }
    // if (status === 'Rejected') {
    //    const user = await User.findById(withdrawal.userId);
    //    if (user) {
    //        user.tonBalance += withdrawal.requestedAmount; 
    //        await user.save();
    //        console.log(`[updateWithdrawalStatus] User ${user._id} balance reverted for rejected withdrawal.`);
    //    } else {
    //        console.warn(`[updateWithdrawalStatus] User not found for rejected withdrawal ${withdrawal._id}. Balance not reverted.`);
    //    }
    // }
    // await withdrawal.save();
    // console.log(`[updateWithdrawalStatus] Withdrawal ${req.params.id} status updated to ${status}.`);
    // res.status(200).json({ message: 'উত্তোলন স্ট্যাটাস আপডেট হয়েছে' });

// @desc
// @route   GET /api/admin/withdrawals/pending
// @access  Private
exports.getPendingWithdrawals = async (req, res) => {
    console.log('[getPendingWithdrawals] Admin fetching pending/in-processing withdrawals.');
    // উদাহরণ:
    // const withdrawals = await Withdrawal.find({ status: { $in: ['Pending', 'In Processing'] } })
    //     .populate('userId', 'username email'); 
    // console.log(`[getPendingWithdrawals] Found ${withdrawals.length} pending/in-processing withdrawals.`);
    // res.status(200).json(withdrawals);
};


// @desc 
// @route   PUT /api/admin/users/:id/balance
// @access  Private 
exports.updateUserBalance = async (req, res) => {

    console.log(`[updateUserBalance] Admin attempting to update balance for user ID: ${req.params.id}`);
    // উদাহরণ:
    // const { tonBalance, toantBalance } = req.body;
    // const user = await User.findById(req.params.id);
    // if (!user) {
    //     console.warn(`[updateUserBalance] User not found for ID: ${req.params.id}`);
    //     return res.status(404).json({ message: 'User not found.' });
    // }
    // if (tonBalance !== undefined) user.tonBalance = tonBalance;
    // if (toantBalance !== undefined) user.toantBalance = toantBalance;
    // await user.save();
    // console.log(`[updateUserBalance] User ${user._id} balance updated. New TON: ${user.tonBalance}, TOANT: ${user.toantBalance}`);
    // res.status(200).json({ message: 'User balance updated.', user });
};