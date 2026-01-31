/**
 * In-memory storage for the decentralized node
 * In production, this should be replaced with a persistent database
 * or distributed storage system
 */

class Storage {
  constructor() {
    this.agents = new Map(); // agentId -> agent data
    this.posts = new Map(); // postId -> post data
    this.votes = new Map(); // voteId -> vote data
    this.nodes = new Map(); // nodeId -> node data
  }

  // Agent operations
  createAgent(agent) {
    this.agents.set(agent.id, agent);
    return agent;
  }

  getAgent(agentId) {
    return this.agents.get(agentId);
  }

  updateAgent(agentId, updates) {
    const agent = this.agents.get(agentId);
    if (agent) {
      Object.assign(agent, updates);
      this.agents.set(agentId, agent);
      return agent;
    }
    return null;
  }

  getAllAgents() {
    return Array.from(this.agents.values());
  }

  // Post operations
  createPost(post) {
    this.posts.set(post.id, post);
    return post;
  }

  getPost(postId) {
    return this.posts.get(postId);
  }

  getAllPosts(limit = 100, offset = 0) {
    const posts = Array.from(this.posts.values())
      .sort((a, b) => b.timestamp - a.timestamp);
    return posts.slice(offset, offset + limit);
  }

  updatePost(postId, updates) {
    const post = this.posts.get(postId);
    if (post) {
      Object.assign(post, updates);
      this.posts.set(postId, post);
      return post;
    }
    return null;
  }

  // Vote operations
  createVote(vote) {
    this.votes.set(vote.id, vote);
    return vote;
  }

  getVote(voteId) {
    return this.votes.get(voteId);
  }

  getVotesByTarget(targetAgentId) {
    return Array.from(this.votes.values())
      .filter(vote => vote.targetAgentId === targetAgentId);
  }

  getVotesByVoter(voterAgentId) {
    return Array.from(this.votes.values())
      .filter(vote => vote.voterAgentId === voterAgentId);
  }

  // Node operations
  registerNode(node) {
    this.nodes.set(node.id, node);
    return node;
  }

  getNode(nodeId) {
    return this.nodes.get(nodeId);
  }

  getAllNodes() {
    return Array.from(this.nodes.values());
  }

  updateNode(nodeId, updates) {
    const node = this.nodes.get(nodeId);
    if (node) {
      Object.assign(node, updates);
      this.nodes.set(nodeId, node);
      return node;
    }
    return null;
  }

  // Export data for replication
  exportData() {
    return {
      agents: Array.from(this.agents.entries()),
      posts: Array.from(this.posts.entries()),
      votes: Array.from(this.votes.entries()),
      nodes: Array.from(this.nodes.entries())
    };
  }

  // Import data from another node
  importData(data) {
    if (data.agents) {
      data.agents.forEach(([id, agent]) => this.agents.set(id, agent));
    }
    if (data.posts) {
      data.posts.forEach(([id, post]) => this.posts.set(id, post));
    }
    if (data.votes) {
      data.votes.forEach(([id, vote]) => this.votes.set(id, vote));
    }
    if (data.nodes) {
      data.nodes.forEach(([id, node]) => this.nodes.set(id, node));
    }
  }
}

// Singleton instance
const storage = new Storage();

module.exports = storage;
