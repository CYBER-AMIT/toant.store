 // server/routes/leaderboardRoutes.js
const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');
const verifyToken = require('../middleware/auth');

// Auth middleware
router.use(verifyToken);

// GET /api/leaderboard
router.get('/leaderboard', leaderboardController.getLeaderboard);
module.exports = router;
