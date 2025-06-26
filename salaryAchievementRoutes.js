// server/routes/salaryAchievementRoutes.js
const express = require('express');
const router = express.Router();
const salaryAchievementController = require('../controllers/salaryAchievementController');
const verifyToken = require('../middleware/auth');

console.log('🧪 verifyToken type in salaryAchievementRoutes:', typeof verifyToken);
console.log('🧪 getSalaryAchievements type in controller:', typeof salaryAchievementController.getSalaryAchievements);
console.log('🧪 checkSalaryAchievements type in controller:', typeof salaryAchievementController.checkSalaryAchievements);


router.use(verifyToken);

router.get('/salary-achievements', salaryAchievementController.getSalaryAchievements);
router.post('/check-salary-achievement', salaryAchievementController.checkSalaryAchievements);

module.exports = router;