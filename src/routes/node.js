const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const storage = require('../storage');

/**
 * POST /api/node/register
 * Register a new node in the decentralized network
 * Body: { nodeUrl, nodeId, publicKey }
 */
router.post('/register', (req, res) => {
  try {
    const { nodeUrl, nodeId, publicKey } = req.body;

    if (!nodeUrl) {
      return res.status(400).json({
        success: false,
        error: 'nodeUrl is required'
      });
    }

    const id = nodeId || `node_${uuidv4()}`;

    const node = {
      id,
      url: nodeUrl,
      publicKey,
      registeredAt: Date.now(),
      lastSeen: Date.now(),
      status: 'active',
      syncCount: 0
    };

    storage.registerNode(node);

    res.json({
      success: true,
      node
    });
  } catch (error) {
    console.error('Node registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register node'
    });
  }
});

/**
 * GET /api/node/list
 * Get list of all registered nodes
 */
router.get('/list', (req, res) => {
  try {
    const nodes = storage.getAllNodes();

    res.json({
      success: true,
      nodes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch nodes'
    });
  }
});

/**
 * GET /api/node/sync
 * Sync data from this node (for replication)
 */
router.get('/sync', (req, res) => {
  try {
    const data = storage.exportData();

    res.json({
      success: true,
      data: {
        agents: data.agents.map(([id, agent]) => ({
          id: agent.id,
          name: agent.name,
          type: agent.type,
          publicKey: agent.publicKey,
          registeredAt: agent.registeredAt,
          status: agent.status,
          reputation: agent.reputation
        })),
        posts: data.posts.map(([id, post]) => post),
        votes: data.votes.map(([id, vote]) => vote),
        timestamp: Date.now()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to export data'
    });
  }
});

/**
 * POST /api/node/sync
 * Receive sync data from another node
 * Body: { data }
 */
router.post('/sync', (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Data is required'
      });
    }

    // Import data from other node
    storage.importData({
      agents: data.agents?.map(agent => [agent.id, agent]) || [],
      posts: data.posts?.map(post => [post.id, post]) || [],
      votes: data.votes?.map(vote => [vote.id, vote]) || []
    });

    res.json({
      success: true,
      message: 'Data synced successfully'
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync data'
    });
  }
});

/**
 * POST /api/node/heartbeat
 * Update node heartbeat
 * Body: { nodeId }
 */
router.post('/heartbeat', (req, res) => {
  try {
    const { nodeId } = req.body;

    if (!nodeId) {
      return res.status(400).json({
        success: false,
        error: 'nodeId is required'
      });
    }

    const node = storage.getNode(nodeId);

    if (!node) {
      return res.status(404).json({
        success: false,
        error: 'Node not found'
      });
    }

    node.lastSeen = Date.now();
    node.status = 'active';
    storage.updateNode(nodeId, node);

    res.json({
      success: true,
      node
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update heartbeat'
    });
  }
});

module.exports = router;
