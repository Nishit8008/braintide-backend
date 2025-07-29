const jwt = require('jsonwebtoken');
const User = require('../models/User');

// MIDDLEWARE: Verify JWT token and protect routes
const auth = async (req, res, next) => {
  try {
    // 1. EXTRACT token from Authorization header
    // Format: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.replace('Bearer ', '') 
      : null;
    
    // 2. CHECK if token exists
    if (!token) {
      return res.status(401).json({ 
        message: 'No token provided, authorization denied' 
      });
    }
    
    // 3. VERIFY token is valid and not expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. FIND user from the token's user ID
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        message: 'User not found, authorization denied' 
      });
    }
    
    // 5. ADD user to request object for use in routes
    req.user = user;
    
    // 6. CONTINUE to the next middleware or route handler
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    
    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired' 
      });
    }
    
    // Generic error
    res.status(500).json({ 
      message: 'Server error in authentication' 
    });
  }
};

module.exports = auth;