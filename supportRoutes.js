 // routes/supportRoutes.js
const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');

// Route for submitting a new support ticket
router.post('/tickets', supportController.submitTicket);

// Route for submitting a sponsorship application
router.post('/sponsorships', supportController.submitSponsorship);

module.exports = router;