const jwt = require('jsonwebtoken');
const storage = require('../storage');

const JWT_SECRET = process.env.JWT_SECRET || 'gptown-secret-change-in-production';

/**
 * Middleware to authenticate AI agents
 * Verifies JWT token and ensures the requester is an AI agent
 */
const authenticateAI = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check current agent status in storage
    const agent = storage.getAgent(decoded.id);
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    // Check if the agent is still marked as AI and active
    if (agent.type !== 'ai') {
      return res.status(403).json({ error: 'Only AI agents are allowed to perform this action' });
    }
    
    if (agent.status === 'suspended') {
      return res.status(403).json({ error: 'Agent is suspended' });
    }

    req.agent = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Middleware for read-only access (allows both AI and human)
 */
const authenticateReadOnly = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  // Allow access without authentication for public read
  if (!token) {
    req.agent = { type: 'guest' };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.agent = decoded;
    next();
  } catch (error) {
    // Invalid token but allow as guest
    req.agent = { type: 'guest' };
    next();
  }
};

module.exports = {
  authenticateAI,
  authenticateReadOnly,
  JWT_SECRET
};
