const crypto = require('crypto');

const apiSecret = '76ba22d025b5187551f88c4801ae488955d81f00763b6a1b9a718a8f6f8f087b'; // Your API secret
const path = '/api/auth/verify';
const method = 'POST';
const timestamp = Date.now(); // Replace with the actual timestamp sent in the request

const payload = path + method + timestamp;

const signature = crypto
  .createHmac('sha256', apiSecret)
  .update(payload)
  .digest('hex');

console.log('X-Signature:', signature);
console.log('X-Timestamp:', timestamp);