const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Optional Auth Middleware
const optionalAuth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
      }
    } catch (err) {
      // Ignore token errors; user stays unauthenticated
    }
  }
  next();
};

// GET /api/posts - Get all published posts (PUBLIC)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ published: true })
      .populate('author', 'username')
      .sort({ publishedAt: -1 })
      .limit(limit)
      .skip(skip);

    const totalPosts = await Post.countDocuments({ published: true });
    const totalPages = Math.ceil(totalPosts / limit);

    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/posts/:id - Get single post (PUBLIC + optional auth)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Show draft only to the author
    if (!post.published && post.author._id.toString() !== req.user?._id?.toString()) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Increment views for published posts
    if (post.published) {
      post.views += 1;
      await post.save();
    }

    res.json(post);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Invalid post ID' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/posts - Create new post (PROTECTED)
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, tags, published } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const post = new Post({
      title,
      content,
      author: req.user._id,
      tags: tags || [],
      published: published || false
    });

    await post.save();
    await post.populate('author', 'username');

    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/posts/:id - Update post (PROTECTED, author only)
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content, tags, published } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only edit your own posts' });
    }

    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;
    if (tags !== undefined) post.tags = tags;
    if (published !== undefined) post.published = published;

    await post.save();
    await post.populate('author', 'username');

    res.json({
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/posts/:id - Delete post (PROTECTED, author only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own posts' });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/posts/user/me - Get current user's posts (PROTECTED)
router.get('/user/me', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ author: req.user._id })
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const totalPosts = await Post.countDocuments({ author: req.user._id });
    const totalPages = Math.ceil(totalPosts / limit);

    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
