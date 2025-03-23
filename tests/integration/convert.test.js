const request = require('supertest');
const app = require('../../src/app');
const authService = require('../../src/services/auth');
const crypto = require('../../src/utils/crypto');

describe('Convert API Integration Tests', () => {
  let apiKey;
  let apiSecret;
  
  beforeAll(() => {
    // Create an API key for testing
    const credentials = authService.createApiCredentials();
    apiKey = credentials.apiKey;
    apiSecret = credentials.apiSecret;
  });
  
  const createSignature = (path, method, timestamp) => {
    const payload = `${path}|${method}|${timestamp}`;
    return crypto.createSignature(payload, apiSecret);
  };
  
  describe('POST /api/convert/ltr-to-rtl', () => {
    it('should convert CSS from LTR to RTL', async () => {
      const timestamp = Date.now();
      const path = '/api/convert/ltr-to-rtl';
      const signature = createSignature(path, 'POST', timestamp);
      
      const css = `
        .test-container {
          margin-left: 10px;
          padding-right: 20px;
          text-align: left;
          float: left;
        }
      `;
      
      const response = await request(app)
        .post(path)
        .set('X-API-Key', apiKey)
        .set('X-Timestamp', timestamp)
        .set('X-Signature', signature)
        .send({ css });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.converted).toBeDefined();
      
      // Verify conversion
      const converted = response.body.data.converted;
      expect(converted).toContain('margin-right: 10px');
      expect(converted).toContain('padding-left: 20px');
      expect(converted).toContain('text-align: right');
      expect(converted).toContain('float: right');
    });
    
    it('should return error for invalid CSS', async () => {
      const timestamp = Date.now();
      const path = '/api/convert/ltr-to-rtl';
      const signature = createSignature(path, 'POST', timestamp);
      
      const response = await request(app)
        .post(path)
        .set('X-API-Key', apiKey)
        .set('X-Timestamp', timestamp)
        .set('X-Signature', signature)
        .send({ css: '{invalid css' });
      
      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
    
    it('should return error for invalid API key', async () => {
      const timestamp = Date.now();
      const path = '/api/convert/ltr-to-rtl';
      const signature = createSignature(path, 'POST', timestamp);
      
      const response = await request(app)
        .post(path)
        .set('X-API-Key', 'invalid-key')
        .set('X-Timestamp', timestamp)
        .set('X-Signature', signature)
        .send({ css: '.test { margin-left: 10px; }' });
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_API_KEY');
    });
    
    it('should return error for invalid signature', async () => {
      const timestamp = Date.now();
      const path = '/api/convert/ltr-to-rtl';
      
      const response = await request(app)
        .post(path)
        .set('X-API-Key', apiKey)
        .set('X-Timestamp', timestamp)
        .set('X-Signature', 'invalid-signature')
        .send({ css: '.test { margin-left: 10px; }' });
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_SIGNATURE');
    });
    
    it('should process RTLCSS options correctly', async () => {
      const timestamp = Date.now();
      const path = '/api/convert/ltr-to-rtl';
      const signature = createSignature(path, 'POST', timestamp);
      
      const css = `
        .test {
          padding-left: 10px;
          /* rtl:remove */
          margin-left: 20px;
          /* rtl:end */
        }
      `;
      
      const options = {
        autoRename: true,
        clean: true
      };
      
      const response = await request(app)
        .post(path)
        .set('X-API-Key', apiKey)
        .set('X-Timestamp', timestamp)
        .set('X-Signature', signature)
        .send({ css, options });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // With clean=true, the rtl:remove comment should be processed
      const converted = response.body.data.converted;
      expect(converted).toContain('padding-right: 10px');
      expect(converted).not.toContain('margin-left: 20px');
    });
  });
  
  describe('POST /api/convert/rtl-to-ltr', () => {
    it('should convert CSS from RTL to LTR', async () => {
      const timestamp = Date.now();
      const path = '/api/convert/rtl-to-ltr';
      const signature = createSignature(path, 'POST', timestamp);
      
      const css = `
        .test-container {
          margin-right: 10px;
          padding-left: 20px;
          text-align: right;
          float: right;
        }
      `;
      
      const response = await request(app)
        .post(path)
        .set('X-API-Key', apiKey)
        .set('X-Timestamp', timestamp)
        .set('X-Signature', signature)
        .send({ css });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.converted).toBeDefined();
      
      // Verify conversion
      const converted = response.body.data.converted;
      expect(converted).toContain('margin-left: 10px');
      expect(converted).toContain('padding-right: 20px');
      expect(converted).toContain('text-align: left');
      expect(converted).toContain('float: left');
    });
  });
});