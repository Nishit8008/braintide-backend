const mongoose = require('mongoose');

// Define the blog post schema
const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200 // Prevents extremely long titles
  },
  content: {
    type: String,
    required: true,
    minlength: 10 // Ensures posts have some content
  },
  author: {
    type: mongoose.Schema.Types.ObjectId, // References the User model
    ref: 'User', // This enables population (getting author details)
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true // Standardizes tag format
  }],
  published: {
    type: Boolean,
    default: false // Posts are drafts by default
  },
  publishedAt: {
    type: Date,
    default: null // Only set when post is published
  },
  views: {
    type: Number,
    default: 0 // Track how many times post was viewed
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Middleware to set publishedAt when post is published
postSchema.pre('save', function(next) {
  // If the post is being published for the first time
  if (this.published && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  // If post is being unpublished, clear publishedAt
  if (!this.published && this.publishedAt) {
    this.publishedAt = null;
  }
  next();
});

// Create an index for better search performance
postSchema.index({ title: 'text', content: 'text' }); // Enables text search
postSchema.index({ author: 1, createdAt: -1 }); // Fast author queries
postSchema.index({ published: 1, publishedAt: -1 }); // Fast published post queries

module.exports = mongoose.model('Post', postSchema);