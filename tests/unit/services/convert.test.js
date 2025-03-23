const convertService = require('../../../src/services/convert');
const statsService = require('../../../src/services/stats');

// Mock the statsService
jest.mock('../../../src/services/stats', () => ({
  recordConversion: jest.fn().mockResolvedValue(true)
}));

describe('Convert Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('ltrToRtl', () => {
    it('should convert CSS from LTR to RTL correctly', async () => {
      const css = `
        .test {
          margin-left: 10px;
          padding-right: 20px;
          text-align: left;
        }
      `;
      
      const result = await convertService.ltrToRtl({ css });
      
      expect(result).toHaveProperty('converted');
      expect(result).toHaveProperty('stats');
      expect(result.converted).toContain('margin-right');
      expect(result.converted).toContain('padding-left');
      expect(result.converted).toContain('text-align: right');
      expect(result.stats.originalSize).toBeGreaterThan(0);
      expect(result.stats.convertedSize).toBeGreaterThan(0);
      expect(result.stats.processingTimeMs).toBeGreaterThanOrEqual(0);
    });
    
    it('should handle custom rtlcss options', async () => {
      const css = `
        .test {
          margin-left: 10px;
          /* rtl:remove */
          padding-left: 20px;
          /* rtl:end */
        }
      `;
      
      const options = {
        clean: true, // Process special comments
      };
      
      const result = await convertService.ltrToRtl({ 
        css, 
        rtlcssOptions: options 
      });
      
      expect(result.converted).toContain('margin-right');
      expect(result.converted).not.toContain('padding-left');
    });
    
    it('should reject invalid CSS input', async () => {
      await expect(convertService.ltrToRtl({ css: null }))
        .rejects.toThrow();
      
      await expect(convertService.ltrToRtl({ css: 123 }))
        .rejects.toThrow();
    });
    
    it('should record usage statistics when apiKey is provided', async () => {
      const css = '.test { margin-left: 10px; }';
      const apiKey = 'test-api-key';
      
      await convertService.ltrToRtl({ css, apiKey });
      
      expect(statsService.recordConversion).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey,
          conversionType: 'ltr_to_rtl',
        })
      );
    });
    
    it('should not record usage statistics when apiKey is not provided', async () => {
      const css = '.test { margin-left: 10px; }';
      
      await convertService.ltrToRtl({ css });
      
      expect(statsService.recordConversion).not.toHaveBeenCalled();
    });
  });
  
  describe('rtlToLtr', () => {
    it('should convert CSS from RTL to LTR correctly', async () => {
      const css = `
        .test {
          margin-right: 10px;
          padding-left: 20px;
          text-align: right;
        }
      `;
      
      const result = await convertService.rtlToLtr({ css });
      
      expect(result).toHaveProperty('converted');
      expect(result).toHaveProperty('stats');
      expect(result.converted).toContain('margin-left');
      expect(result.converted).toContain('padding-right');
      expect(result.converted).toContain('text-align: left');
      expect(result.stats.originalSize).toBeGreaterThan(0);
      expect(result.stats.convertedSize).toBeGreaterThan(0);
      expect(result.stats.processingTimeMs).toBeGreaterThanOrEqual(0);
    });
    
    it('should handle direction property correctly', async () => {
      const css = `
        .test {
          direction: rtl;
        }
      `;
      
      const result = await convertService.rtlToLtr({ css });
      expect(result.converted).toContain('direction: ltr');
    });
    
    it('should handle float property correctly', async () => {
      const css = `
        .test {
          float: right;
        }
        .another {
          float: left;
        }
      `;
      
      const result = await convertService.rtlToLtr({ css });
      expect(result.converted).toContain('float: left');
      expect(result.converted).toContain('float: right');
    });
  });
  
  describe('validateCss', () => {
    it('should validate correct CSS', () => {
      const validCss = `
        .test {
          margin: 10px;
          padding: 20px;
        }
      `;
      
      expect(convertService.validateCss(validCss)).toBe(true);
    });
    
    it('should invalidate malformed CSS', () => {
      const invalidCss = `
        .test {
          margin: 10px;
          padding: 20px;
        /* Missing closing brace */
      `;
      
      expect(convertService.validateCss(invalidCss)).toBe(false);
    });
    
    it('should invalidate non-string input', () => {
      expect(convertService.validateCss(null)).toBe(false);
      expect(convertService.validateCss(123)).toBe(false);
      expect(convertService.validateCss({})).toBe(false);
    });
  });
});