import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3100';

describe('Health Endpoints', () => {
  const baseUrl = API_BASE_URL;

  describe('GET /api/health', () => {
    it('should return 200 and ok status', async () => {
      const response = await request(baseUrl).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/wha/health', () => {
    it('should return WhatsApp client status', async () => {
      const response = await request(baseUrl).get('/api/wha/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('ready');
      expect(response.body.data).toHaveProperty('sessionId');
    });

    it('should include boolean ready property', async () => {
      const response = await request(baseUrl).get('/api/wha/health');

      expect(typeof response.body.data.ready).toBe('boolean');
    });
  });
});

describe('GET /api/wha/session/status', () => {
  const baseUrl = API_BASE_URL;

  it('should return session status', async () => {
    const response = await request(baseUrl).get('/api/wha/session/status');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('ready');
    expect(response.body.data).toHaveProperty('sessionId');
  });
});