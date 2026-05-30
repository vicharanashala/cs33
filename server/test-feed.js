const http = require('http');
const fs = require('fs');
const env = fs.readFileSync('./.env','utf8');
const match = env.match(/JWT_SECRET=(.+)/);
const jwtSecret = match ? match[1].trim() : null;
const jwt = require('./node_modules/jsonwebtoken');

async function register(name, email) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ name, email, password: 'TestPass123' });
    const req = http.request({ hostname:'localhost',port:5000,path:'/api/auth/register',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)} }, (res) => {
      let d=''; res.on('data',c=>d+=c);
      res.on('end',()=> resolve(JSON.parse(d)));
    });
    req.write(body); req.end();
  });
}

async function getFeed(token) {
  return new Promise((resolve) => {
    const req = http.request({ hostname:'localhost',port:5000,path:'/api/users/feed/activity',method:'GET',headers:{'Authorization':'Bearer '+token} }, (res) => {
      let d=''; res.on('data',c=>d+=c);
      res.on('end',()=> resolve({ status: res.statusCode, body: d }));
    });
    req.end();
  });
}

async function main() {
  // Register a new user
  const email = 'feedtest_' + Date.now() + '@test.com';
  const { token } = await register('Feed Test', email);
  console.log('Registered, token:', token ? 'yes' : 'no');

  // Try feed
  const result = await getFeed(token);
  console.log('Feed status:', result.status);
  console.log('Feed body:', result.body);
}

main().catch(console.error);