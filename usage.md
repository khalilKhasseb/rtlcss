# RTLCSS API Service - Usage Documentation

## Table of Contents

- [Introduction](#introduction)
- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Error Handling](#error-handling)
- [Code Examples](#code-examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

## Introduction

The RTLCSS API Service provides a powerful solution for converting CSS between Left-to-Right (LTR) and Right-to-Left (RTL) formats. This service is built on the Node.js RTLCSS library, offering advanced capabilities for handling complex CSS transformations.

### Key Features

- **Bidirectional Conversion**: Convert CSS from LTR to RTL and RTL to LTR
- **Advanced Transformation**: Support for all RTLCSS directives and special comments
- **Customizable Options**: Configure conversion behavior to match your needs
- **Secure Authentication**: HMAC signature-based authentication
- **Performance Monitoring**: Get statistics on conversion operations
- **Error Handling**: Comprehensive error messages for troubleshooting

## Getting Started

### Prerequisites

- An API key and secret (obtained from the service administrator)
- Basic understanding of HTTP requests
- A valid CSS file to convert

### Quick Start

1. Obtain your API credentials
2. Make an authenticated request to the conversion endpoint
3. Receive and use the converted CSS

## Authentication

The API uses HMAC signature-based authentication to ensure secure access. Each request must include three HTTP headers:

| Header | Description |
|--------|-------------|
| `X-API-Key` | Your unique API key |
| `X-Timestamp` | Current timestamp in milliseconds since epoch (UTC) |
| `X-Signature` | HMAC-SHA256 signature of the request |

### Creating the Signature

The signature is an HMAC-SHA256 hash of a specific payload string, using your API secret as the key. The payload follows this format:

```
{path}|{method}|{timestamp}
```

Where:
- `{path}` is the full request path, including the leading slash (e.g., `/api/convert/ltr-to-rtl`)
- `{method}` is the HTTP method (GET, POST, etc.)
- `{timestamp}` is the same timestamp used in the `X-Timestamp` header

### Authentication Example

```javascript
// Generate timestamp (milliseconds since epoch)
const timestamp = Date.now();

// Create payload string
const path = '/api/convert/ltr-to-rtl';
const method = 'POST';
const payload = `${path}|${method}|${timestamp}`;

// Create HMAC signature using your API secret
const signature = crypto
  .createHmac('sha256', 'your-api-secret')
  .update(payload)
  .digest('hex');

// Include in request headers
const headers = {
  'X-API-Key': 'your-api-key',
  'X-Timestamp': timestamp.toString(),
  'X-Signature': signature
};
```

## API Endpoints

### Convert LTR to RTL

Converts CSS from Left-to-Right to Right-to-Left format.

**Endpoint:** `POST /api/convert/ltr-to-rtl`

**Request:**

You can send CSS content in two ways:

**Option 1: JSON Body**
```json
{
  "css": "/* CSS content here */",
  "options": {
    "autoRename": false,
    "clean": true,
    "/* other RTLCSS options */": "..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "converted": "/* Converted CSS content */",
    "stats": {
      "originalSize": 1024,
      "convertedSize": 1052,
      "processingTimeMs": 45
    }
  },
  "meta": {
    "service": "rtlcss-api",
    "version": "1.0.0",
    "timestamp": "2025-03-23T00:43:12Z"
  }
}
```

### Convert RTL to LTR

Converts CSS from Right-to-Left to Left-to-Right format.

**Endpoint:** `POST /api/convert/rtl-to-ltr`

The request and response formats are identical to the LTR to RTL endpoint.

### Verify API Credentials

Verifies that your API credentials are valid.

**Endpoint:** `POST /api/auth/verify`

**Request:** No request body needed

**Response:**
```json
{
  "success": true,
  "data": {
    "verified": true,
    "apiKey": "your-api-key"
  },
  "meta": {
    "service": "rtlcss-api",
    "timestamp": "2025-03-23T00:43:12Z"
  }
}
```

### Get Service Status

Checks if the API service is operational.

**Endpoint:** `GET /api/status`

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "operational",
    "version": "1.0.0",
    "rtlcssVersion": "4.1.0",
    "uptime": 3600,
    "environment": "production"
  },
  "meta": {
    "service": "rtlcss-api",
    "timestamp": "2025-03-23T00:43:12Z"
  }
}
```

## RTLCSS Options

You can customize the conversion by providing RTLCSS options in your requests. Here are the supported options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `autoRename` | Boolean | `false` | Auto rename identifiers that contain directional terms |
| `autoRenameStrict` | Boolean | `false` | Only auto rename identifiers if directional term is a whole word |
| `blacklist` | Object | `{}` | Selectors/properties to ignore |
| `clean` | Boolean | `true` | Process special directives like `/*rtl:ignore*/` |
| `greedy` | Boolean | `false` | Enable/disable greedy RTL searching |
| `processUrls` | Boolean | `false` | Process URLs that include 'left' or 'right' terms |
| `stringMap` | Array | `[]` | Custom string map for additional term substitutions |
| `useCalc` | Boolean | `false` | Enable/disable calc method to offset values |

### Using Special Directives

RTLCSS supports special directives in your CSS to customize the conversion process:

```css
.example {
  margin-left: 10px;
  /* rtl:ignore */
  padding-left: 20px;
  /* rtl:end */
}
```

In the example above, `margin-left` will be converted to `margin-right`, but `padding-left` will remain unchanged because of the `rtl:ignore` directive.

## Error Handling

All errors follow this consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Authentication failure |
| `INVALID_API_KEY` | 401 | The API key is not valid |
| `INVALID_SIGNATURE` | 401 | The signature verification failed |
| `TIMESTAMP_EXPIRED` | 401 | The request timestamp is too old |
| `VALIDATION_ERROR` | 422 | Invalid request parameters |
| `INVALID_CSS` | 422 | The CSS content is not valid |
| `FILE_TOO_LARGE` | 400 | The uploaded file exceeds the size limit |
| `NO_CSS_CONTENT` | 400 | No CSS content provided |
| `CONVERSION_ERROR` | 500 | Error during CSS conversion |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests in a short period |

## Code Examples

### JavaScript/Node.js

```javascript
const https = require('https');
const crypto = require('crypto');

// Configuration
const API_KEY = 'your-api-key';
const API_SECRET = 'your-api-secret';
const API_HOST = 'rtlcss-api.example.com'; // Or 'localhost' for local development
const API_PORT = 443; // Use 3000 for local development with HTTP

/**
 * Convert CSS from LTR to RTL
 */
function convertLtrToRtl(css, options = {}) {
  return new Promise((resolve, reject) => {
    // API endpoint and request parameters
    const apiPath = '/api/convert/ltr-to-rtl';
    const method = 'POST';
    const timestamp = Date.now();
    
    // Create signature
    const payload = `${apiPath}|${method}|${timestamp}`;
    const signature = crypto
      .createHmac('sha256', API_SECRET)
      .update(payload)
      .digest('hex');
    
    // Request options
    const requestOptions = {
      hostname: API_HOST,
      port: API_PORT,
      path: apiPath,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        'X-Timestamp': timestamp.toString(),
        'X-Signature': signature
      }
    };
    
    // Make the request
    const req = https.request(requestOptions, (res) => {
      let data = '';
      
      // Collect response data
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      // Process response when complete
      res.on('end', () => {
        if (res.statusCode !== 200) {
          try {
            const errorData = JSON.parse(data);
            reject(new Error(errorData.error?.message || `API Error: ${res.statusCode}`));
          } catch (e) {
            reject(new Error(`API Error: ${res.statusCode} - ${data}`));
          }
          return;
        }
        
        try {
          const response = JSON.parse(data);
          if (!response.success) {
            reject(new Error(response.error?.message || 'Unknown API error'));
            return;
          }
          
          resolve(response.data);
        } catch (error) {
          reject(new Error(`Error parsing response: ${error.message}`));
        }
      });
    });
    
    // Handle request errors
    req.on('error', (error) => {
      reject(new Error(`Request error: ${error.message}`));
    });
    
    // Send the request with CSS data
    req.write(JSON.stringify({ css, options }));
    req.end();
  });
}

// Usage example
const css = `
.example {
  margin-left: 10px;
  padding-right: 20px;
  text-align: left;
}
`;

convertLtrToRtl(css, { clean: true })
  .then(result => {
    console.log('Converted CSS:');
    console.log(result.converted);
    console.log('\nStatistics:');
    console.log(`Original size: ${result.stats.originalSize} bytes`);
    console.log(`Converted size: ${result.stats.convertedSize} bytes`);
    console.log(`Processing time: ${result.stats.processingTimeMs} ms`);
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
```

### PHP

```php
<?php

/**
 * Convert CSS from LTR to RTL using the RTLCSS API
 *
 * @param string $css The CSS content to convert
 * @param array $options RTLCSS options
 * @return array Conversion result
 */
function convertLtrToRtl($css, $options = []) {
    // Configuration
    $apiKey = 'your-api-key';
    $apiSecret = 'your-api-secret';
    $apiHost = 'rtlcss-api.example.com'; // Or 'localhost' for local development
    $apiPort = 443; // Use 3000 for local development with HTTP
    $apiPath = '/api/convert/ltr-to-rtl';
    $method = 'POST';
    
    // Generate timestamp
    $timestamp = round(microtime(true) * 1000);
    
    // Create signature
    $payload = $apiPath . '|' . $method . '|' . $timestamp;
    $signature = hash_hmac('sha256', $payload, $apiSecret);
    
    // Prepare request
    $url = "https://{$apiHost}{$apiPath}";
    if ($apiPort != 443) {
        $url = "http://{$apiHost}:{$apiPort}{$apiPath}";
    }
    
    $data = json_encode([
        'css' => $css,
        'options' => $options
    ]);
    
    $headers = [
        'Content-Type: application/json',
        'X-API-Key: ' . $apiKey,
        'X-Timestamp: ' . $timestamp,
        'X-Signature: ' . $signature
    ];
    
    // Make the request
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    $response = curl_exec($ch);
    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    
    curl_close($ch);
    
    // Handle errors
    if ($curlError) {
        throw new Exception('cURL Error: ' . $curlError);
    }
    
    if ($statusCode !== 200) {
        $error = json_decode($response, true);
        $errorMessage = isset($error['error']['message']) ? $error['error']['message'] : "API Error: {$statusCode}";
        throw new Exception($errorMessage);
    }
    
    // Parse and return response
    $result = json_decode($response, true);
    
    if (!$result['success']) {
        throw new Exception($result['error']['message'] ?? 'Unknown API error');
    }
    
    return $result['data'];
}

// Usage example
try {
    $css = '
    .example {
      margin-left: 10px;
      padding-right: 20px;
      text-align: left;
    }
    ';
    
    $result = convertLtrToRtl($css, ['clean' => true]);
    
    echo "Converted CSS:\n";
    echo $result['converted'] . "\n\n";
    
    echo "Statistics:\n";
    echo "Original size: {$result['stats']['originalSize']} bytes\n";
    echo "Converted size: {$result['stats']['convertedSize']} bytes\n";
    echo "Processing time: {$result['stats']['processingTimeMs']} ms\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
```

### Python

```python
import requests
import json
import time
import hmac
import hashlib

def convert_ltr_to_rtl(css, options=None):
    """
    Convert CSS from LTR to RTL using the RTLCSS API
    
    Args:
        css (str): The CSS content to convert
        options (dict, optional): RTLCSS options
        
    Returns:
        dict: Conversion result
    """
    # Configuration
    api_key = 'your-api-key'
    api_secret = 'your-api-secret'
    api_host = 'rtlcss-api.example.com'  # Or 'localhost' for local development
    api_port = 443  # Use 3000 for local development with HTTP
    api_path = '/api/convert/ltr-to-rtl'
    method = 'POST'
    
    # Generate timestamp (milliseconds)
    timestamp = int(time.time() * 1000)
    
    # Create signature
    payload = f"{api_path}|{method}|{timestamp}"
    signature = hmac.new(
        api_secret.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    # Prepare request
    url = f"https://{api_host}{api_path}"
    if api_port != 443:
        url = f"http://{api_host}:{api_port}{api_path}"
    
    headers = {
        'Content-Type': 'application/json',
        'X-API-Key': api_key,
        'X-Timestamp': str(timestamp),
        'X-Signature': signature
    }
    
    data = {
        'css': css,
        'options': options or {}
    }
    
    # Make the request
    response = requests.post(url, json=data, headers=headers)
    
    # Handle errors
    if response.status_code != 200:
        try:
            error_data = response.json()
            error_message = error_data.get('error', {}).get('message', f"API Error: {response.status_code}")
            raise Exception(error_message)
        except ValueError:
            raise Exception(f"API Error: {response.status_code} - {response.text}")
    
    # Parse and return response
    result = response.json()
    
    if not result.get('success'):
        error = result.get('error', {})
        raise Exception(error.get('message', 'Unknown API error'))
    
    return result.get('data')

# Usage example
try:
    css = """
    .example {
      margin-left: 10px;
      padding-right: 20px;
      text-align: left;
    }
    """
    
    result = convert_ltr_to_rtl(css, {'clean': True})
    
    print("Converted CSS:")
    print(result['converted'])
    
    print("\nStatistics:")
    print(f"Original size: {result['stats']['originalSize']} bytes")
    print(f"Converted size: {result['stats']['convertedSize']} bytes")
    print(f"Processing time: {result['stats']['processingTimeMs']} ms")
except Exception as e:
    print(f"Error: {e}")
```

## Command Line Usage

A simple command-line tool is included for testing and quick conversions.

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/rtlcss-api.git
cd rtlcss-api

# Install dependencies
npm install
```

### Usage

```bash
# Convert a CSS file from LTR to RTL
node tools/convert-css.js path/to/your/file.css > converted.css

# Convert a CSS file from RTL to LTR
node tools/convert-css.js --rtl-to-ltr path/to/your/file.css > converted.css

# Convert with custom options
node tools/convert-css.js --options='{"clean":true,"autoRename":true}' path/to/your/file.css > converted.css
```

## Best Practices

### Security

1. **Protect API Secret**: Never expose your API secret in client-side code.
2. **Use HTTPS**: Always use HTTPS in production environments.
3. **Validate Input**: Validate CSS content before sending it to the API.

### Performance

1. **Optimize CSS**: Remove unnecessary CSS before conversion to improve performance.
2. **Implement Caching**: Cache conversion results to avoid redundant API calls.
3. **Set Proper Timeouts**: Configure appropriate request timeouts for your client.

### Error Handling

1. **Implement Retry Logic**: Add retry mechanisms for rate limit and network errors.
2. **Log Errors**: Log error responses for debugging purposes.
3. **Graceful Degradation**: Provide fallback mechanisms when the API is unavailable.

## Troubleshooting

### Common Issues

#### Authentication Errors

- **Issue**: `INVALID_API_KEY` or `INVALID_SIGNATURE` error
- **Solution**: Double-check your API key and secret, ensure the timestamp is in milliseconds, and verify the signature calculation.

#### Request Timeout

- **Issue**: Request times out when converting large CSS files
- **Solution**: Increase client timeout settings or split large CSS files into smaller chunks.

#### Rate Limit Exceeded

- **Issue**: `RATE_LIMIT_EXCEEDED` error
- **Solution**: Implement exponential backoff retry logic and consider caching results to reduce API calls.

#### Invalid CSS Content

- **Issue**: `INVALID_CSS` error
- **Solution**: Validate your CSS before sending it to the API, ensure it's properly formatted.

### Getting Help

If you encounter issues not covered in this documentation, contact your API administrator or support team.

## FAQ

### What is the difference between LTR and RTL?

LTR (Left-to-Right) and RTL (Right-to-Left) refer to the writing direction of text. LTR is used in languages like English, while RTL is used in languages like Arabic, Hebrew, and Persian. CSS properties often need to be flipped when switching between these directions.

### What happens if I have special directives in my CSS?

The RTLCSS engine respects special directives in your CSS, such as:
- `/*rtl:ignore*/` to prevent conversion of specific rules
- `/*rtl:remove*/` to remove rules in RTL mode
- `/*rtl:raw:...*/` to provide raw replacements

### Can I convert SCSS or LESS files?

The API only accepts compiled CSS. You should compile your SCSS or LESS files to CSS before sending them to the API.

### Is there a file size limit?

Yes, the maximum file size is 10MB by default. For larger files, consider splitting them into smaller chunks.

### Can I convert multiple CSS files in one request?

No, you must send separate requests for each CSS file. However, you can batch process files on your client side.

### How can I verify my API credentials?

Use the `/api/auth/verify` endpoint to verify that your API credentials are valid.

### What happens if my CSS is invalid?

The API will return a validation error. You should validate your CSS before sending it to the API.

### Can I use the API in browser JavaScript?

Yes, but you should never expose your API secret in client-side code. Instead, implement a server-side proxy that makes the authenticated requests to the API.