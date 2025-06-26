// server/routes/authRoutes.js //
const express = require("express");
const router = express.Router();
const User = require("../models/User");
console.log('🧪 User Model type:', typeof User); 
console.log('🧪 User.findOne type:', typeof User.findOne)
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authController = require("../controllers/authController");
// ---- Register API ---- //
router.post("/register", authController.register);
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body; 

    // ---- Username and Email Check ---- //
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: "Username or email already exists!" 
      });
    }

    const user = new User({ username, email, password });
    await user.save();

    res.json({ 
      success: true, 
      message: "User registered successfully!" 
    }); 
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Server error during registration", 
      error: error.message 
    });
  }
});

// ---- Login API ---- //
router.post("/login", authController.login);
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found!" 
      });
    }

    // ---- Hash Password Compare ---- //
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid password!" 
      });
    }

    // ---- JWT Token ---- //
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { 
      expiresIn: "1h" 
    });

    // ---- Response data (Excluding Password) ---- //
    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      coins: user.coins || 0, 
      createdAt: user.createdAt,
      lastLogin: new Date()
    };

    res.json({ 
      success: true, 
      token, 
      user: userData 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Server error during login", 
      error: error.message 
    });
  }
});

module.exports = router;