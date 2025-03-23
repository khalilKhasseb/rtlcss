# RTLCSS API Service - Client Integration Guide

This document provides comprehensive instructions for integrating with the RTLCSS API service, allowing you to convert CSS between LTR (Left-to-Right) and RTL (Right-to-Left) formats in your applications.

## Authentication

The API uses HMAC signature-based authentication to ensure secure access. Each request must include the following HTTP headers:

| Header        | Description                                          |
|---------------|------------------------------------------------------|
| `X-API-Key`   | Your unique API key                                  |
| `X-Timestamp` | Current timestamp in milliseconds since epoch (UTC)  |
| `X-Signature` | HMAC-SHA256 signature of the request                 |

### Creating the Signature

The signature is an HMAC-SHA256 hash of a payload string, using your API secret as the key. The payload string should be formatted as follows:

```
{path}|{method}|{timestamp}
```

Where:
- `{path}` is the full request path, including the leading slash (e.g., `/api/convert/ltr-to-rtl`)
- `{method}` is the HTTP method (GET, POST, etc.)
- `{timestamp}` is the same timestamp used in the `X-Timestamp` header

#### Example Signature Creation (JavaScript)

```javascript
const crypto = require('crypto');

function createSignature(path, method, timestamp, apiSecret) {
  const payload = `${path}|${method}|${timestamp}`;
  return crypto
    .createHmac('sha256', apiSecret)
    .update(payload)
    .digest('hex');
}

// Usage
const timestamp = Date.now();
const path = '/api/convert/ltr-to-rtl';
const method = 'POST';
const signature = createSignature(path, method, timestamp, 'your-api-secret');
```

#### Example Signature Creation (PHP)

```php
function createSignature($path, $method, $timestamp, $apiSecret) {
    $payload = $path . '|' . $method . '|' . $timestamp;
    return hash_hmac('sha256', $payload, $apiSecret);
}

// Usage
$timestamp = round(microtime(true) * 1000);
$path = '/api/convert/ltr-to-rtl';
$method = 'POST';
$signature = createSignature($path, $method, $timestamp, 'your-api-secret');
```

## API Endpoints

### 1. Convert LTR to RTL

Converts CSS from Left-to-Right to Right-to-Left format.

**Endpoint:** `POST /api/convert/ltr-to-rtl`

**Request:**

You can send CSS content in one of two ways:

**Option 1: JSON Body**
```json
{
  "css": "/* CSS content here */",
  "options": {
    "autoRename": false,
    "clean": true,
    "/* other RTLCSS options */" : "..."
  }
}
```

**Option 2: Multipart Form Data**
- `cssFile`: File upload containing CSS content
- `options`: (Optional) JSON string of RTLCSS options

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
    "timestamp": "2023-05-01T12:00:00Z"
  }
}
```

### 2. Convert RTL to LTR

Converts CSS from Right-to-Left to Left-to-Right format.

**Endpoint:** `POST /api/convert/rtl-to-ltr`

The request and response formats are identical to the LTR to RTL endpoint.

### 3. Verify API Credentials

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
    "timestamp": "2023-05-01T12:00:00Z"
  }
}
```

### 4. Get Service Status

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
    "timestamp": "2023-05-01T12:00:00Z"
  }
}
```

### 5. Get Usage Statistics

Retrieves usage statistics for your API key.

**Endpoint:** `GET /api/status/usage`

**Response:**
```json
{
  "success": true,
  "data": {
    "usage": {
      "totalConversions": 1250,
      "ltrToRtl": 950,
      "rtlToLtr": 300,
      "averageProcessingTimeMs": 42,
      "averageOriginalSize": 5280,
      "averageConvertedSize": 5462,
      "lastUsed": "2023-05-01T12:00:00Z"
    },
    "history": [
      {
        "timestamp": "2023-05-01T12:00:00Z",
        "conversionType": "ltr_to_rtl",
        "originalSize": 6120,
        "convertedSize": 6315,
        "processingTimeMs": 38
      },
      // More entries...
    ]
  },
  "meta": {
    "service": "rtlcss-api",
    "timestamp": "2023-05-01T12:00:00Z"
  }
}
```

### 6. Test the API

Tests the API with a simple CSS conversion.

**Endpoint:** `POST /api/test`

**Request:** No request body needed

**Response:**
```json
{
  "success": true,
  "data": {
    "original": "/* Original test CSS */",
    "converted": "/* Converted test CSS */",
    "stats": {
      "originalSize": 1024,
      "convertedSize": 1052,
      "processingTimeMs": 45
    },
    "apiStatus": "operational"
  },
  "meta": {
    "service": "rtlcss-api",
    "version": "1.0.0",
    "rtlcssVersion": "4.1.0",
    "timestamp": "2023-05-01T12:00:00Z"
  }
}
```

## RTLCSS Options

You can customize the conversion by providing RTLCSS options in your requests. Here are the supported options:

| Option           | Type      | Default | Description                                           |
|------------------|-----------|---------|-------------------------------------------------------|
| `autoRename`     | Boolean   | `false` | Auto rename identifiers that contain directional terms |
| `autoRenameStrict` | Boolean | `false` | Only auto rename identifiers if directional term is a whole word |
| `blacklist`      | Object    | `{}`    | Selectors/properties to ignore                        |
| `clean`          | Boolean   | `true`  | Process special directives like `/*rtl:ignore*/`      |
| `greedy`         | Boolean   | `false` | Enable/disable greedy RTL searching                   |
| `processUrls`    | Boolean   | `false` | Process URLs that include 'left' or 'right' terms     |
| `stringMap`      | Array     | `[]`    | Custom string map for additional term substitutions   |
| `useCalc`        | Boolean   | `false` | Enable/disable calc method to offset values           |

For more details on RTLCSS options, see the [official RTLCSS documentation](https://github.com/MohammadYounes/rtlcss).

## Error Handling

All errors follow this format:

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

| Code                  | HTTP Status | Description                                           |
|-----------------------|-------------|-------------------------------------------------------|
| `UNAUTHORIZED`        | 401         | Authentication failure                                |
| `INVALID_API_KEY`     | 401         | The API key is not valid                              |
| `INVALID_SIGNATURE`   | 401         | The signature verification failed                     |
| `TIMESTAMP_EXPIRED`   | 401         | The request timestamp is too old                      |
| `VALIDATION_ERROR`    | 422         | Invalid request parameters                            |
| `INVALID_CSS`         | 422         | The CSS content is not valid                          |
| `FILE_TOO_LARGE`      | 400         | The uploaded file exceeds the size limit              |
| `NO_CSS_CONTENT`      | 400         | No CSS content provided                               |
| `CONVERSION_ERROR`    | 500         | Error during CSS conversion                           |
| `RATE_LIMIT_EXCEEDED` | 429         | Too many requests in a short period                   |

## Rate Limiting

The API enforces rate limiting to ensure fair usage and service stability. Limits vary by plan:

- **Free Plan**: 50 requests per 15-minute window
- **Basic Plan**: 200 requests per 15-minute window
- **Premium Plan**: 1000 requests per 15-minute window

When a rate limit is exceeded, the API will respond with a 429 status code and the `RATE_LIMIT_EXCEEDED` error.

## File Size Limits

- Maximum CSS file size: 10MB
- Maximum request body size: 10MB

## Client Code Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');
const crypto = require('crypto');

class RtlcssApiClient {
  constructor(apiKey, apiSecret, apiUrl = 'https://rtlcss-api.example.com') {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.apiUrl = apiUrl;
  }

  createSignature(path, method, timestamp) {
    const payload = `${path}|${method}|${timestamp}`;
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(payload)
      .digest('hex');
  }

  async convertLtrToRtl(css, options = {}) {
    const path = '/api/convert/ltr-to-rtl';
    const method = 'POST';
    const timestamp = Date.now();
    const signature = this.createSignature(path, method, timestamp);

    const response = await axios({
      method,
      url: `${this.apiUrl}${path}`,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        'X-Timestamp': timestamp,
        'X-Signature': signature
      },
      data: { css, options }
    });

    return response.data;
  }

  async convertRtlToLtr(css, options = {}) {
    const path = '/api/convert/rtl-to-ltr';
    const method = 'POST';
    const timestamp = Date.now();
    const signature = this.createSignature(path, method, timestamp);

    const response = await axios({
      method,
      url: `${this.apiUrl}${path}`,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        'X-Timestamp': timestamp,
        'X-Signature': signature
      },
      data: { css, options }
    });

    return response.data;
  }
}

// Usage
const client = new RtlcssApiClient('your-api-key', 'your-api-secret');

async function convertCss() {
  try {
    const css = `
      .example {
        margin-left: 10px;
        padding-right: 20px;
        text-align: left;
      }
    `;
    
    const result = await client.convertLtrToRtl(css, { clean: true });
    console.log(result.data.converted);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

convertCss();
```

### PHP

```php
class RtlcssApiClient {
    private $apiKey;
    private $apiSecret;
    private $apiUrl;

    public function __construct($apiKey, $apiSecret, $apiUrl = 'https://rtlcss-api.example.com') {
        $this->apiKey = $apiKey;
        $this->apiSecret = $apiSecret;
        $this->apiUrl = $apiUrl;
    }

    private function createSignature($path, $method, $timestamp) {
        $payload = $path . '|' . $method . '|' . $timestamp;
        return hash_hmac('sha256', $payload, $this->apiSecret);
    }

    public function convertLtrToRtl($css, $options = []) {
        $path = '/api/convert/ltr-to-rtl';
        $method = 'POST';
        $timestamp = round(microtime(true) * 1000);
        $signature = $this->createSignature($path, $method, $timestamp);

        $curl = curl_init();
        
        $postData = json_encode([
            'css' => $css,
            'options' => $options
        ]);

        curl_setopt_array($curl, [
            CURLOPT_URL => $this->apiUrl . $path,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_POSTFIELDS => $postData,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'X-API-Key: ' . $this->apiKey,
                'X-Timestamp: ' . $timestamp,
                'X-Signature: ' . $signature
            ]
        ]);

        $response = curl_exec($curl);
        $statusCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $error = curl_error($curl);
        
        curl_close($curl);

        if ($error) {
            throw new Exception('cURL Error: ' . $error);
        }

        $result = json_decode($response, true);

        if ($statusCode !== 200) {
            throw new Exception('API Error: ' . ($result['error']['message'] ?? 'Unknown error'));
        }

        return $result;
    }

    public function convertRtlToLtr($css, $options = []) {
        $path = '/api/convert/rtl-to-ltr';
        $method = 'POST';
        $timestamp = round(microtime(true) * 1000);
        $signature = $this->createSignature($path, $method, $timestamp);

        // Similar implementation as convertLtrToRtl...
    }
}

// Usage
$client = new RtlcssApiClient('your-api-key', 'your-api-secret');

try {
    $css = '
        .example {
            margin-left: 10px;
            padding-right: 20px;
            text-align: left;
        }
    ';
    
    $result = $client->convertLtrToRtl($css, ['clean' => true]);
    echo $result['data']['converted'];
} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage();
}
```

## Best Practices

1. **Cache Results**: When converting static CSS files, consider caching the results to reduce API calls.

2. **Error Handling**: Implement robust error handling to gracefully handle API errors.

3. **Timeouts**: Set appropriate timeouts for API requests (we recommend at least 30 seconds for large files).

4. **Timestamp Skew**: Be aware that the server will reject requests with timestamps that are more than 5 minutes old or in the future. Ensure your server's clock is synchronized.

5. **Keep Secrets Secure**: Store your API secret securely and never expose it in client-side code.

6. **Rate Limiting**: Implement retry logic with exponential backoff for rate limit errors.

## Support

If you encounter any issues or have questions, please contact our support team at support@rtlcss-api.example.com.