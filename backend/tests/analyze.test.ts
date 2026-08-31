import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Verdict Backend Decision Engine', () => {
  const app = createApp();

  it('should return operational status on /v1/status', async () => {
    const res = await request(app).get('/v1/status');
    expect(res.status).toBe(200);
    expect(res.body.operational).toBe(true);
  });

  it('should return SAFE for normal browsing URLs', async () => {
    const res = await request(app)
      .post('/v1/analyze')
      .send({
        url: 'https://example-shop.com/product/1',
        hostname: 'example-shop.com',
        timestamp: Date.now(),
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('SAFE');
    expect(res.body.action).toBe('NONE');
    expect(res.body.decision.status).toBe('SAFE');
  });

  it('should return CAUTION for suspicious unverified domains', async () => {
    const res = await request(app)
      .post('/v1/analyze')
      .send({
        url: 'https://suspicious-store-unverified.com/checkout',
        hostname: 'suspicious-store-unverified.com',
        timestamp: Date.now(),
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CAUTION');
    expect(res.body.action).toBe('WARN');
    expect(res.body.title).toBe('Be careful here');
  });

  it('should return DANGER for phishing and scam domains', async () => {
    const res = await request(app)
      .post('/v1/analyze')
      .send({
        url: 'https://fake-shop-danger-phishing.com/login',
        hostname: 'fake-shop-danger-phishing.com',
        timestamp: Date.now(),
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('DANGER');
    expect(res.body.action).toBe('GO_BACK');
    expect(res.body.title).toBe("Don't pay here");
  });

  it('should handle payload with signals structure', async () => {
    const res = await request(app)
      .post('/v1/analyze')
      .send({
        signals: {
          page: {
            url: 'https://legit-brand.com',
            hostname: 'legit-brand.com',
          },
        },
        clientTimestamp: Date.now(),
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('SAFE');
    expect(res.body.decision.status).toBe('SAFE');
  });
});
