const http = require('http');
const email = "fresh_" + Date.now() + "@newdomain.com";
const body = JSON.stringify({ name: "Test User", email, password: "TestPass123" });

console.log('Request body:', body);

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Accept': 'application/json'
  }
}, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers));
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    console.log('Body:', data);
    if (res.statusCode === 422) {
      try {
        const parsed = JSON.parse(data);
        console.log('Validation errors:', JSON.stringify(parsed.errors || parsed.data, null, 2));
      } catch(e) {}
    }
  });
});

req.on('error', e => console.error('Request error:', e.message));
req.write(body);
req.end();