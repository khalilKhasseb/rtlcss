# RTLCSS API Service

A robust API service for converting CSS between LTR (Left-to-Right) and RTL (Right-to-Left) formats using the [RTLCSS](https://github.com/MohammadYounes/rtlcss) library.

## Features

- **Secure API Authentication**: API key + HMAC signature authentication
- **Bidirectional Conversion**: Support for both LTR→RTL and RTL→LTR conversion
- **File Upload Support**: Process CSS via file uploads or direct text input
- **Configurable Conversion Options**: Full support for RTLCSS configuration options
- **Usage Statistics**: Track and monitor API usage
- **Comprehensive Error Handling**: Detailed error responses
- **Docker Support**: Easy deployment with containerization

## Quick Start

### Prerequisites

- Node.js 14+ 
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/rtlcss-api.git
   cd rtlcss-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (see `.env.example` for reference):
   ```
   PORT=3000
   NODE_ENV=development
   AUTH_SECRET_KEY=your_secret_key_here
   ```

4. Start the server:
   ```bash
   npm start
   ```

### Using Docker

1. Build the Docker image:
   ```bash
   docker build -t rtlcss-api .
   ```

2. Run the container:
   ```bash
   docker run -p 3000:3000 -e AUTH_SECRET_KEY=your_secret_key_here rtlcss-api
   ```

## API Documentation

### Authentication

All API endpoints (except the public status endpoint) require authentication:

1. Include your API key in the `X-API-Key` header
2. Add the current timestamp in milliseconds in the `X-Timestamp` header
3. Create a signature using HMAC-SHA256 and include it in the `X-Signature` header

The signature payload should be: `${path}|${method}|${timestamp}`

Example:
```
X-API-Key: your-api-key
X-Timestamp: 1630000000000
X-Signature: computed-hmac-signature
```

### Endpoints

#### GET /api/status
Get service status information (public, no authentication required)

#### POST /api/auth/verify
Verify API credentials

#### POST /api/auth/create-key
Create a new API key/secret pair (in a production environment, this would require admin authentication)

#### POST /api/convert/ltr-to-rtl
Convert LTR CSS to RTL

**Request:**
- Upload a CSS file with field name `cssFile`, or
- Include CSS content in the request body as `css`
- Optionally include RTLCSS options as JSON in `options`

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

#### POST /api/convert/rtl-to-ltr
Convert RTL CSS to LTR (parameters same as ltr-to-rtl)

#### GET /api/status/usage
Get usage statistics for the authenticated API key

#### POST /api/test
Test the API with a simple CSS conversion

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

Common error codes:
- `UNAUTHORIZED`: Authentication failure
- `INVALID_API_KEY`: The API key is not valid
- `INVALID_SIGNATURE`: The signature verification failed
- `TIMESTAMP_EXPIRED`: The request timestamp is too old
- `VALIDATION_ERROR`: Invalid request parameters
- `INVALID_CSS`: The CSS content is not valid
- `FILE_TOO_LARGE`: The uploaded file exceeds the size limit
- `CONVERSION_ERROR`: Error during CSS conversion

## Development

### Running in Development Mode

```bash
npm run dev
```

### Testing

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration
```

### Linting

```bash
npm run lint
```

## Integration with WordPress

This API is designed to be integrated with the WP Asset Manager & RTL Converter WordPress plugin. Configure the plugin to use this API service for enhanced CSS RTL conversion capabilities.

## License

MIT# rtlcss
