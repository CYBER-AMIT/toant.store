const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const http = require('http');
const WebSocket = require('ws');
const path = require('path');  

dotenv.config();
const app = express();

const verifyToken = require('./auth');  
 
// ---- Middleware ---- //
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"], 
    credentials: true
}));
app.use(helmet());
app.use(express.json());

// ---- Rate Limiter ---- //
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // maximum 100 requests per 15 minutes per IP
}));

// ---- Database Connection ---- //
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.error("MongoDB Error:", err));

// ---- Routes ---- //
const authRoutes = require("./authRoutes");
const gameRoutes = require("./gameRoutes");
const leaderboardRoutes = require("./leaderboardRoutes");
const salaryAchievementRoutes = require("./salaryAchievementRoutes");
const apiRoutes = require("./api"); 
const walletRoutes = require("./walletRoutes"); 

// --- NEW: Import support routes ---
const supportRoutes = require('./supportRoutes');
// --- END NEW ---

// Mount the routes to the application
// IMPORTANT: Place authRoutes first IF it itself needs to be public (login/register).
// Otherwise, the order doesn't matter as much for other authenticated routes.

// If authRoutes contains PUBLIC routes like /register, /login, keep it like this.
app.use("/api", authRoutes); // Auth routes (like register/login) are typically public

// Apply authentication middleware to all other API routes that require it
app.use("/api/game", verifyToken, gameRoutes);
app.use("/api", verifyToken, leaderboardRoutes);
app.use("/api", verifyToken, salaryAchievementRoutes);
app.use("/api", verifyToken, apiRoutes); 
app.use("/api/wallet", verifyToken, walletRoutes);

// --- NEW: Apply verifyToken middleware to supportRoutes as well ---
app.use('/api', verifyToken, supportRoutes);
// --- END NEW ---
 

// Route to check if server is running
app.get('/', (req, res) => {
    res.send('Server is running');
});


// Static files serving for Clint directory
app.use(express.static(path.join(__dirname, '..', 'Client'))); 
app.use('/Client/assest', express.static(path.join(__dirname, '..', 'Client', 'assest'))); 

app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'Client', 'dashboard.html'));
});
app.get('/tasks.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'Client', 'tasks.html'));
});

app.get('/wallets.html', (req, res) => { 
    res.sendFile(path.join(__dirname, '..', 'Client', 'wallets.html'));
});


// ---- Server Start and WebSocket Initialization ---- //
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Initialize WebSocket server
const wss = new WebSocket.Server({ server });

// WebSocket connection event handler
wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket.');
    ws.on('message', (message) => {
        console.log(`Received message: ${message}`);
    });
    ws.on('close', () => {
        console.log('Client disconnected from WebSocket.');
    });
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});


const leaderboardController = require('./controllers/leaderboardController'); 
leaderboardController.initWebSocket(wss);

// Start the server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
