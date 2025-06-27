// server/controllers/apiController.js
const User = require('../models/User');
const { Quiz, SocialTask } = require('../models/TaskModel'); 
const Withdrawal = require('../models/WalletModel');
const mongoose = require('mongoose');

// Daily reward configuration (could be moved to a config file or DB for admin control)
const DAILY_REWARDS = {
    1: 260, 
    2: 2000,
    3: 6000,
    4: 12000,
    5: 16000,
    6: 20000,
    7: 2000000
};
const DAILY_CLAIM_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const QUIZ_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const DEFAULT_QUIZ_REWARD = 500; // Default if not specified in DB quiz

const apiController = {
    updateUserCoinsOnly: async (userId, coinsToAdd) => {
        try {
            console.log(`[updateUserCoinsOnly] Attempting to update coins for user: ${userId} by ${coinsToAdd}`);
            if (!userId || typeof coinsToAdd !== 'number' || coinsToAdd < 0) {
                console.warn(`[updateUserCoinsOnly] Invalid input: userId=${userId}, coinsToAdd=${coinsToAdd}`);
                throw { status: 400, message: 'Invalid user ID or coins amount provided for update.' };
            }

            const user = await User.findById(userId);
            if (!user) {
                console.error(`[updateUserCoinsOnly] User not found for coin update: ${userId}`);
                throw { status: 404, message: 'User not found to update coins.' };
            }

            user.totalCoins = (user.totalCoins || 0) + coinsToAdd;
            await user.save();
            console.log(`[updateUserCoinsOnly] User ${userId} coins updated by ${coinsToAdd}. New total: ${user.totalCoins}`);
            return user.totalCoins;
        } catch (error) {
            console.error('[updateUserCoinsOnly] Error in updateUserCoinsOnly:', error.message);
            throw error;
        }
    },

    getUserStats: async (req, res) => {
        console.log(`[getUserStats] Fetching user stats for user: ${req.user.id}`);
        try {
            const userId = req.user.id;
            if (!userId) {
                console.warn('[getUserStats] User ID not found in request.');
                return res.status(400).json({ success: false, message: 'User ID not found in request (auth middleware error).' });
            }

            const user = await User.findById(userId).select('username totalCoins');
            if (!user) {
                console.warn(`[getUserStats] User not found for ID: ${userId}`);
                return res.status(404).json({ success: false, message: 'User not found.' });
            }

            const usersByCoins = await User.find().sort({ totalCoins: -1 }).select('_id');
            const rank = usersByCoins.findIndex(u => u._id.toString() === userId.toString()) + 1;
            console.log(`[getUserStats] User ${userId} stats: totalCoins=${user.totalCoins}, rank=${rank}`);

            res.status(200).json({
                success: true,
                stats: {
                    username: user.username,
                    totalCoins: user.totalCoins || 0,
                    rank: rank
                }
            });

        } catch (error) {
            console.error('[getUserStats] Error fetching user stats:', error.message);
            res.status(500).json({ success: false, message: 'Server error fetching user stats.', error: error.message });
        }
    },

    // --- New Task-related API Controllers ---

    getTasksState: async (req, res) => {
        console.log(`[getTasksState] Fetching tasks state for user: ${req.user.id}`);
        try {
            const userId = req.user.id;
            const user = await User.findById(userId).select('dailyClaimState quizState completedSocialTasks totalCoins');

            if (!user) {
                console.warn(`[getTasksState] User not found for ID: ${userId}`);
                return res.status(404).json({ success: false, message: 'User not found.' });
            }

            const now = Date.now();

            // Daily Claim State
            let dailyClaimInfo = {
                currentDay: user.dailyClaimState.lastClaimedDay ? (user.dailyClaimState.lastClaimedDay % 7) + 1 : 1, // Next day to claim, cycle 1-7
                lastClaimTime: user.dailyClaimState.lastClaimTime ? user.dailyClaimState.lastClaimTime.getTime() : 0,
                cooldownRemaining: 0,
                canClaim: false,
                lastClaimedDay: user.dailyClaimState.lastClaimedDay || 0 
            };
            if (dailyClaimInfo.lastClaimTime > 0) {
                const timeElapsed = now - dailyClaimInfo.lastClaimTime;
                if (timeElapsed < DAILY_CLAIM_COOLDOWN_MS) {
                    dailyClaimInfo.cooldownRemaining = DAILY_CLAIM_COOLDOWN_MS - timeElapsed;
                } else {
                    dailyClaimInfo.canClaim = true;
                }
            } else {
                dailyClaimInfo.canClaim = true; // First claim ever
            }
            console.log(`[getTasksState] Daily Claim Info for ${userId}:`, dailyClaimInfo);

            // Quiz State
            let quizInfo = {
                lastSubmissionTime: user.quizState.lastSubmissionTime ? user.quizState.lastSubmissionTime.getTime() : 0,
                cooldownRemaining: 0,
                canSubmit: false,
                currentQuiz: null
            };
            if (quizInfo.lastSubmissionTime > 0) {
                const timeElapsed = now - quizInfo.lastSubmissionTime;
                if (timeElapsed < QUIZ_COOLDOWN_MS) {
                    quizInfo.cooldownRemaining = QUIZ_COOLDOWN_MS - timeElapsed;
                } else {
                    quizInfo.canSubmit = true;
                    // Reset currentQuizId if cooldown is over and it's a new day for quiz
                    if (user.quizState.currentQuizId && now - quizInfo.lastSubmissionTime >= QUIZ_COOLDOWN_MS) {
                        user.quizState.currentQuizId = null; // Invalidate old quiz ID for new one
                        await user.save(); // Save to ensure currentQuizId is null
                    }
                }
            } else {
                quizInfo.canSubmit = true;
            }

            // Fetch an active quiz if available and user can submit
            if (quizInfo.canSubmit) {
                const activeQuiz = await Quiz.findOne({ isActive: true }).select('questionImageUrl _id');
                if (activeQuiz) {
                    quizInfo.currentQuiz = {
                        id: activeQuiz._id,
                        questionImageUrl: activeQuiz.questionImageUrl
                    };
                    // Update user's currentQuizId to reflect the quiz being presented
                    user.quizState.currentQuizId = activeQuiz._id;
                    await user.save();
                }
            }
            console.log(`[getTasksState] Quiz Info for ${userId}:`, quizInfo);
            
            // Social Tasks (Only return IDs of completed tasks)
            const completedSocialTasks = user.completedSocialTasks.map(id => id.toString());
            console.log(`[getTasksState] Completed Social Tasks for ${userId}:`, completedSocialTasks.length);


            res.status(200).json({
                success: true,
                dailyClaimInfo,
                quizInfo,
                completedSocialTasks,
                userTotalCoins: user.totalCoins 
            });

        } catch (error) {
            console.error('[getTasksState] Error fetching tasks state:', error.message);
            res.status(500).json({ success: false, message: 'Server error fetching tasks state.', error: error.message });
        }
    },

    claimDailyReward: async (req, res) => {
        console.log(`[claimDailyReward] Claim request for user: ${req.user.id}, day: ${req.body.dayToClaim}`);
        try {
            const userId = req.user.id;
            const { dayToClaim } = req.body; 

            if (!dayToClaim || dayToClaim < 1 || dayToClaim > 7) {
                console.warn(`[claimDailyReward] Invalid day to claim: ${dayToClaim}`);
                return res.status(400).json({ success: false, message: 'Invalid day to claim provided.' });
            }

            const user = await User.findById(userId);
            if (!user) {
                console.warn(`[claimDailyReward] User not found for ID: ${userId}`);
                return res.status(404).json({ success: false, message: 'User not found.' });
            }

            const now = Date.now();
            const { lastClaimedDay, lastClaimTime } = user.dailyClaimState;

            let expectedNextDay = lastClaimedDay ? (lastClaimedDay % 7) + 1 : 1;

            const cooldownPassed = (now - (lastClaimTime ? lastClaimTime.getTime() : 0)) >= DAILY_CLAIM_COOLDOWN_MS;

            if (dayToClaim !== expectedNextDay) {
                console.warn(`[claimDailyReward] Incorrect day claimed. Expected: ${expectedNextDay}, Received: ${dayToClaim}`);
                return res.status(400).json({ success: false, message: `Please claim Day ${expectedNextDay} first.` });
            }

            if (!cooldownPassed) {
                const remaining = DAILY_CLAIM_COOLDOWN_MS - (now - (lastClaimTime ? lastClaimTime.getTime() : 0));
                const hours = Math.floor(remaining / (1000 * 60 * 60));
                const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                console.warn(`[claimDailyReward] Cooldown active for user ${userId}. Remaining: ${hours}h ${minutes}m.`);
                return res.status(400).json({ success: false, message: `Cooldown active. Please wait ${hours}h ${minutes}m for next claim.` });
            }

            const reward = DAILY_REWARDS[dayToClaim];
            if (!reward) {
                console.error(`[claimDailyReward] No reward configured for day: ${dayToClaim}`);
                return res.status(400).json({ success: false, message: 'Invalid reward day configuration.' });
            }

            user.totalCoins += reward;
            user.dailyClaimState.lastClaimedDay = dayToClaim;
            user.dailyClaimState.lastClaimTime = now;

            if (dayToClaim === 7) {
                user.dailyClaimState.lastClaimedDay = 0; 
            }

            await user.save();
            console.log(`[claimDailyReward] User ${userId} successfully claimed Day ${dayToClaim} for ${reward} coins. New total: ${user.totalCoins}`);

            res.status(200).json({
                success: true,
                message: `Successfully claimed Day ${dayToClaim} reward!`,
                rewardCoins: reward,
                newTotalCoins: user.totalCoins,
                dailyClaimState: {
                    lastClaimedDay: user.dailyClaimState.lastClaimedDay,
                    lastClaimTime: user.dailyClaimState.lastClaimTime.getTime()
                }
            });

        } catch (error) {
            console.error('[claimDailyReward] Error claiming daily reward:', error.message);
            res.status(500).json({ success: false, message: 'Server error claiming daily reward.', error: error.message });
        }
    },

    submitDailyQuiz: async (req, res) => {
        console.log(`[submitDailyQuiz] Quiz submission for user: ${req.user.id}, quizId: ${req.body.quizId}`);
        try {
            const userId = req.user.id;
            const { quizId, userAnswer } = req.body;

            if (!quizId || !userAnswer || typeof userAnswer !== 'string') {
                console.warn('[submitDailyQuiz] Invalid quiz ID or answer provided.');
                return res.status(400).json({ success: false, message: 'Invalid quiz ID or answer provided.' });
            }

            const user = await User.findById(userId);
            if (!user) {
                console.warn(`[submitDailyQuiz] User not found for ID: ${userId}`);
                return res.status(404).json({ success: false, message: 'User not found.' });
            }

            const now = Date.now();
            const { lastSubmissionTime, currentQuizId, completedQuizIds } = user.quizState;

            const cooldownPassed = (now - (lastSubmissionTime ? lastSubmissionTime.getTime() : 0)) >= QUIZ_COOLDOWN_MS;
            if (!cooldownPassed) {
                const remaining = QUIZ_COOLDOWN_MS - (now - (lastSubmissionTime ? lastSubmissionTime.getTime() : 0));
                const hours = Math.floor(remaining / (1000 * 60 * 60));
                const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                console.warn(`[submitDailyQuiz] Cooldown active for user ${userId}. Remaining: ${hours}h ${minutes}m.`);
                return res.status(400).json({ success: false, message: `Quiz submission is on cooldown. Please wait ${hours}h ${minutes}m.` });
            }

            if (!currentQuizId || currentQuizId.toString() !== quizId) {
                console.warn(`[submitDailyQuiz] Quiz ID mismatch for user ${userId}. Current: ${currentQuizId}, Submitted: ${quizId}`);
                return res.status(400).json({ success: false, message: 'Quiz ID mismatch or no current quiz assigned. Please refresh.' });
            }

            if (completedQuizIds.includes(quizId)) {
                console.warn(`[submitDailyQuiz] User ${userId} already completed quiz ${quizId}.`);
                return res.status(400).json({ success: false, message: 'You have already completed this quiz.' });
            }

            const quiz = await Quiz.findById(quizId);
            if (!quiz || !quiz.isActive) {
                console.warn(`[submitDailyQuiz] Quiz ${quizId} not found or is inactive.`);
                return res.status(404).json({ success: false, message: 'Quiz not found or is inactive.' });
            }

            const isCorrect = (userAnswer.trim().toUpperCase() === quiz.correctAnswer.toUpperCase());
            let reward = 0;

            if (isCorrect) {
                reward = quiz.rewardCoins || DEFAULT_QUIZ_REWARD;
                user.totalCoins += reward;
                user.quizState.completedQuizIds.push(quizId); 
                console.log(`[submitDailyQuiz] User ${userId} answered correctly for quiz ${quizId}. Reward: ${reward}`);
            } else {
                console.log(`[submitDailyQuiz] User ${userId} answered incorrectly for quiz ${quizId}.`);
            }

            user.quizState.lastSubmissionTime = now;
            user.quizState.currentQuizId = null; 
            await user.save();

            res.status(200).json({
                success: true,
                isCorrect,
                rewardCoins: reward,
                newTotalCoins: user.totalCoins,
                message: isCorrect ? 'Correct answer! Coins added.' : 'Incorrect answer. Try again tomorrow!'
            });

        } catch (error) {
            console.error('[submitDailyQuiz] Error submitting daily quiz:', error.message);
            res.status(500).json({ success: false, message: 'Server error submitting quiz.', error: error.message });
        }
    },

    getSocialTasks: async (req, res) => {
        console.log(`[getSocialTasks] Fetching social tasks for user: ${req.user.id}, type: ${req.query.type}`);
        try {
            const { type } = req.query; 

            if (type && !['Toant', 'Partner'].includes(type)) {
                console.warn(`[getSocialTasks] Invalid social task type: ${type}`);
                return res.status(400).json({ success: false, message: 'Invalid social task type.' });
            }

            const filter = { isActive: true };
            if (type) {
                filter.type = type;
            }

            const socialTasks = await SocialTask.find(filter).select('_id name description link rewardCoins type');

            const userId = req.user.id;
            const user = await User.findById(userId).select('completedSocialTasks');
            const userCompletedTaskIds = user ? user.completedSocialTasks.map(id => id.toString()) : [];

            const tasksWithStatus = socialTasks.map(task => ({
                ...task._doc, 
                completed: userCompletedTaskIds.includes(task._id.toString())
            }));
            console.log(`[getSocialTasks] Found ${tasksWithStatus.length} social tasks.`);

            res.status(200).json({
                success: true,
                tasks: tasksWithStatus
            });

        } catch (error) {
            console.error('[getSocialTasks] Error fetching social tasks:', error.message);
            res.status(500).json({ success: false, message: 'Server error fetching social tasks.', error: error.message });
        }
    },

    completeSocialTask: async (req, res) => {
        console.log(`[completeSocialTask] Completion request for user: ${req.user.id}, taskId: ${req.body.taskId}`);
        try {
            const userId = req.user.id;
            const { taskId } = req.body;

            if (!taskId) {
                console.warn('[completeSocialTask] Task ID is required.');
                return res.status(400).json({ success: false, message: 'Task ID is required.' });
            }

            const user = await User.findById(userId);
            if (!user) {
                console.warn(`[completeSocialTask] User not found for ID: ${userId}`);
                return res.status(404).json({ success: false, message: 'User not found.' });
            }

            const socialTask = await SocialTask.findById(taskId);
            if (!socialTask || !socialTask.isActive) {
                console.warn(`[completeSocialTask] Social task ${taskId} not found or is inactive.`);
                return res.status(404).json({ success: false, message: 'Social task not found or is inactive.' });
            }

            if (user.completedSocialTasks.includes(taskId)) {
                console.warn(`[completeSocialTask] User ${userId} already completed task ${taskId}.`);
                return res.status(400).json({ success: false, message: 'You have already completed this task.' });
            }

            user.totalCoins += socialTask.rewardCoins;
            user.completedSocialTasks.push(taskId);
            await user.save();
            console.log(`[completeSocialTask] User ${userId} completed task ${taskId} and earned ${socialTask.rewardCoins} coins. New total: ${user.totalCoins}`);

            res.status(200).json({
                success: true,
                message: `Successfully completed "${socialTask.name}" and earned ${socialTask.rewardCoins} coins!`,
                rewardCoins: socialTask.rewardCoins,
                newTotalCoins: user.totalCoins
            });

        } catch (error) {
            console.error('[completeSocialTask] Error completing social task:', error.message);
            res.status(500).json({ success: false, message: 'Server error completing social task.', error: error.message });
        }
    },

    // ---- NEW: Get Dashboard Cards Data ----
    getDashboardCardsData: async (req, res) => {
        console.log("[getDashboardCardsData] Fetching dashboard cards data for user:", req.user.id);
        try {
            const userId = req.user.id;

         
            const user = await User.findById(userId).select('totalCoins tonBalance toantBalance referralCode');
            console.log("[getDashboardCardsData] User data fetched:", user);

            if (!user) {
                console.warn("[getDashboardCardsData] User not found for ID:", userId);
                return res.status(404).json({ message: 'User not found.' });
            }

         
            const totalWithdrawals = await Withdrawal.aggregate([
                { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'Completed' } }, 
                {
                    $group: {
                        _id: null,
                        totalUsdWithdraw: {
                            $sum: {
                                $cond: {
                                    if: { $eq: ["$coinType", "Toant"] }, // Assuming Toant is converted to USD or is equivalent to USDT
                                    then: "$finalAmount",
                                    else: 0
                                }
                            }
                        },
                        totalTonWithdraw: {
                            $sum: {
                                $cond: {
                                    if: { $eq: ["$coinType", "Ton"] },
                                    then: "$finalAmount",
                                    else: 0
                                }
                            }
                        }
                    }
                }
            ]);
            console.log("[getDashboardCardsData] Total withdrawals aggregated:", totalWithdrawals);

            const totalWithdrawUsd = totalWithdrawals.length > 0 ? totalWithdrawals[0].totalUsdWithdraw : 0;
            const totalWithdrawTon = totalWithdrawals.length > 0 ? totalWithdrawals[0].totalTonWithdraw : 0;

          
            const dashboardData = {
                totalMiningToant: user.totalCoins || 0, // Assuming totalCoins represents total mining
                totalEarningUsdt: user.toantBalance || 0, 
                totalEarningTon: user.tonBalance || 0,
                totalWithdrawUsd: totalWithdrawUsd,
                totalWithdrawTon: totalWithdrawTon,
                rafferLink: `${process.env.FRONTEND_URL || 'http://toant.store'}/register?ref=${user.referralCode}` 
            };
            console.log("[getDashboardCardsData] Dashboard data prepared:", dashboardData);

            res.status(200).json(dashboardData);

        } catch (error) {
            console.error('[getDashboardCardsData] Error fetching dashboard cards data:', error);
            res.status(500).json({ message: 'Server error while fetching dashboard data', error: error.message });
        }
    }
};

module.exports = apiController;
