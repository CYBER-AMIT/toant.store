 // Server/controllers/referralController.js

const User = require('../models/User');

exports.getReferralData = async (req, res) => {
    try {
        
        const user = await User.findById(req.user.id) 
                               .select('username totalCoins referralCode totalDirectReferrals totalReferrals highestReferralLevelReached referrals') 
                               .populate({
                                   path: 'referrals.userId',
                                   select: 'username'  
                               });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const referralLink = `${req.protocol}://${req.get('host')}/register?ref=${user.referralCode}`;

        const referralListFormatted = user.referrals.map(ref => ({
            name: ref.userId ? ref.userId.username : 'Unknown User', 
            generation: ref.generation,
            earnings: ref.earnedCoins,
            referredAt: ref.referredAt 
        }));
        
        referralListFormatted.sort((a, b) => {
            if (a.generation !== b.generation) {
                return a.generation - b.generation;
            }
            return new Date(b.referredAt) - new Date(a.referredAt);
        });

        res.status(200).json({
            success: true,
            referralLink: referralLink,
            referralList: referralListFormatted,
            stats: {
                directReferrals: user.totalDirectReferrals,
                totalReferrals: user.totalReferrals,
                totalCoinEarned: user.totalCoins,
                referralLevel: user.highestReferralLevelReached,
            }
        });

    } catch (error) {
        console.error('Error fetching referral data:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};