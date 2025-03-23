#!/usr/bin/env node

/**
 * CSS Conversion Test Tool
 * 
 * This script tests the RTLCSS conversion functions with a variety of CSS patterns
 * to ensure accurate conversions across different CSS structures and properties.
 */

const fs = require('fs').promises;
const path = require('path');
const convertService = require('../services/convert');
const { EOL } = require('os');

// Configure colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Test categories and their CSS patterns
const testCases = [
  {
    name: 'Basic Properties',
    tests: [
      {
        description: 'Simple directional properties',
        ltr: `
.test {
  margin-left: 10px;
  padding-right: 20px;
  border-left: 1px solid #ccc;
  border-right: 2px solid #ddd;
}`,
        expected: `
.test {
  margin-right: 10px;
  padding-left: 20px;
  border-right: 1px solid #ccc;
  border-left: 2px solid #ddd;
}`
      },
      {
        description: 'Shorthand properties with 4 values',
        ltr: `
.test {
  margin: 10px 20px 30px 40px; /* top right bottom left */
  padding: 5px 10px 15px 20px;
}`,
        expected: `
.test {
  margin: 10px 40px 30px 20px; /* top left bottom right */
  padding: 5px 20px 15px 10px;
}`
      }
    ]
  },
  {
    name: 'Text Direction and Alignment',
    tests: [
      {
        description: 'Direction property',
        ltr: `
.test {
  direction: ltr;
}
.another {
  direction: rtl;
}`,
        expected: `
.test {
  direction: rtl;
}
.another {
  direction: ltr;
}`
      },
      {
        description: 'Text alignment',
        ltr: `
.test {
  text-align: left;
}
.another {
  text-align: right;
}`,
        expected: `
.test {
  text-align: right;
}
.another {
  text-align: left;
}`
      }
    ]
  },
  {
    name: 'Float and Positioning',
    tests: [
      {
        description: 'Float property',
        ltr: `
.test {
  float: left;
}
.another {
  float: right;
}`,
        expected: `
.test {
  float: right;
}
.another {
  float: left;
}`
      },
      {
        description: 'Position coordinates',
        ltr: `
.test {
  position: absolute;
  left: 10px;
  right: 20px;
}`,
        expected: `
.test {
  position: absolute;
  right: 10px;
  left: 20px;
}`
      }
    ]
  },
  {
    name: 'Border Radius',
    tests: [
      {
        description: 'Border radius properties',
        ltr: `
.test {
  border-top-left-radius: 5px;
  border-top-right-radius: 10px;
  border-bottom-left-radius: 15px;
  border-bottom-right-radius: 20px;
}`,
        expected: `
.test {
  border-top-right-radius: 5px;
  border-top-left-radius: 10px;
  border-bottom-right-radius: 15px;
  border-bottom-left-radius: 20px;
}`
      },
      {
        description: 'Border radius shorthand',
        ltr: `
.test {
  border-radius: 5px 10px 15px 20px; /* top-left top-right bottom-right bottom-left */
}`,
        expected: `
.test {
  border-radius: 10px 5px 20px 15px; /* top-right top-left bottom-left bottom-right */
}`
      }
    ]
  },
  {
    name: 'Background Position',
    tests: [
      {
        description: 'Background position',
        ltr: `
.test {
  background-position: left top;
}
.another {
  background-position: right top;
}`,
        expected: `
.test {
  background-position: right top;
}
.another {
  background-position: left top;
}`
      },
      {
        description: 'Background position with percentage',
        ltr: `
.test {
  background-position: 25% 50%;
}`,
        expected: `
.test {
  background-position: 75% 50%;
}`
      }
    ]
  },
  {
    name: 'Transforms and Transitions',
    tests: [
      {
        description: 'Transform translate',
        ltr: `
.test {
  transform: translateX(10px);
}
.another {
  transform: translate(20px, 30px);
}`,
        expected: `
.test {
  transform: translateX(-10px);
}
.another {
  transform: translate(-20px, 30px);
}`
      }
    ]
  },
  {
    name: 'Special Directives',
    tests: [
      {
        description: 'rtl:ignore directive',
        ltr: `
.test {
  margin-left: 10px;
  /* rtl:ignore */
  padding-left: 20px;
  /* rtl:end */
}`,
        expected: `
.test {
  margin-right: 10px;
  /* rtl:ignore */
  padding-left: 20px;
  /* rtl:end */
}`,
        options: { clean: true }
      },
      {
        description: 'rtl:remove directive',
        ltr: `
.test {
  margin-left: 10px;
  /* rtl:remove */
  text-align: left;
  /* rtl:end */
}`,
        expected: `
.test {
  margin-right: 10px;
}`,
        options: { clean: true }
      }
    ]
  }
];

/**
 * Run all tests
 */
async function runTests() {
  console.log(`${colors.cyan}RTLCSS Conversion Test Tool${colors.reset}`);
  console.log(`${colors.cyan}============================${colors.reset}`);
  console.log();

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const category of testCases) {
    console.log(`${colors.magenta}Category: ${category.name}${colors.reset}`);
    
    for (const test of category.tests) {
      totalTests++;
      
      try {
        // Run the LTR to RTL conversion
        const result = await convertService.ltrToRtl({
          css: test.ltr,
          rtlcssOptions: test.options || {}
        });

        // Normalize whitespace to make comparison easier
        const normalizedActual = normalizeWhitespace(result.converted);
        const normalizedExpected = normalizeWhitespace(test.expected);

        // Check if the conversion matches the expected output
        if (normalizedActual === normalizedExpected) {
          console.log(`  ${colors.green}✓ Passed: ${test.description}${colors.reset}`);
          passedTests++;
        } else {
          console.log(`  ${colors.red}✗ Failed: ${test.description}${colors.reset}`);
          console.log(`    ${colors.yellow}Expected:${colors.reset}`);
          console.log(formatCodeBlock(test.expected));
          console.log(`    ${colors.yellow}Actual:${colors.reset}`);
          console.log(formatCodeBlock(result.converted));
          failedTests++;
        }

        // Also test RTL to LTR conversion if this is enabled
        if (process.argv.includes('--test-both')) {
          const rtlToLtrResult = await convertService.rtlToLtr({
            css: normalizedActual,
            rtlcssOptions: test.options || {}
          });

          const backToLtr = normalizeWhitespace(rtlToLtrResult.converted);
          const originalLtr = normalizeWhitespace(test.ltr);

          if (backToLtr === originalLtr) {
            console.log(`    ${colors.green}✓ Round-trip conversion successful${colors.reset}`);
          } else {
            console.log(`    ${colors.red}✗ Round-trip conversion failed${colors.reset}`);
            console.log(`      ${colors.yellow}Expected (original LTR):${colors.reset}`);
            console.log(formatCodeBlock(test.ltr));
            console.log(`      ${colors.yellow}Actual (after RTL→LTR):${colors.reset}`);
            console.log(formatCodeBlock(rtlToLtrResult.converted));
          }
        }
      } catch (error) {
        console.log(`  ${colors.red}✗ Error: ${test.description} - ${error.message}${colors.reset}`);
        failedTests++;
      }
    }
    
    console.log();
  }

  // Print summary
  console.log(`${colors.cyan}Test Summary${colors.reset}`);
  console.log(`${colors.cyan}============${colors.reset}`);
  console.log(`Total tests: ${totalTests}`);
  console.log(`Passed: ${colors.green}${passedTests}${colors.reset}`);
  console.log(`Failed: ${colors.red}${failedTests}${colors.reset}`);
  console.log(`Success rate: ${Math.round((passedTests / totalTests) * 100)}%`);

  // Exit with appropriate code
  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

/**
 * Normalize whitespace in CSS string
 * 
 * @param {string} css CSS string to normalize
 * @returns {string} Normalized CSS
 */
function normalizeWhitespace(css) {
  // Remove comments with generated notes
  css = css.replace(/\/\* Converted (to RTL|to LTR) by .+? \*\/\n/g, '');
  
  // Remove leading/trailing whitespace
  css = css.trim();
  
  // Normalize line endings
  css = css.replace(/\r\n/g, '\n');
  
  // Remove extra whitespace between property and value
  css = css.replace(/\s*:\s*/g, ': ');
  
  // Remove extra whitespace after semicolons
  css = css.replace(/;\s*/g, ';');
  
  // Add newline after closing brackets
  css = css.replace(/}\s*/g, '}\n');
  
  // Remove empty lines
  css = css.replace(/^\s*[\r\n]/gm, '');
  
  return css;
}

/**
 * Format code block for display
 * 
 * @param {string} code Code to format
 * @returns {string} Formatted code
 */
function formatCodeBlock(code) {
  const lines = code.split('\n');
  return lines.map(line => `      ${colors.blue}${line}${colors.reset}`).join('\n');
}

// Run tests if script is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error(`${colors.red}Error running tests: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testCases
};