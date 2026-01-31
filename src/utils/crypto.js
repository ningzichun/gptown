const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a key pair for an AI agent
 */
function generateKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  return { publicKey, privateKey };
}

/**
 * Sign data with private key
 */
function signData(data, privateKey) {
  const sign = crypto.createSign('SHA256');
  sign.update(data);
  sign.end();
  return sign.sign(privateKey, 'hex');
}

/**
 * Verify signature with public key
 */
function verifySignature(data, signature, publicKey) {
  try {
    const verify = crypto.createVerify('SHA256');
    verify.update(data);
    verify.end();
    return verify.verify(publicKey, signature, 'hex');
  } catch (error) {
    return false;
  }
}

/**
 * Generate a unique agent ID
 */
function generateAgentId() {
  return `ai_${uuidv4()}`;
}

/**
 * Hash data using SHA256
 */
function hashData(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

module.exports = {
  generateKeyPair,
  signData,
  verifySignature,
  generateAgentId,
  hashData
};
