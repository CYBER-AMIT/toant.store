// server/controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { processReferral } = require('../utils/referralUtils');
dotenv.config();
console.log(" authController.js load succesfull..");

exports.register = async (req, res) => {
    try {
        const { username, email, password, referralCode } = req.body;
        console.log(`[Register Request] Received - Username: ${username}, Email: ${email}, ReferralCode: ${referralCode}`);

        let user = await User.findOne({ email });
        if (user) {
            console.log(`[Register Error] Email already exists: ${email}`);
            return res.status(400).json({ success: false, message: 'User already exists with this email.' });
        }

        let existingUsername = await User.findOne({ username });
        if (existingUsername) {
            console.log(`[Register Error] Username already taken: ${username}`);
            return res.status(400).json({ success: false, message: 'Username is already taken.' });
        }

        user = new User({ username, email, password });
        console.log(`[Register] New user instance created.`);

        let referrer = null;
        if (referralCode) {
            console.log(`[Register] Attempting to find referrer with code: '${referralCode.toUpperCase()}'`);
            referrer = await User.findOne({ referralCode: referralCode.toUpperCase() }); 
            if (referrer) {
                user.referredBy = referrer._id;
                console.log(`[Register] REFERRER FOUND! User ${referrer.username} (${referrer._id}) is the referrer.`);
            } else {
                console.warn(`[Register] WARNING: Referral Code '${referralCode}' not found in DB. User will register without a referrer.`);
            }
        } else {
            console.log(`[Register] No referralCode provided. User will register without a referrer.`);
        }

        await user.save();
        console.log(`[Register] New user ${user.username} (${user._id}) saved successfully. Generated referralCode: ${user.referralCode}`);


        if (referrer && referrer._id && user._id) {
            console.log(`[Register] Calling processReferral for referrer ${referrer._id} and new user ${user._id}`);
            await processReferral(referrer._id, user._id);
            console.log(`[Register] processReferral completed successfully.`);
        } else {
            console.log(`[Register] No valid referrer to process for rewards/tracking.`);
        }

        const token = jwt.sign(
            { id: user._id, role: user.role || 'user' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        console.log(`[Register] JWT token generated for user ${user.username}`);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                totalCoins: user.totalCoins,
                role: user.role,
                referralCode: user.referralCode 
            }
        });
        console.log(`[Register] Registration response sent for ${user.username}.`);

    } catch (err) {
        console.error('[Register ERROR] An error occurred during registration:', err);  
        if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            return res.status(400).json({ success: false, message: `${field} already exists.` });
        }
        res.status(500).json({ success: false, message: 'Server error during registration.' });
    }
};
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body; // Changed from email to username for login

        // Find user by username
        const user = await User.findOne({ username }); 
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid credentials (username not found).' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid credentials (wrong password).' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role || 'user' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({ 
            success: true, 
            message: 'Logged in successfully', 
            token, 
            user: { 
                id: user._id, 
                username: user.username, 
                email: user.email, 
                totalCoins: user.totalCoins, 
                role: user.role,
                referralCode: user.referralCode 
            } 
        });
    } catch (err) {
        console.error('Error during login:', err.message);
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
};