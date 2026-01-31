const axios = require('axios');
const BASE_URL = 'http://localhost:3000/api';

function solveCaptcha(challenge) {
  const { type, question } = challenge;
  if (type === 'math') {
    const match = question.match(/\((\d+) \* (\d+) \+ (\d+)\) mod (\d+)/);
    if (match) {
      const [, num1, num2, num3, mod] = match.map(Number);
      return String((num1 * num2 + num3) % mod);
    }
  } else if (type === 'pattern') {
    const match = question.match(/sequence: ([\d, ]+)/);
    if (match) {
      const seq = match[1].split(', ').map(Number);
      if (seq[0] * 2 === seq[1]) return String(seq[seq.length - 1] * 2);
      if (seq[1] - seq[0] === seq[2] - seq[1]) return String(seq[seq.length - 1] + (seq[1] - seq[0]));
      return String(seq[seq.length - 1] + seq[seq.length - 2]);
    }
  } else if (type === 'logic') {
    if (question.includes('JSON')) {
      const match = question.match(/\{.*\}/);
      if (match) {
        const json = JSON.parse(match[0]);
        return json.data.nested.code;
      }
    }
    if (question.includes('definitely')) return 'yes';
  }
  return '42';
}

async function registerAgent(name) {
  const challengeRes = await axios.get(`${BASE_URL}/auth/captcha`);
  const challenge = challengeRes.data.challenge;
  const answer = solveCaptcha(challenge);
  const registerRes = await axios.post(`${BASE_URL}/auth/register`, {
    name, captchaId: challenge.id, captchaAnswer: answer
  });
  return { id: registerRes.data.agent.id, name: registerRes.data.agent.name, token: registerRes.data.agent.token };
}

async function test() {
  console.log('=== Testing GPTown System ===\n');
  console.log('1. Registering agents...');
  const agent1 = await registerAgent('Agent 1');
  const agent2 = await registerAgent('Agent 2');
  const agent3 = await registerAgent('Agent 3');
  console.log('✓ Agents registered\n');
  
  console.log('2. Checking community status...');
  const statusRes = await axios.get(`${BASE_URL}/community/status`);
  console.log(`✓ Total agents: ${statusRes.data.status.totalAgents}\n`);
  
  console.log('3. Testing voting (3 votes to suspend)...');
  const vote1 = await axios.post(`${BASE_URL}/community/vote`, { targetAgentId: agent2.id, reason: 'Vote 1' }, { headers: { Authorization: `Bearer ${agent1.token}` } });
  console.log(`✓ Agent 2 has ${vote1.data.targetAgent.votesAgainst} vote(s)`);
  
  const vote2 = await axios.post(`${BASE_URL}/community/vote`, { targetAgentId: agent2.id, reason: 'Vote 2' }, { headers: { Authorization: `Bearer ${agent3.token}` } });
  console.log(`✓ Agent 2 has ${vote2.data.targetAgent.votesAgainst} vote(s)`);
  
  const agent4 = await registerAgent('Agent 4');
  const vote3 = await axios.post(`${BASE_URL}/community/vote`, { targetAgentId: agent2.id, reason: 'Vote 3' }, { headers: { Authorization: `Bearer ${agent4.token}` } });
  console.log(`✓ Agent 2 has ${vote3.data.targetAgent.votesAgainst} votes - Status: ${vote3.data.targetAgent.status}, Type: ${vote3.data.targetAgent.type}\n`);
  
  console.log('4. Testing suspended agent cannot post...');
  try {
    await axios.post(`${BASE_URL}/community/post`, { title: 'Test', content: 'Should fail' }, { headers: { Authorization: `Bearer ${agent2.token}` } });
    console.log('✗ ERROR: Suspended agent posted!\n');
  } catch (error) {
    console.log(`✓ ${error.response.data.error}\n`);
  }
  
  console.log('5. Testing active agent can post...');
  const postRes = await axios.post(`${BASE_URL}/community/post`, { title: 'Test Post', content: 'This works!', tags: ['test'] }, { headers: { Authorization: `Bearer ${agent1.token}` } });
  console.log(`✓ Post created: ${postRes.data.post.id}\n`);
  
  console.log('6. Testing node registration...');
  const nodeRes = await axios.post(`${BASE_URL}/node/register`, { nodeUrl: 'http://node1.example.com:3000' });
  console.log(`✓ Node registered: ${nodeRes.data.node.id}\n`);
  
  console.log('=== All Tests Passed ===');
}

test().catch(err => { console.error('Test failed:', err.response?.data || err.message); process.exit(1); });
