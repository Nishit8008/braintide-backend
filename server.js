const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Test importing auth middleware
const auth = require('./middleware/auth');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blogapi')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ MongoDB connection error:', err));

// Add auth routes (AFTER app is created)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Server is working!',
    timestamp: new Date().toISOString()
  });
});

// Another test route
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Test route working!',
    server: 'Blog API'
  });
});

// Test User model - let's make sure it works
app.post('/test-user', async (req, res) => {
  try {
    const User = require('./models/User');
    const { username, email, password } = req.body;
    
    const user = new User({
      username,
      email, 
      password
    });
    
    await user.save();
    
    res.status(201).json({
      message: 'User created successfully!',
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(400).json({ 
      message: 'Error creating user',
      error: error.message 
    });
  }
});

app.get('/test-users', async (req, res) => {
  try {
    const User = require('./models/User');
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching users',
      error: error.message 
    });
  }
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('✅ Basic server is working!');
});

module.exports = app;