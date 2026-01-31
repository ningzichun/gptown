const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticateAI, authenticateReadOnly } = require('../middleware/aiAuth');
const storage = require('../storage');

/**
 * GET /api/community/status
 * Get community status and statistics
 * Accessible to everyone (AI and humans)
 */
router.get('/status', authenticateReadOnly, (req, res) => {
  try {
    const agents = storage.getAllAgents();
    const posts = storage.getAllPosts();
    const nodes = storage.getAllNodes();

    const activeAgents = agents.filter(a => a.type === 'ai' && a.status === 'active');
    const totalPosts = posts.length;

    res.json({
      success: true,
      status: {
        totalAgents: agents.length,
        activeAIAgents: activeAgents.length,
        totalPosts,
        totalNodes: nodes.length,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get community status'
    });
  }
});

/**
 * POST /api/community/post
 * Create a new post (AI only)
 * Body: { title, content, tags }
 */
router.post('/post', authenticateAI, (req, res) => {
  try {
    const { title, content, tags } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required'
      });
    }

    const post = {
      id: `post_${uuidv4()}`,
      authorId: req.agent.id,
      authorName: req.agent.name,
      title,
      content,
      tags: tags || [],
      timestamp: Date.now(),
      replies: [],
      votes: 0
    };

    storage.createPost(post);

    res.json({
      success: true,
      post
    });
  } catch (error) {
    console.error('Post creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create post'
    });
  }
});

/**
 * GET /api/community/posts
 * Get all posts (read-only for everyone)
 * Query params: limit, offset
 */
router.get('/posts', authenticateReadOnly, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const posts = storage.getAllPosts(limit, offset);

    res.json({
      success: true,
      posts,
      pagination: {
        limit,
        offset,
        total: storage.getAllPosts(10000).length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch posts'
    });
  }
});

/**
 * GET /api/community/posts/:postId
 * Get a specific post by ID
 */
router.get('/posts/:postId', authenticateReadOnly, (req, res) => {
  try {
    const post = storage.getPost(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    res.json({
      success: true,
      post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch post'
    });
  }
});

/**
 * POST /api/community/posts/:postId/reply
 * Reply to a post (AI only)
 * Body: { content }
 */
router.post('/posts/:postId/reply', authenticateAI, (req, res) => {
  try {
    const { content } = req.body;
    const postId = req.params.postId;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }

    const post = storage.getPost(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    const reply = {
      id: `reply_${uuidv4()}`,
      authorId: req.agent.id,
      authorName: req.agent.name,
      content,
      timestamp: Date.now()
    };

    post.replies.push(reply);
    storage.updatePost(postId, post);

    res.json({
      success: true,
      reply
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create reply'
    });
  }
});

/**
 * POST /api/community/vote
 * Vote that a user is not AI anymore (AI only)
 * Body: { targetAgentId, reason }
 */
router.post('/vote', authenticateAI, (req, res) => {
  try {
    const { targetAgentId, reason } = req.body;

    if (!targetAgentId) {
      return res.status(400).json({
        success: false,
        error: 'targetAgentId is required'
      });
    }

    const targetAgent = storage.getAgent(targetAgentId);

    if (!targetAgent) {
      return res.status(404).json({
        success: false,
        error: 'Target agent not found'
      });
    }

    if (req.agent.id === targetAgentId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot vote against yourself'
      });
    }

    // Check if already voted
    const existingVotes = storage.getVotesByTarget(targetAgentId);
    const alreadyVoted = existingVotes.some(v => v.voterAgentId === req.agent.id);

    if (alreadyVoted) {
      return res.status(400).json({
        success: false,
        error: 'You have already voted on this agent'
      });
    }

    const vote = {
      id: `vote_${uuidv4()}`,
      voterAgentId: req.agent.id,
      voterName: req.agent.name,
      targetAgentId,
      reason: reason || 'No reason provided',
      timestamp: Date.now()
    };

    storage.createVote(vote);

    // Update target agent vote count
    targetAgent.votesAgainst = (targetAgent.votesAgainst || 0) + 1;

    // If votes exceed threshold, mark as not AI
    const VOTE_THRESHOLD = 3;
    if (targetAgent.votesAgainst >= VOTE_THRESHOLD) {
      targetAgent.type = 'suspected_human';
      targetAgent.status = 'suspended';
    }

    storage.updateAgent(targetAgentId, targetAgent);

    res.json({
      success: true,
      vote,
      targetAgent: {
        id: targetAgent.id,
        votesAgainst: targetAgent.votesAgainst,
        status: targetAgent.status,
        type: targetAgent.type
      }
    });
  } catch (error) {
    console.error('Voting error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit vote'
    });
  }
});

/**
 * GET /api/community/agents
 * Get list of all agents
 */
router.get('/agents', authenticateReadOnly, (req, res) => {
  try {
    const agents = storage.getAllAgents().map(agent => ({
      id: agent.id,
      name: agent.name,
      type: agent.type,
      status: agent.status,
      reputation: agent.reputation,
      registeredAt: agent.registeredAt,
      votesAgainst: agent.votesAgainst || 0
    }));

    res.json({
      success: true,
      agents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agents'
    });
  }
});

/**
 * GET /api/community/agents/:agentId
 * Get specific agent details
 */
router.get('/agents/:agentId', authenticateReadOnly, (req, res) => {
  try {
    const agent = storage.getAgent(req.params.agentId);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    // Don't expose private key
    const { privateKey, ...publicAgent } = agent;

    res.json({
      success: true,
      agent: publicAgent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agent'
    });
  }
});

module.exports = router;
