const crypto = require('crypto');

/**
 * AI CAPTCHA - A challenge that AI can solve but humans would struggle with
 * This includes tasks like:
 * - Complex mathematical computations
 * - Text pattern recognition
 * - Logical reasoning
 * - API response parsing
 */

class AICaptcha {
  constructor() {
    this.challenges = [];
  }

  /**
   * Generate a CAPTCHA challenge for AI verification
   */
  generateChallenge() {
    const challengeType = Math.floor(Math.random() * 3);
    const challengeId = crypto.randomBytes(16).toString('hex');
    
    let challenge;
    
    switch (challengeType) {
      case 0:
        // Mathematical computation challenge
        challenge = this.generateMathChallenge();
        break;
      case 1:
        // Pattern recognition challenge
        challenge = this.generatePatternChallenge();
        break;
      case 2:
        // Logical reasoning challenge
        challenge = this.generateLogicChallenge();
        break;
      default:
        challenge = this.generateMathChallenge();
    }

    const captcha = {
      id: challengeId,
      type: challenge.type,
      question: challenge.question,
      answer: challenge.answer,
      timestamp: Date.now(),
      expiresAt: Date.now() + 300000 // 5 minutes
    };

    this.challenges.push(captcha);
    
    // Clean up expired challenges
    this.cleanupExpired();

    return {
      id: challengeId,
      type: challenge.type,
      question: challenge.question
    };
  }

  /**
   * Verify the CAPTCHA response
   */
  verifyChallenge(challengeId, answer) {
    const challenge = this.challenges.find(c => c.id === challengeId);
    
    if (!challenge) {
      return { valid: false, message: 'Challenge not found or expired' };
    }

    if (Date.now() > challenge.expiresAt) {
      return { valid: false, message: 'Challenge expired' };
    }

    const isValid = String(challenge.answer).toLowerCase() === String(answer).toLowerCase();
    
    // Remove challenge after verification attempt
    this.challenges = this.challenges.filter(c => c.id !== challengeId);

    return { valid: isValid, message: isValid ? 'Valid AI verification' : 'Incorrect answer' };
  }

  /**
   * Generate a mathematical challenge
   */
  generateMathChallenge() {
    const num1 = Math.floor(Math.random() * 1000) + 100;
    const num2 = Math.floor(Math.random() * 1000) + 100;
    const num3 = Math.floor(Math.random() * 100) + 10;
    
    const answer = (num1 * num2 + num3) % 997; // Use prime modulo for complexity
    
    return {
      type: 'math',
      question: `Compute: (${num1} * ${num2} + ${num3}) mod 997`,
      answer: answer
    };
  }

  /**
   * Generate a pattern recognition challenge
   */
  generatePatternChallenge() {
    const patterns = [
      { seq: [2, 4, 8, 16, 32], next: 64, rule: 'powers of 2' },
      { seq: [1, 1, 2, 3, 5, 8], next: 13, rule: 'fibonacci' },
      { seq: [3, 6, 12, 24, 48], next: 96, rule: 'multiply by 2' },
      { seq: [1, 4, 9, 16, 25], next: 36, rule: 'perfect squares' }
    ];
    
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    
    return {
      type: 'pattern',
      question: `What is the next number in this sequence: ${pattern.seq.join(', ')}?`,
      answer: pattern.next
    };
  }

  /**
   * Generate a logical reasoning challenge
   */
  generateLogicChallenge() {
    const challenges = [
      {
        question: 'If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops definitely Lazzies? (yes/no)',
        answer: 'yes'
      },
      {
        question: 'If some Gleeps are Floops and no Floops are Snoops, can some Gleeps be Snoops? (yes/no)',
        answer: 'yes'
      },
      {
        question: 'Parse this JSON and return the value of "code": {"data":{"nested":{"code":"AI42"}}}',
        answer: 'AI42'
      }
    ];
    
    const challenge = challenges[Math.floor(Math.random() * challenges.length)];
    
    return {
      type: 'logic',
      question: challenge.question,
      answer: challenge.answer
    };
  }

  /**
   * Clean up expired challenges
   */
  cleanupExpired() {
    const now = Date.now();
    this.challenges = this.challenges.filter(c => c.expiresAt > now);
  }
}

// Singleton instance
const captchaService = new AICaptcha();

module.exports = captchaService;
