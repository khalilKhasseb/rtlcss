#!/usr/bin/env node

/**
 * Security Scanner for RTLCSS API Service
 * 
 * This script performs various security checks on the codebase to help identify
 * potential security issues before they become problems.
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const util = require('util');
const glob = util.promisify(require('glob'));

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

// Patterns to search for
const securityPatterns = [
  {
    name: 'Hard-coded secrets',
    regex: /['"`](api[_-]?key|api[_-]?secret|password|secret|token|auth[_-]?token)['":].*?['"]([a-zA-Z0-9_\-\.=]{8,})['"]/gi,
    severity: 'high',
    description: 'Hard-coded API keys, secrets, or tokens found in the code.'
  },
  {
    name: 'Insecure eval usage',
    regex: /eval\s*\(/g,
    severity: 'high',
    description: 'Use of eval() can lead to code injection vulnerabilities.'
  },
  {
    name: 'Insecure RegExp',
    regex: /new\s+RegExp\s*\(\s*['"`].*?['"]\s*\+/g,
    severity: 'medium',
    description: 'Dynamically constructed regular expressions can lead to ReDoS attacks.'
  },
  {
    name: 'Dangerous require',
    regex: /require\s*\(\s*([^'"]*?)\s*\+/g,
    severity: 'medium',
    description: 'Dynamic requires can lead to code injection vulnerabilities.'
  },
  {
    name: 'Disabled security',
    regex: /(helmet|csrf|sanitize|validate).*?false/gi,
    severity: 'medium',
    description: 'Potentially disabled security features.'
  },
  {
    name: 'HTTP protocol',
    regex: /https?:\/\/localhost/gi,
    severity: 'low',
    description: 'Using HTTP instead of HTTPS (may be acceptable for localhost).'
  },
  {
    name: 'Potential prototype pollution',
    regex: /Object\.assign\(\s*{}\s*,\s*(?!{)/g,
    severity: 'medium',
    description: 'Possible prototype pollution vulnerability.'
  },
  {
    name: 'Debug logging',
    regex: /console\.(log|debug)\s*\(/g,
    severity: 'low',
    description: 'Debug logging should be removed in production.'
  },
  {
    name: 'Shell command injection',
    regex: /exec\s*\(\s*(['"`].*?['"`])\s*\+/g,
    severity: 'high',
    description: 'Possible command injection vulnerability.'
  },
  {
    name: 'Unsanitized file path',
    regex: /(readFile|writeFile|unlink|mkdir)\s*\(\s*.*?\+/g,
    severity: 'medium',
    description: 'File paths should be sanitized to prevent path traversal.'
  }
];

/**
 * Run npm audit to check for vulnerable dependencies
 */
async function checkDependencies() {
  console.log(`${colors.bold}${colors.blue}Checking dependencies for vulnerabilities...${colors.reset}`);
  
  try {
    const output = execSync('npm audit --json', { encoding: 'utf8' });
    const result = JSON.parse(output);
    
    if (result.metadata.vulnerabilities.total > 0) {
      console.log(`${colors.red}Found ${result.metadata.vulnerabilities.total} vulnerabilities:${colors.reset}`);
      
      // Display vulnerability counts by severity
      const { critical, high, moderate, low } = result.metadata.vulnerabilities;
      
      if (critical > 0) console.log(`  ${colors.red}Critical: ${critical}${colors.reset}`);
      if (high > 0) console.log(`  ${colors.red}High: ${high}${colors.reset}`);
      if (moderate > 0) console.log(`  ${colors.yellow}Moderate: ${moderate}${colors.reset}`);
      if (low > 0) console.log(`  ${colors.blue}Low: ${low}${colors.reset}`);
      
      // Suggest fix
      console.log(`\nRun ${colors.green}npm audit fix${colors.reset} to automatically fix issues, or ${colors.green}npm audit${colors.reset} for details.`);
      return false;
    } else {
      console.log(`${colors.green}No vulnerabilities found in dependencies.${colors.reset}`);
      return true;
    }
  } catch (error) {
    console.error(`${colors.red}Error checking dependencies: ${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * Scan source code for potential security issues
 */
async function scanSourceCode() {
  console.log(`\n${colors.bold}${colors.blue}Scanning source code for security issues...${colors.reset}`);
  
  // Find all JavaScript files
  const files = await glob('src/**/*.js');
  let totalIssues = 0;
  const issuesByPattern = {};
  
  // Initialize issue count for each pattern
  securityPatterns.forEach(pattern => {
    issuesByPattern[pattern.name] = 0;
  });
  
  // Process each file
  for (const file of files) {
    const content = await fs.readFile(file, 'utf8');
    
    // Check each security pattern
    for (const pattern of securityPatterns) {
      // Reset regex lastIndex before each search
      pattern.regex.lastIndex = 0;
      
      // Find all matches
      const matches = content.match(pattern.regex);
      
      if (matches && matches.length > 0) {
        if (issuesByPattern[pattern.name] === 0) {
          // First time seeing this pattern
          const severityColor = 
            pattern.severity === 'high' ? colors.red :
            pattern.severity === 'medium' ? colors.yellow :
            colors.blue;
          
          console.log(`\n${severityColor}[${pattern.severity.toUpperCase()}] ${pattern.name}${colors.reset}`);
          console.log(`${colors.white}${pattern.description}${colors.reset}`);
        }
        
        // Increment issue counts
        issuesByPattern[pattern.name] += matches.length;
        totalIssues += matches.length;
        
        // Report the file with issues
        console.log(`  ${colors.cyan}${file}${colors.reset}: ${matches.length} matches`);
      }
    }
  }
  
  // Summary
  console.log(`\n${colors.bold}Source code scan summary:${colors.reset}`);
  
  if (totalIssues === 0) {
    console.log(`${colors.green}No security issues found in source code.${colors.reset}`);
    return true;
  } else {
    console.log(`${colors.red}Found ${totalIssues} potential security issues.${colors.reset}`);
    return false;
  }
}

/**
 * Check for outdated dependencies
 */
async function checkOutdatedDependencies() {
  console.log(`\n${colors.bold}${colors.blue}Checking for outdated dependencies...${colors.reset}`);
  
  try {
    const output = execSync('npm outdated --json', { encoding: 'utf8' });
    
    if (output.trim()) {
      const outdated = JSON.parse(output);
      const outdatedCount = Object.keys(outdated).length;
      
      if (outdatedCount > 0) {
        console.log(`${colors.yellow}Found ${outdatedCount} outdated dependencies:${colors.reset}`);
        
        // Display top 5 outdated packages
        const packages = Object.entries(outdated)
          .sort(([, a], [, b]) => b.current.localeCompare(a.current))
          .slice(0, 5);
        
        packages.forEach(([name, info]) => {
          console.log(`  ${colors.cyan}${name}${colors.reset}: ${info.current} → ${colors.green}${info.latest}${colors.reset}`);
        });
        
        if (outdatedCount > 5) {
          console.log(`  ${colors.blue}...and ${outdatedCount - 5} more${colors.reset}`);
        }
        
        console.log(`\nRun ${colors.green}npm update${colors.reset} to update compatible dependencies, or ${colors.green}npm outdated${colors.reset} for details.`);
        return false;
      } else {
        console.log(`${colors.green}No outdated dependencies found.${colors.reset}`);
        return true;
      }
    } else {
      console.log(`${colors.green}No outdated dependencies found.${colors.reset}`);
      return true;
    }
  } catch (error) {
    if (error.status === 1 && error.stdout) {
      // npm outdated returns status 1 when outdated deps are found
      const outdated = JSON.parse(error.stdout);
      const outdatedCount = Object.keys(outdated).length;
      
      console.log(`${colors.yellow}Found ${outdatedCount} outdated dependencies.${colors.reset}`);
      console.log(`Run ${colors.green}npm outdated${colors.reset} for details.`);
      return false;
    } else {
      console.error(`${colors.red}Error checking outdated dependencies: ${error.message}${colors.reset}`);
      return false;
    }
  }
}

/**
 * Check for secure configuration
 */
async function checkConfiguration() {
  console.log(`\n${colors.bold}${colors.blue}Checking security configuration...${colors.reset}`);
  
  const configFiles = [
    'src/middleware/security.js',
    'src/middleware/auth.js',
    'config/default.js',
    'config/production.js'
  ];
  
  const securityChecks = [
    {
      name: 'HTTPS enforcement',
      pattern: /enforceHTTPS/,
      file: 'src/middleware/security.js',
      required: true
    },
    {
      name: 'Helmet security headers',
      pattern: /helmet/,
      file: 'src/middleware/security.js',
      required: true
    },
    {
      name: 'CSRF protection',
      pattern: /csrf/i,
      file: 'src/middleware/security.js',
      required: false
    },
    {
      name: 'Rate limiting',
      pattern: /rateLimit/,
      file: 'src/middleware/rateLimit.js',
      required: true
    },
    {
      name: 'Request validation',
      pattern: /validate/,
      file: 'src/services/validator.js',
      required: true
    },
    {
      name: 'Strong default AUTH_SECRET_KEY check',
      pattern: /AUTH_SECRET_KEY.*?throw/,
      file: 'config/production.js',
      required: true
    }
  ];
  
  let issuesFound = false;
  
  // Check each security feature
  for (const check of securityChecks) {
    try {
      let content;
      try {
        content = await fs.readFile(check.file, 'utf8');
      } catch (e) {
        console.log(`${colors.yellow}⚠ Could not find ${check.file} to check for ${check.name}${colors.reset}`);
        if (check.required) issuesFound = true;
        continue;
      }
      
      if (check.pattern.test(content)) {
        console.log(`${colors.green}✓ ${check.name} is configured${colors.reset}`);
      } else {
        console.log(`${colors.red}✗ ${check.name} is not configured in ${check.file}${colors.reset}`);
        if (check.required) issuesFound = true;
      }
    } catch (error) {
      console.error(`${colors.red}Error checking ${check.name}: ${error.message}${colors.reset}`);
      if (check.required) issuesFound = true;
    }
  }
  
  // Check for .env file
  try {
    await fs.access('.env');
    
    // Check if .env is in .gitignore
    const gitignore = await fs.readFile('.gitignore', 'utf8');
    if (gitignore.includes('.env')) {
      console.log(`${colors.green}✓ .env file is properly excluded from git${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ .env file should be added to .gitignore${colors.reset}`);
      issuesFound = true;
    }
  } catch (e) {
    console.log(`${colors.yellow}⚠ No .env file found - make sure to create one for production${colors.reset}`);
  }
  
  if (!issuesFound) {
    console.log(`${colors.green}All required security configurations are in place.${colors.reset}`);
    return true;
  } else {
    console.log(`${colors.red}Some required security configurations are missing.${colors.reset}`);
    return false;
  }
}

/**
 * Main function to run all security checks
 */
async function main() {
  console.log(`${colors.bold}${colors.magenta}======= RTLCSS API Security Scan =======${colors.reset}\n`);
  
  let allPassed = true;
  
  allPassed = await checkDependencies() && allPassed;
  allPassed = await scanSourceCode() && allPassed;
  allPassed = await checkOutdatedDependencies() && allPassed;
  allPassed = await checkConfiguration() && allPassed;
  
  console.log(`\n${colors.bold}${colors.magenta}======= Security Scan Complete =======${colors.reset}\n`);
  
  if (allPassed) {
    console.log(`${colors.green}${colors.bold}All security checks passed! 🎉${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.yellow}${colors.bold}Some security checks failed. Please review the issues above. ⚠️${colors.reset}`);
    process.exit(1);
  }
}

// Run the security scan
main().catch(error => {
  console.error(`${colors.red}Unexpected error: ${error.message}${colors.reset}`);
  process.exit(1);
});