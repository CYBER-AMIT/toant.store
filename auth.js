// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log("Auth Middleware: Token received:", token ? token.substring(0, 30) + '...' : 'No Token');
    console.log("Auth Middleware: JWT_SECRET:", process.env.JWT_SECRET);

    if (token == null) {
        console.log("Auth Error: No token provided");
        return res.status(401).json({ success: false, message: "No authentication token provided." });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log("Auth Error: JWT verification failed.");
            console.error("JWT Error Object:", err);
            console.log("Error Message:", err.message);

            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ success: false, message: "Authentication token expired. Please log in again." });
            }
            return res.status(403).json({ success: false, message: "Invalid authentication token." });
        }

        console.log("JWT verification successful. Decoded payload:", decoded);

        if (!decoded || !decoded.id) {
            console.error("User ID not found in decoded payload:", decoded);
            return res.status(403).json({ success: false, message: "User information missing in token." });
        }

        req.user = {
            id: decoded.id,
            role: decoded.role || 'user'
        };

        console.log("Auth Success: User ID", req.user.id, "Role:", req.user.role);
        next();
    });
};

module.exports = verifyToken;