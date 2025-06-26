// server/controllers/salaryAchievementController.js
const User = require('../models/User');
const SalaryAchievement = require('../models/SalaryAchievementModel');

const SALARY_TIERS = [
    { name: 'Beginner Rank', minCoins: 0, bonus: 0 },
    { name: 'Bronze Rank', minCoins: 50, bonus: 100 },
    { name: 'Silver Rank', minCoins: 200, bonus: 500 },
    { name: 'Gold Rank', minCoins: 500, bonus: 1000 },
    // Add more tiers as needed
];

exports.checkSalaryAchievements = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        let achievementsAwarded = [];

        for (const tier of SALARY_TIERS) {
            if (user.totalCoins >= tier.minCoins) {
                const existingAchievement = await SalaryAchievement.findOne({ user: userId, name: tier.name });

                if (!existingAchievement) {
                    const newAchievement = new SalaryAchievement({
                        user: userId,
                        name: tier.name,
                        coinsRequired: tier.minCoins,
                        bonusCoins: tier.bonus,
                        awardedAt: Date.now()
                    });
                    await newAchievement.save();

                    user.totalCoins = (user.totalCoins || 0) + tier.bonus;
                    await user.save();

                    achievementsAwarded.push({
                        name: tier.name,
                        bonus: tier.bonus
                    });
                    console.log(`User ${user.username} awarded ${tier.name} with ${tier.bonus} bonus coins.`);
                }
            }
        }

        if (achievementsAwarded.length > 0) {
            return res.status(200).json({
                success: true,
                message: 'Achievements checked and awarded.',
                awarded: achievementsAwarded,
                newTotalCoins: user.totalCoins
            });
        } else {
            return res.status(200).json({ success: true, message: 'No new achievements awarded.', awarded: [] });
        }

    } catch (error) {
        console.error('Error checking salary achievements:', error);
        res.status(500).json({ success: false, message: 'Server error checking achievements.', error: error.message });
    }
};

exports.getSalaryAchievements = async (req, res) => {
    try {
        const userId = req.user.id;
        const achievements = await SalaryAchievement.find({ user: userId }).sort({ awardedAt: 1 });

        res.status(200).json({ success: true, achievements: achievements });
    } catch (error) {
        console.error('Error fetching salary achievements:', error);
        res.status(500).json({ success: false, message: 'Server error fetching achievements.', error: error.message });
    }
};