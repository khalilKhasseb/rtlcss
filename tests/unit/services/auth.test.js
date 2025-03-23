const authService = require('../../../src/services/auth');

describe('Auth Service', () => {
  // Store original Map to restore after each test
  const originalMap = global.Map;
  
  afterEach(() => {
    // Restore the original Map
    global.Map = originalMap;
  });
  
  describe('createApiCredentials', () => {
    it('should create and store API credentials', () => {
      // Mock the Map to verify storage
      const mockSet = jest.fn();
      const mockMap = {
        set: mockSet,
      };
      global.Map = jest.fn(() => mockMap);
      
      const credentials = authService.createApiCredentials();
      
      expect(credentials).toHaveProperty('apiKey');
      expect(credentials).toHaveProperty('apiSecret');
      expect(credentials.apiKey).toMatch(/^[0-9a-f-]{36}$/); // UUID v4 format
      expect(credentials.apiSecret.length).toBe(64); // 32 bytes as hex
      
      // Verify the credentials were stored
      expect(mockSet).toHaveBeenCalledWith(
        credentials.apiKey,
        expect.objectContaining({
          secret: credentials.apiSecret,
          enabled: true,
        })
      );
    });
  });
  
  describe('getApiSecret', () => {
    it('should return secret for valid API key', async () => {
      // Create a test API key
      const credentials = authService.createApiCredentials();
      
      // Get the secret
      const secret = await authService.getApiSecret(credentials.apiKey);
      
      expect(secret).toBe(credentials.apiSecret);
    });
    
    it('should return null for invalid API key', async () => {
      const secret = await authService.getApiSecret('invalid-api-key');
      expect(secret).toBeNull();
    });
    
    it('should return null for disabled API key', async () => {
      // Create a test API key
      const credentials = authService.createApiCredentials();
      
      // Disable the API key
      await authService.disableApiKey(credentials.apiKey);
      
      // Try to get the secret
      const secret = await authService.getApiSecret(credentials.apiKey);
      
      expect(secret).toBeNull();
    });
    
    it('should update last used timestamp', async () => {
      // Mock the Map to verify updates
      const mockGet = jest.fn();
      const mockSet = jest.fn();
      const mockMap = {
        get: mockGet,
        set: mockSet,
      };
      global.Map = jest.fn(() => mockMap);
      
      // Mock credential retrieval
      const testCredentials = {
        secret: 'test-secret',
        enabled: true,
        lastUsed: null,
      };
      mockGet.mockReturnValue(testCredentials);
      
      // Get the secret
      const secret = await authService.getApiSecret('test-key');
      
      expect(secret).toBe('test-secret');
      expect(mockSet).toHaveBeenCalledWith('test-key', expect.objectContaining({
        lastUsed: expect.any(Date),
      }));
    });
  });
  
  describe('verifyApiKey', () => {
    it('should return true for valid API key', async () => {
      // Create a test API key
      const credentials = authService.createApiCredentials();
      
      // Verify the key
      const isValid = await authService.verifyApiKey(credentials.apiKey);
      
      expect(isValid).toBe(true);
    });
    
    it('should return false for invalid API key', async () => {
      const isValid = await authService.verifyApiKey('invalid-api-key');
      expect(isValid).toBe(false);
    });
    
    it('should return false for disabled API key', async () => {
      // Create a test API key
      const credentials = authService.createApiCredentials();
      
      // Disable the API key
      await authService.disableApiKey(credentials.apiKey);
      
      // Verify the key
      const isValid = await authService.verifyApiKey(credentials.apiKey);
      
      expect(isValid).toBe(false);
    });
  });
  
  describe('disableApiKey', () => {
    it('should disable an API key', async () => {
      // Create a test API key
      const credentials = authService.createApiCredentials();
      
      // Disable the API key
      const result = await authService.disableApiKey(credentials.apiKey);
      
      expect(result).toBe(true);
      
      // Verify the key is disabled
      const isValid = await authService.verifyApiKey(credentials.apiKey);
      expect(isValid).toBe(false);
    });
    
    it('should return false for invalid API key', async () => {
      const result = await authService.disableApiKey('invalid-api-key');
      expect(result).toBe(false);
    });
  });
  
  describe('getAllApiKeys', () => {
    it('should return all API keys', async () => {
      // Create some test API keys
      const credentials1 = authService.createApiCredentials();
      const credentials2 = authService.createApiCredentials();
      
      // Get all API keys
      const keys = await authService.getAllApiKeys();
      
      expect(keys.length).toBeGreaterThanOrEqual(2);
      expect(keys.some(k => k.apiKey === credentials1.apiKey)).toBe(true);
      expect(keys.some(k => k.apiKey === credentials2.apiKey)).toBe(true);
    });
    
    it('should not include API secrets', async () => {
      // Create a test API key
      authService.createApiCredentials();
      
      // Get all API keys
      const keys = await authService.getAllApiKeys();
      
      // Verify no key contains the secret
      keys.forEach(key => {
        expect(key).not.toHaveProperty('secret');
      });
    });
  });
});