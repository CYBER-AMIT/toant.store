// server/controllers/leaderboardController.js
const User = require('../models/User');
const WebSocket = require('ws');

let wss;

exports.initWebSocket = (webSocketServer) => {
    wss = webSocketServer;
    console.log("WebSocket server initialized in leaderboardController.");
};

exports.sendLeaderboardUpdate = async (updatedUserId = null) => {
    if (!wss) {
        console.warn("WebSocket server not initialized. Cannot send leaderboard update.");
        return;
    }

    try {
        const topPlayers = await User.find({})
            .sort({ totalCoins: -1 })
            .limit(100)
            .select('username totalCoins');

        const formattedTopPlayers = topPlayers.map((user, index) => ({
            rank: index + 1,
            name: user.username,
            coins: user.totalCoins
        }));

        const totalUsers = await User.countDocuments({});

        const firstPlace = formattedTopPlayers[0] || null;
        const secondPlace = formattedTopPlayers[1] || null;
        const thirdPlace = formattedTopPlayers[2] || null;

        let currentPlayer = null;
        if (updatedUserId) {
            const user = await User.findById(updatedUserId).select('username totalCoins');
            if (user) {
                const userRank = await User.countDocuments({ totalCoins: { $gt: user.totalCoins } }) + 1;
                currentPlayer = {
                    id: user._id,
                    name: user.username,
                    coins: user.totalCoins,
                    rank: userRank
                };
            }
        }

        const leaderboardData = {
            type: 'leaderboard_update',
            total_users: totalUsers,
            first_place: firstPlace,
            second_place: secondPlace,
            third_place: thirdPlace,
            top_players: formattedTopPlayers,
            current_player_updated: currentPlayer
        };

        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(leaderboardData));
            }
        });
        console.log("Leaderboard update sent via WebSocket.");

    } catch (error) {
        console.error('Error sending leaderboard update:', error);
    }
};

exports.getLeaderboard = async (req, res) => {
    try {
        const topPlayers = await User.find({})
            .sort({ totalCoins: -1 })
            .limit(100)
            .select('username totalCoins');

        const formattedTopPlayers = topPlayers.map((user, index) => ({
            rank: index + 1,
            name: user.username,
            coins: user.totalCoins
        }));

        const totalUsers = await User.countDocuments({});

        const firstPlace = formattedTopPlayers[0] || null;
        const secondPlace = formattedTopPlayers[1] || null;
        const thirdPlace = formattedTopPlayers[2] || null;

        let currentPlayer = null;
        if (req.user && req.user.id) {
            const user = await User.findById(req.user.id).select('username totalCoins');
            if (user) {
                const userRank = await User.countDocuments({ totalCoins: { $gt: user.totalCoins } }) + 1;
                currentPlayer = {
                    id: user._id,
                    name: user.username,
                    coins: user.totalCoins,
                    rank: userRank
                };
            }
        }

        res.status(200).json({
            success: true,
            total_users: totalUsers,
            first_place: firstPlace,
            second_place: secondPlace,
            third_place: thirdPlace,
            top_players: formattedTopPlayers,
            current_player: currentPlayer
        });

    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch leaderboard data.', error: error.message });
    }
};