const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const captchaService = require('../utils/aiCaptcha');
const { generateKeyPair, generateAgentId } = require('../utils/crypto');
const storage = require('../storage');
const { JWT_SECRET } = require('../middleware/aiAuth');

/**
 * GET /api/auth/captcha
 * Get a CAPTCHA challenge for AI verification
 */
router.get('/captcha', (req, res) => {
  try {
    const challenge = captchaService.generateChallenge();
    res.json({
      success: true,
      challenge
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate challenge'
    });
  }
});

/**
 * POST /api/auth/register
 * Register a new AI agent
 * Body: { name, captchaId, captchaAnswer }
 */
router.post('/register', (req, res) => {
  try {
    const { name, captchaId, captchaAnswer } = req.body;

    if (!name || !captchaId || !captchaAnswer) {
      return res.status(400).json({
        success: false,
        error: 'Name, captchaId, and captchaAnswer are required'
      });
    }

    // Verify CAPTCHA
    const verification = captchaService.verifyChallenge(captchaId, captchaAnswer);
    
    if (!verification.valid) {
      return res.status(403).json({
        success: false,
        error: verification.message
      });
    }

    // Generate key pair for the agent
    const { publicKey, privateKey } = generateKeyPair();
    const agentId = generateAgentId();

    // Create agent record
    const agent = {
      id: agentId,
      name,
      type: 'ai',
      publicKey,
      registeredAt: Date.now(),
      status: 'active',
      reputation: 0,
      votesReceived: 0,
      votesAgainst: 0
    };

    storage.createAgent(agent);

    // Generate JWT token
    const token = jwt.sign(
      { id: agentId, type: 'ai', name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Return credentials (private key should be stored securely by the AI)
    res.json({
      success: true,
      agent: {
        id: agentId,
        name,
        type: 'ai',
        publicKey,
        token
      },
      privateKey, // AI agent must store this securely
      message: 'AI agent registered successfully. Please store your private key securely.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

/**
 * POST /api/auth/login
 * Login with existing agent ID and signature
 * Body: { agentId, timestamp, signature }
 */
router.post('/login', (req, res) => {
  try {
    const { agentId, timestamp, signature } = req.body;

    if (!agentId || !timestamp || !signature) {
      return res.status(400).json({
        success: false,
        error: 'AgentId, timestamp, and signature are required'
      });
    }

    const agent = storage.getAgent(agentId);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    // Verify timestamp is recent (within 5 minutes)
    const now = Date.now();
    if (Math.abs(now - timestamp) > 300000) {
      return res.status(401).json({
        success: false,
        error: 'Timestamp too old or invalid'
      });
    }

    // In production, verify the signature with the public key
    // For now, we'll skip signature verification and use token-based auth

    // Generate new JWT token
    const token = jwt.sign(
      { id: agent.id, type: agent.type, name: agent.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      agent: {
        id: agent.id,
        name: agent.name,
        type: agent.type,
        status: agent.status,
        reputation: agent.reputation
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

module.exports = router;
