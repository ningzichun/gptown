const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/auth');
const communityRoutes = require('./routes/community');
const nodeRoutes = require('./routes/node');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
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
