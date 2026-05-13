import request from 'supertest';
import { describe, it, expect } from '@jest/globals';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3100';

describe('Groups & Chats Endpoints', () => {
  const baseUrl = API_BASE_URL;

  describe('GET /api/wha/groups', () => {
    it('should return 200 with groups array', async () => {
      const response = await request(baseUrl).get('/api/wha/groups');

      // 200 si el cliente está listo, 503 si no
      expect([200, 503]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      }
    });

    it('should return groups with required properties when ready', async () => {
      const response = await request(baseUrl).get('/api/wha/groups');

      if (response.status === 200) {
        if (response.body.data.length > 0) {
          const group = response.body.data[0];
          expect(group).toHaveProperty('id');
          expect(group).toHaveProperty('name');
          expect(group).toHaveProperty('participants');
          expect(group.participants).toBeInstanceOf(Array);
        }
      }
    });
  });

  describe('GET /api/wha/chats', () => {
    it('should return 200 with chats array', async () => {
      const response = await request(baseUrl).get('/api/wha/chats');

      expect([200, 503]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      }
    });

    it('should return chats with required properties when ready', async () => {
      const response = await request(baseUrl).get('/api/wha/chats');

      if (response.status === 200) {
        if (response.body.data.length > 0) {
          const chat = response.body.data[0];
          expect(chat).toHaveProperty('name');
          expect(chat).toHaveProperty('number');
        }
      }
    });
  });
});