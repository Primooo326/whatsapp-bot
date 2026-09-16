/**
 * Utilidades para tests
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3100';

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomPhone() {
  return `573${Math.floor(Math.random() * 900000000 + 100000000)}`;
}

function randomGroupId() {
  const num = Math.floor(Math.random() * 900000000000000000 + 100000000000000000);
  return `${num}@g.us`;
}

function createValidMessageRequest(overrides = {}) {
  return {
    to: [randomPhone()],
    message: 'Test message',
    ...overrides
  };
}

function createValidGroupMessageRequest(overrides = {}) {
  return {
    groupId: randomGroupId(),
    message: 'Group test message',
    ...overrides
  };
}

function isWhatsAppReady() {
  // Check if WhatsApp client is ready
  return fetch(`${API_BASE_URL}/api/wha/health`)
    .then(res => res.json())
    .then(data => data.data?.ready === true)
    .catch(() => false);
}

module.exports = {
  wait,
  randomPhone,
  randomGroupId,
  createValidMessageRequest,
  createValidGroupMessageRequest,
  isWhatsAppReady
};