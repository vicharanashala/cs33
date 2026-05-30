const http = require('http');
const fs = require('fs');

const env = fs.readFileSync('./.env', 'utf8');
const match = env.match(/JWT_SECRET=(.+)/);
const jwtSecret = match ? match[1].trim() : null;
if (!jwtSecret) { console.error('No JWT_SECRET'); process.exit(1); }

const jwt = require('./node_modules/jsonwebtoken');
const ObjectId = require('mongoose').Types.ObjectId;

// Register a test user first, then vote
const email = 'testvote_' + Date.now() + '@test.com';
const registerBody = JSON.stringify({ name: 'Vote Test', email, password: 'TestPass123' });

const req1 = http.request({
  hostname: 'localhost', port: 5000,
  path: '/api/auth/register', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(registerBody) }
}, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    console.log('Register status:', res.statusCode);
    let parsed;
    try { parsed = JSON.parse(data); } catch(e) { console.log('Register raw:', data); return; }
    console.log('Register success:', parsed.success, '| token:', parsed.token ? 'yes' : 'no');
    
    if (!parsed.token) {
      console.log('Full response:', data);
      return;
    }

    const token = parsed.token;

    // Create an FAQ
    const faqBody = JSON.stringify({ 
      question: 'Test FAQ for voting mechanism check ' + Date.now(), 
      body: 'This is a test FAQ body that is definitely longer than 30 characters for validation',
      tags: ['test'], 
      category: 'General' 
    });

    const req2 = http.request({
      hostname: 'localhost', port: 5000,
      path: '/api/faqs', method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Content-Length': Buffer.byteLength(faqBody),
        'Authorization': `Bearer ${token}`
      }
    }, (res2) => {
      let data2 = '';
      res2.on('data', c => data2 += c);
      res2.on('end', () => {
        console.log('Create FAQ status:', res2.statusCode);
        let faqParsed;
        try { faqParsed = JSON.parse(data2); } catch(e) { console.log('FAQ raw:', data2); return; }
        if (!faqParsed.data?._id) { console.log('FAQ full:', data2); return; }
        
        const faqId = faqParsed.data._id;
        console.log('Created FAQ:', faqId);

        // Register a second user to vote on the first user's FAQ
        const email2 = 'voter_' + Date.now() + '@test.com';
        const reg2Body = JSON.stringify({ name: 'Voter', email: email2, password: 'TestPass123' });
        
        const req3 = http.request({
          hostname: 'localhost', port: 5000,
          path: '/api/auth/register', method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(reg2Body) }
        }, (res3) => {
          let data3 = '';
          res3.on('data', c => data3 += c);
          res3.on('end', () => {
            let reg2;
            try { reg2 = JSON.parse(data3); } catch(e) { return; }
            if (!reg2.token) { console.log('Voter registration failed:', data3); return; }
            const voterToken = reg2.token;

            // Vote as second user
            const voteBody = JSON.stringify({ vote: 1 });  // test both string and number
            const voteReq = http.request({
              hostname: 'localhost', port: 5000,
              path: `/api/faqs/${faqId}/vote`, method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(voteBody),
                'Authorization': `Bearer ${voterToken}`
              }
            }, (voteRes) => {
              let voteData = '';
              voteRes.on('data', c => voteData += c);
              voteRes.on('end', () => {
                console.log('Vote status:', voteRes.statusCode, '| body:', voteData);
              });
            });
            voteReq.write(voteBody);
            voteReq.end();
          });
        });
        req3.write(reg2Body);
        req3.end();
      });
    });
    req2.write(faqBody);
    req2.end();
  });
});

req1.on('error', e => console.error('Req error:', e.message));
req1.write(registerBody);
req1.end();