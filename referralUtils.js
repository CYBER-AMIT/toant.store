 // Server/utils/referralUtils.js

const User = require('../models/User'); 

const referralRewards = {
    1: 6000, 
    2: 4000, 
    3: 2000, 
    4: 1000, 
    5: 1000, 
    6: 1000, 
};

async function processReferral(referrerId, referredUserId) {
    console.log(`[processReferral] Started for referrerId: ${referrerId}, referredUserId: ${referredUserId}`);
    try {
        const referredUser = await User.findById(referredUserId);
        if (!referredUser) {
            console.warn('[processReferral] WARNING: Referred user not found for processing referral:', referredUserId);
            return;
        }
        console.log(`[processReferral] Referred user found: ${referredUser.username} (ID: ${referredUser._id})`);

        let currentReferrerId = referrerId;
        let generation = 1;

        while (currentReferrerId && generation <= Object.keys(referralRewards).length) { 
            console.log(`[processReferral] --- Generation ${generation} Processing ---`);
            console.log(`[processReferral] Current referrer ID: ${currentReferrerId}`);

            const referrer = await User.findById(currentReferrerId);
            if (!referrer) {
                console.warn(`[processReferral] WARNING: Referrer not found for ID: ${currentReferrerId} at generation ${generation}. Breaking referral chain.`);
                break; 
            }
            console.log(`[processReferral] Found referrer: ${referrer.username} (ID: ${referrer._id})`);

            const reward = referralRewards[generation] || 0;
            console.log(`[processReferral] Reward for generation ${generation}: ${reward} coins.`);

            const existingReferralEntryIndex = referrer.referrals.findIndex(ref => 
                ref.userId && ref.userId.equals(referredUserId) && ref.generation === generation
            ); 

            if (existingReferralEntryIndex === -1) { 
                console.log(`[processReferral] Adding NEW referral entry for ${referredUser.username} under ${referrer.username} (Gen ${generation}).`);
                referrer.referrals.push({
                    userId: referredUserId,
                    generation: generation,
                    earnedCoins: reward,
                    referredAt: new Date() 
                });

                if (reward > 0) {
                    referrer.totalCoins += reward; 
                    console.log(`[processReferral] ${referrer.username}'s totalCoins updated to ${referrer.totalCoins} (Added ${reward} coins).`);
                }

                if (generation === 1) {
                    referrer.totalDirectReferrals = (referrer.totalDirectReferrals || 0) + 1;
                    console.log(`[processReferral] ${referrer.username}'s totalDirectReferrals: ${referrer.totalDirectReferrals}`);
                }
                referrer.totalReferrals = (referrer.totalReferrals || 0) + 1;
                console.log(`[processReferral] ${referrer.username}'s totalReferrals: ${referrer.totalReferrals}`);
                
                if (generation > (referrer.highestReferralLevelReached || 0)) {
                    referrer.highestReferralLevelReached = generation;
                    console.log(`[processReferral] ${referrer.username}'s highestReferralLevelReached: ${referrer.highestReferralLevelReached}`);
                }
            } else {
                console.log(`[processReferral] Referral entry for user ${referredUserId} already exists under referrer ${referrer._id} for generation ${generation}. Skipping reward/count update for this generation.`);
            }
            
            await referrer.save(); 
            console.log(`[processReferral] Referrer ${referrer.username} (ID: ${referrer._id}) saved successfully for Generation ${generation}.`);

            currentReferrerId = referrer.referredBy;
            generation++;
        }
        console.log(`[processReferral] Finished processing referral chain for referred user ${referredUser.username}.`);

    } catch (error) {
        console.error('[processReferral ERROR] Error processing referral chain:', error);
    }
}

module.exports = {
    processReferral,
    referralRewards 
};