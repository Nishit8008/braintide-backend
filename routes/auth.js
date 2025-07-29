const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Test route first - just to make sure routing works
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes are working!' });
});

// REGISTER ROUTE
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists' 
      });
    }
    
    // Create new user
    const user = new User({ username, email, password });
    await user.save();
    
    // Create JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Send response
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email 
      }
    });
    
  } catch (error) {
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// LOGIN ROUTE
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid credentials' 
      });
    }
    
    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ 
        message: 'Invalid credentials' 
      });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Send response
    res.json({
      message: 'Login successful',
      token,
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email 
      }
    });
    
  } catch (error) {
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// PROFILE ROUTE (Protected)
router.get('/profile', auth, async (req, res) => {
  try {
    res.json({
      message: 'Profile data',
      user: req.user
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;