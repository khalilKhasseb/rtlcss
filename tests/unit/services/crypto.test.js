const crypto = require('../../../src/utils/crypto');

describe('Crypto Utils', () => {
  describe('generateApiCredentials', () => {
    it('should generate valid API credentials', () => {
      const credentials = crypto.generateApiCredentials();
      
      expect(credentials).toHaveProperty('apiKey');
      expect(credentials).toHaveProperty('apiSecret');
      
      // API key should be a UUID v4
      expect(credentials.apiKey).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      
      // API secret should be a 32-byte hex string
      expect(credentials.apiSecret).toMatch(/^[0-9a-f]{64}$/i);
    });
    
    it('should generate unique credentials on each call', () => {
      const credentials1 = crypto.generateApiCredentials();
      const credentials2 = crypto.generateApiCredentials();
      
      expect(credentials1.apiKey).not.toEqual(credentials2.apiKey);
      expect(credentials1.apiSecret).not.toEqual(credentials2.apiSecret);
    });
  });
  
  describe('createSignature', () => {
    it('should create a valid HMAC signature', () => {
      const payload = 'test-payload';
      const secret = 'test-secret';
      
      const signature = crypto.createSignature(payload, secret);
      
      // Signature should be a 64-character hex string (SHA-256 HMAC)
      expect(signature).toMatch(/^[0-9a-f]{64}$/i);
      
      // Verify the signature is consistent
      const signature2 = crypto.createSignature(payload, secret);
      expect(signature).toEqual(signature2);
    });
    
    it('should produce different signatures for different payloads', () => {
      const secret = 'test-secret';
      
      const signature1 = crypto.createSignature('payload1', secret);
      const signature2 = crypto.createSignature('payload2', secret);
      
      expect(signature1).not.toEqual(signature2);
    });
    
    it('should produce different signatures for different secrets', () => {
      const payload = 'test-payload';
      
      const signature1 = crypto.createSignature(payload, 'secret1');
      const signature2 = crypto.createSignature(payload, 'secret2');
      
      expect(signature1).not.toEqual(signature2);
    });
  });
  
  describe('verifySignature', () => {
    it('should verify a valid signature', () => {
      const payload = 'test-payload';
      const secret = 'test-secret';
      
      // Create a signature
      const signature = crypto.createSignature(payload, secret);
      
      // Verify the signature
      const result = crypto.verifySignature(payload, signature, secret);
      
      expect(result).toBe(true);
    });
    
    it('should reject an invalid signature', () => {
      const payload = 'test-payload';
      const secret = 'test-secret';
      
      // Create a signature with a different payload
      const signature = crypto.createSignature('different-payload', secret);
      
      // Verify the signature
      const result = crypto.verifySignature(payload, signature, secret);
      
      expect(result).toBe(false);
    });
    
    it('should reject a signature created with a different secret', () => {
      const payload = 'test-payload';
      
      // Create a signature with a different secret
      const signature = crypto.createSignature(payload, 'different-secret');
      
      // Verify the signature
      const result = crypto.verifySignature(payload, signature, 'test-secret');
      
      expect(result).toBe(false);
    });
  });
  
  describe('isTimestampValid', () => {
    beforeEach(() => {
      // Mock Date.now
      jest.spyOn(Date, 'now').mockImplementation(() => 1600000000000); // Fixed timestamp for testing
    });
    
    afterEach(() => {
      jest.restoreAllMocks();
    });
    
    it('should accept a timestamp within the valid window', () => {
      // Timestamp is 5 seconds old (within default 5-minute window)
      const timestamp = Date.now() - 5000;
      
      const result = crypto.isTimestampValid(timestamp);
      
      expect(result).toBe(true);
    });
    
    it('should accept a timestamp slightly in the future', () => {
      // Timestamp is 5 seconds in the future (within default 5-minute window)
      const timestamp = Date.now() + 5000;
      
      const result = crypto.isTimestampValid(timestamp);
      
      expect(result).toBe(true);
    });
    
    it('should reject a timestamp outside the valid window', () => {
      // Timestamp is 10 minutes old (outside default 5-minute window)
      const timestamp = Date.now() - 10 * 60 * 1000;
      
      const result = crypto.isTimestampValid(timestamp);
      
      expect(result).toBe(false);
    });
    
    it('should reject a timestamp too far in the future', () => {
      // Timestamp is 10 minutes in the future (outside default 5-minute window)
      const timestamp = Date.now() + 10 * 60 * 1000;
      
      const result = crypto.isTimestampValid(timestamp);
      
      expect(result).toBe(false);
    });
  });
});