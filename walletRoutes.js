 const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const protect = require('../middleware/auth');
 
router.get('/balance', protect, walletController.getWalletBalance);

router.post('/withdraw', protect, walletController.requestWithdrawal);
 
router.get('/history', protect, walletController.getWithdrawalHistory);

module.exports = router;