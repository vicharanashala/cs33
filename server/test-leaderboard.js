process.chdir('C:\\Users\\cheru\\Desktop\\faq-portal\\server');
const http = require('http');
const fs = require('fs');
const env = fs.readFileSync('./.env','utf8');
const match = env.match(/JWT_SECRET=([^\r\n]+)/);
const jwtSecret = match ? match[1].trim() : null;
const jwt = require('./node_modules/jsonwebtoken');

async function api(path, method, body, token) {
  return new Promise((resolve) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (body) headers['Content-Length'] = Buffer.byteLength(body);
    const req = http.request({ hostname:'localhost', port:5000, path, method, headers }, (res) => {
      let d=''; res.on('data',c=>d+=c);
      res.on('end',()=> resolve({ status: res.statusCode, body: d }));
    });
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  const r = await api('/api/auth/register', 'POST', JSON.stringify({ name:'LB Test', email:'lbt_'+Date.now()+'@t.com', password:'TestPass123' }));
  const { token } = JSON.parse(r.body);
  const result = await api('/api/users/leaderboard', 'GET', null, token);
  console.log('Status:', result.status);
  console.log('Body:', result.body.slice(0, 500));
}
main().catch(console.error);