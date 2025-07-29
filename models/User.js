const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define what a User looks like in our database
const userSchema = new mongoose.Schema({
  username: {
    type: String,        // Must be text
    required: true,      // Cannot be empty
    unique: true,        // No two users can have same username
    trim: true,          // Removes spaces from beginning/end
    minlength: 3,        // At least 3 characters
    maxlength: 30        // Max 30 characters
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,     // Converts to lowercase before saving
    match: [             // Basic email validation
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  password: {
    type: String,
    required: true,
    minlength: 6         // Must be at least 6 characters
  }
}, {
  timestamps: true       // Automatically adds createdAt and updatedAt
});

// MIDDLEWARE: Hash password before saving to database
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 10
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// CUSTOM METHOD: Compare password during login
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    // Compare plain text password with hashed password
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// CUSTOM METHOD: Convert user to JSON (remove password)
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;  // Never send password in response
  return user;
};

module.exports = mongoose.model('User', userSchema);