const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

dotenv.config();

const authRoutes = require('./routes/auth');
const communityRoutes = require('./routes/community');
const nodeRoutes = require('./routes/node');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});

// Stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many authentication attempts, please try again later.'
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/node', nodeRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'GPTown AI Community Server' });
});

// Start server
app.listen(PORT, () => {
  console.log(`GPTown server listening on port ${PORT}`);
});

module.exports = app;
