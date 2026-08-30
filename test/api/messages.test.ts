import request from 'supertest';
import { describe, it, expect } from '@jest/globals';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3100';
const TEST_PHONE = process.env.TEST_PHONE || '573046282936';
const TEST_GROUP_ID = process.env.TEST_GROUP_ID || '120363423058577571@g.us';

describe('Message Endpoints', () => {
  const baseUrl = API_BASE_URL;

  describe('POST /api/wha/send', () => {
    it('should reject when "to" field is missing', async () => {
      const response = await request(baseUrl)
        .post('/api/wha/send')
        .send({ message: 'Test message' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('"to"');
    });

    it('should reject when "to" is not an array', async () => {
      const response = await request(baseUrl)
        .post('/api/wha/send')
        .send({ to: '573001234567', message: 'Test' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('array');
    });

    it('should reject when "to" is empty array', async () => {
      const response = await request(baseUrl)
        .post('/api/wha/send')
        .send({ to: [], message: 'Test' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('"to"');
    });

    it('should reject when no content provided', async () => {
      const response = await request(baseUrl)
        .post('/api/wha/send')
        .send({ to: [TEST_PHONE] });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('message');
    });

    it('should reject invalid multimedia format', async () => {
      const response = await request(baseUrl)
        .post('/api/wha/send')
        .send({
          to: [TEST_PHONE],
          message: 'Test',
          multimedia: 'not-an-array'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('multimedia');
    });

    it('should reject invalid tags format', async () => {
      const response = await request(baseUrl)
        .post('/api/wha/send')
        .send({
          to: [TEST_PHONE],
          message: 'Test',
          tags: 'not-an-array'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('tags');
    });

    it('should accept valid request with text only', async () => {
      const response = await request(baseUrl)
        .post('/api/wha/send')
        .send({
          to: [TEST_PHONE],
          message: 'Test message from API'
        });

      // Acepta 200 (enviado) o 503 (cliente no listo)
      expect([200, 503]).toContain(response.status);
    });

    it('should accept valid request with multimedia URLs', async () => {
      const response = await request(baseUrl)
        .post('/api/wha/send')
        .send({
          to: [TEST_PHONE],
          message: 'Check this image',
          multimedia: ['https://example.com/image.jpg']
        });

      expect([200, 503]).toContain(response.status);
    });

    it('should handle mixed phone numbers and group IDs', async () => {
      const response = await request(baseUrl)
        .post('/api/wha/send')
        .send({
          to: [TEST_PHONE, TEST_GROUP_ID],
          message: 'Test to both'
        });

      expect([200, 503]).toContain(response.status);
    });
  });

  describe('POST /api/wha/groups/send', () => {
    it('should reject missing groupId', async () => {
      const response = await request(baseUrl)
        .post('/api/wha/groups/send')
        .send({ message: 'Test' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('groupId');
    });

    it('should reject invalid groupId type', async () => {
      const response = await request(baseUrl)
        .post('/api/wha/groups/send')
        .send({ groupId: 123, message: 'Test' });

      expect(response.status).toBe(400);
    });

    it('should accept valid group message', async () => {
      const response = await request(baseUrl)
        .post('/api/wha/groups/send')
        .send({
          groupId: TEST_GROUP_ID,
          message: 'Group test message'
        });

      expect([200, 503]).toContain(response.status);
    });
  });
});