const express = require('express');
const convertService = require('../services/convert');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/test
 * Test the API with a simple CSS conversion
 */
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    // Use a simple test CSS
    const testCss = `
      .test-class {
        margin-left: 10px;
        padding-right: 20px;
        text-align: left;
        float: left;
        border-left: 1px solid #ccc;
      }
      
      .another-class {
        direction: ltr;
        position: absolute;
        left: 100px;
        right: 200px;
      }
    `;
    
    // Convert it to RTL
    const result = await convertService.ltrToRtl({
      css: testCss,
      apiKey: req.apiKey,
    });
    
    res.json({
      success: true,
      data: {
        original: testCss,
        converted: result.converted,
        stats: result.stats,
        apiStatus: 'operational',
      },
      meta: {
        service: 'rtlcss-api',
        version: require('../../package.json').version,
        rtlcssVersion: require('rtlcss/package.json').version,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;