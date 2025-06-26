// server/routes/gameRoutes.js
const express = require('express');
const router = express.Router();
const GameData = require('../models/GameModel');
const User = require('../models/User');
const verifyToken = require('../middleware/auth');
const leaderboardController = require('../controllers/leaderboardController');

const BALL_SCORE_TO_COIN_RATIO = 200; // 200 ball score = 1 coin
const STAR_SCORE_TO_COIN_RATIO = 10;  // 1 star = 10 coins

// Apply verifyToken middleware to all routes in this router
router.use(verifyToken);

// @route POST /api/game/save-data
// @desc Save game session data and update user's cumulative scores, level, and coins
// @access Private
router.post('/save-data', async (req, res) => {
  try {
    const userId = req.user.id;
    // 'points' here refers to ball score from the game session
    const { playerName, level, points, stars } = req.body; 

    // --- START DEBUGGING LOGS ---
    console.log(`--- Game Save Request for User: ${userId} ---`);

    console.log('Received raw game data from client:', { playerName, level, points, stars });
    // --- END DEBUGGING LOGS ---

    // Input validation
    if (!playerName || typeof playerName !== 'string' || playerName.trim() === '' ||
        typeof level !== 'number' || level < 0 ||
        typeof points !== 'number' || points < 0 || // 'points' is ball score
        typeof stars !== 'number' || stars < 0) {
        console.error('Received invalid game data types for saving:', req.body);
        return res.status(400).json({ success: false, message: 'Invalid game data received. Player Name must be valid and Level, points (ball score), and stars must be valid non-negative numbers.' });
    }

    // Fetch current user data before updating
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found for updating scores.' });
    }

    // --- START DEBUGGING LOGS ---
    console.log('User data BEFORE update:', {
        totalBallScore: user.totalBallScore,
        totalStarScore: user.totalStarScore,
        highestLevelReached: user.highestLevelReached,
        totalCoins: user.totalCoins
    });
    // --- END DEBUGGING LOGS ---

    // Save individual game session data to GameData model (optional, if you want to keep session history)
    const newGameData = new GameData({
      user: userId,
      playerName: playerName,
      level: level,
      points: points, // This is the ball score for this session
      stars: stars
    });
    await newGameData.save();
    console.log(`Game session data saved for user ${userId}. Session ID: ${newGameData._id}`);


    // Update cumulative ball score and star score
    const prevTotalBallScore = user.totalBallScore || 0;
    const prevTotalStarScore = user.totalStarScore || 0;
    const prevTotalCoins = user.totalCoins || 0;

    user.totalBallScore = prevTotalBallScore + points; // points = ball score
    user.totalStarScore = prevTotalStarScore + stars;

    // Update highest level reached
    if (level > (user.highestLevelReached || 0)) {
        user.highestLevelReached = level;
    }

    // Calculate coins based on your new requirements: 200 ball score = 1 coin & 1 star = 10 coin
    // Coins earned in this specific game session
    const newCoinsFromBallScore = Math.floor(points / BALL_SCORE_TO_COIN_RATIO);
    const newCoinsFromStarScore = stars * STAR_SCORE_TO_COIN_RATIO;
    const totalNewCoinsEarned = newCoinsFromBallScore + newCoinsFromStarScore;

    // --- START DEBUGGING LOGS ---
    console.log(`Calculated coins for THIS session:`);
console.log(`  From Ball Score (${points}): ${newCoinsFromBallScore} coins`);
console.log(`  From Stars (${stars}): ${newCoinsFromStarScore} coins`);
console.log(`  Total new coins earned in THIS session: ${totalNewCoinsEarned} coins`);

    // --- END DEBUGGING LOGS ---

    // Update total coins (this is the single, central coin pool)
    user.totalCoins = prevTotalCoins + totalNewCoinsEarned;

    await user.save(); // Save the updated user data to MongoDB

    // --- START DEBUGGING LOGS ---
    console.log('User data AFTER update:', {
        totalBallScore: user.totalBallScore,
        totalStarScore: user.totalStarScore,
        highestLevelReached: user.highestLevelReached,
        totalCoins: user.totalCoins
    });
    console.log(`--- Game Save Request END for User: ${userId} ---`);

    // --- END DEBUGGING LOGS ---

    // Trigger WebSocket update for leaderboard
    await leaderboardController.sendLeaderboardUpdate(userId);

    res.status(200).json({
        success: true,
        message: 'Game data saved and user cumulative stats, including coins, updated successfully.',
        gameSession: newGameData, // The newly created game session record
        updatedUserStats: {
            totalBallScore: user.totalBallScore,
            totalStarScore: user.totalStarScore,
            highestLevelReached: user.highestLevelReached,
            totalCoins: user.totalCoins
        },
        coinsEarnedInThisSession: totalNewCoinsEarned // How many coins were earned in this particular game session
    });

  } catch (error) {
    console.error('Error in /api/game/save-data route:', error.message);
    const statusCode = error.status || 500;
    const message = error.message || 'Server error occurred while saving game data or updating user stats.';
    res.status(statusCode).json({ success: false, message: message, error: error.message });
  }
});
module.exports = router;