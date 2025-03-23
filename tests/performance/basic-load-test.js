import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
import crypto from 'k6/crypto';
import encoding from 'k6/encoding';

// Create custom metrics
const errorRate = new Rate('error_rate');
const conversionTimes = new Trend('conversion_times');
const authTimes = new Trend('auth_times');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 users over 30 seconds
    { duration: '1m', target: 10 },  // Stay at 10 users for 1 minute
    { duration: '30s', target: 25 }, // Ramp up to 25 users over 30 seconds
    { duration: '1m', target: 25 },  // Stay at 25 users for 1 minute
    { duration: '30s', target: 0 },  // Ramp down to 0 users over 30 seconds
  ],
  thresholds: {
    'http_req_duration': ['p(95)<1000'], // 95% of requests should be below 1s
    'error_rate': ['rate<0.1'],          // Error rate should be below 10%
    'conversion_times': ['p(95)<1500'],  // 95% of conversions should be below 1.5s
    'auth_times': ['p(95)<500'],         // 95% of auth requests should be below 0.5s
  },
};

// Test data - a simple CSS file to convert
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

/* Add more rules to make it a bit larger */
.header {
  margin-left: 20px;
  padding-left: 15px;
}

.footer {
  margin-right: 20px;
  text-align: left;
}

.sidebar {
  float: left;
  width: 200px;
  border-right: 1px solid #eee;
}

.main-content {
  margin-left: 220px;
}
`;

// Initialize test data
const API_URL = 'http://localhost:3000';
const API_KEY = 'test-api-key';
const API_SECRET = 'test-api-secret';

/**
 * Create HMAC signature for request authentication
 */
function createSignature(path, method, timestamp, secret) {
  const payload = `${path}|${method}|${timestamp}`;
  
  // Generate HMAC-SHA256 signature
  const hmac = crypto.createHMAC('sha256', secret);
  hmac.update(payload);
  return hmac.digest('hex');
}

/**
 * Helper function to make authenticated API requests
 */
function apiRequest(method, path, body = null) {
  const timestamp = Date.now();
  const signature = createSignature(path, method, timestamp, API_SECRET);
  
  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
    'X-Timestamp': timestamp.toString(),
    'X-Signature': signature
  };
  
  const url = `${API_URL}${path}`;
  
  let response;
  if (method === 'GET') {
    response = http.get(url, { headers });
  } else {
    response = http.post(url, body ? JSON.stringify(body) : null, { headers });
  }
  
  const success = response.status === 200;
  errorRate.add(!success);
  return response;
}

/**
 * Test setup - runs once per VU
 */
export function setup() {
  // Verify that the API is up and running
  const response = http.get(`${API_URL}/api/status`);
  check(response, {
    'API is running': (r) => r.status === 200,
  });
  
  // For a real test, you might want to create actual API keys here
  return {
    apiKey: API_KEY,
    apiSecret: API_SECRET
  };
}

/**
 * Main test function - runs for every VU
 */
export default function(data) {
  // Test 1: Verify API credentials
  let response = apiRequest('POST', '/api/auth/verify');
  check(response, {
    'Authentication successful': (r) => r.status === 200 && r.json('success') === true,
  });
  authTimes.add(response.timings.duration);
  
  // Small pause between requests
  sleep(0.5);
  
  // Test 2: LTR to RTL conversion
  const startTime = new Date();
  response = apiRequest('POST', '/api/convert/ltr-to-rtl', {
    css: testCss,
    options: {
      clean: true
    }
  });
  const duration = new Date() - startTime;
  
  check(response, {
    'Conversion successful': (r) => r.status === 200 && r.json('success') === true,
    'Response contains converted CSS': (r) => r.json('data.converted') && r.json('data.converted').includes('margin-right'),
    'Response includes stats': (r) => r.json('data.stats') !== undefined,
  });
  
  conversionTimes.add(duration);
  
  // Test 3: RTL to LTR conversion (use the result from the previous conversion)
  if (response.status === 200) {
    const rtlCss = response.json('data.converted');
    
    response = apiRequest('POST', '/api/convert/rtl-to-ltr', {
      css: rtlCss,
      options: {
        clean: true
      }
    });
    
    check(response, {
      'Reverse conversion successful': (r) => r.status === 200 && r.json('success') === true,
      'Response contains converted CSS': (r) => r.json('data.converted') && r.json('data.converted').includes('margin-left'),
    });
    
    conversionTimes.add(response.timings.duration);
  }
  
  // Test 4: Check service status
  response = http.get(`${API_URL}/api/status`);
  check(response, {
    'Status endpoint responds': (r) => r.status === 200,
    'Service is operational': (r) => r.json('data.status') === 'operational',
  });
  
  // Sleep between iterations to simulate real user behavior
  sleep(1);
}

/**
 * Teardown function - runs once per test
 */
export function teardown(data) {
  // Nothing to clean up in this test
}