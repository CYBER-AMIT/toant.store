// server/routes/api.js
const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');
const verifyToken = require('../middleware/auth'); 
const referralController = require('../controllers/referralController'); 

// Existing route
router.get('/user/stats', verifyToken, apiController.getUserStats);

// --- NEW: Dashboard Cards Data Route ---
router.get('/dashboard-cards-data', verifyToken, apiController.getDashboardCardsData);

// --- New Task-related routes ---
// Get user's current task states (daily claim, quiz, social tasks)
router.get('/tasks/state', verifyToken, apiController.getTasksState);

// Claim daily reward
router.post('/tasks/claim-daily-reward', verifyToken, apiController.claimDailyReward);

// Submit daily quiz
router.post('/tasks/submit-quiz', verifyToken, apiController.submitDailyQuiz);

// Get social tasks (Toant/Partner)
router.get('/tasks/social-tasks', verifyToken, apiController.getSocialTasks);

// Complete a social task
router.post('/tasks/complete-social-task', verifyToken, apiController.completeSocialTask);

// (NEW ADDITION) --- Referral System Routes ---
// Get user's referral data (link, list, stats)
router.get('/referrals/data', verifyToken, referralController.getReferralData);

module.exports = router;