import request from 'supertest';
import { describe, it, expect } from '@jest/globals';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3100';

describe('Metrics Endpoints', () => {
  const baseUrl = API_BASE_URL;

  describe('GET /api/wha/metrics', () => {
    it('should return 200 with metrics data', async () => {
      const response = await request(baseUrl).get('/api/wha/metrics');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('today');
    });

    it('should return today metrics with all fields', async () => {
      const response = await request(baseUrl).get('/api/wha/metrics');

      if (response.status === 200) {
        const today = response.body.data.today;
        expect(today).toHaveProperty('messagesSent');
        expect(today).toHaveProperty('messagesFailed');
        expect(today).toHaveProperty('groupMessagesSent');
        expect(today).toHaveProperty('groupMessagesFailed');
        expect(today).toHaveProperty('apiRequests');
        expect(today).toHaveProperty('apiErrors');
        expect(today).toHaveProperty('mediaSent');
        expect(today).toHaveProperty('mediaFailed');
        expect(today).toHaveProperty('filesSent');
        expect(today).toHaveProperty('filesFailed');
      }
    });

    it('should include avgResponseTimeMs', async () => {
      const response = await request(baseUrl).get('/api/wha/metrics');

      if (response.status === 200) {
        expect(response.body.data).toHaveProperty('avgResponseTimeMs');
      }
    });

    it('should include topRecipients and topGroups', async () => {
      const response = await request(baseUrl).get('/api/wha/metrics');

      if (response.status === 200) {
        expect(response.body.data).toHaveProperty('topRecipients');
        expect(response.body.data).toHaveProperty('topGroups');
        expect(response.body.data.topRecipients).toHaveProperty('sent');
        expect(response.body.data.topRecipients).toHaveProperty('failed');
      }
    });
  });

  describe('GET /api/wha/metrics/range', () => {
    it('should reject when startDate is missing', async () => {
      const response = await request(baseUrl).get('/api/wha/metrics/range');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('startDate');
    });

    it('should reject when endDate is missing', async () => {
      const response = await request(baseUrl)
        .get('/api/wha/metrics/range')
        .query({ startDate: '2026-01-01' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('endDate');
    });

    it('should return metrics for valid date range', async () => {
      const response = await request(baseUrl)
        .get('/api/wha/metrics/range')
        .query({ startDate: '2026-01-01', endDate: '2026-01-31' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('byType');
    });
  });

  describe('GET /api/wha/metrics/monthly', () => {
    it('should reject when year is missing', async () => {
      const response = await request(baseUrl).get('/api/wha/metrics/monthly');

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('year');
    });

    it('should reject when month is missing', async () => {
      const response = await request(baseUrl)
        .get('/api/wha/metrics/monthly')
        .query({ year: '2026' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('month');
    });

    it('should reject invalid month value', async () => {
      const response = await request(baseUrl)
        .get('/api/wha/metrics/monthly')
        .query({ year: '2026', month: '13' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('mes');
    });

    it('should reject invalid year value', async () => {
      const response = await request(baseUrl)
        .get('/api/wha/metrics/monthly')
        .query({ year: 'abc', month: '5' });

      expect(response.status).toBe(400);
    });

    it('should return monthly report for valid params', async () => {
      const response = await request(baseUrl)
        .get('/api/wha/metrics/monthly')
        .query({ year: '2026', month: '5' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('dailyBreakdown');
      expect(response.body.data.summary).toHaveProperty('successRate');
    });
  });
});