 // server/models/leaderboardModel.js 
// The leaderboard data initially comes from the User model (for exampole, totalCoins).
// This file serves as a placeholder for compatibility, or if you later
// decide to have a separate denormalized leaderboard specific model.
// For now, this re-exports the User model for simplicity.
const User = require('./User');
module.exports = User;