const http = require('http');
const fs = require('fs');
const env = fs.readFileSync('./.env','utf8');
const jwtSecret = env.match(/JWT_SECRET=(.+)/)[1].trim();
const jwt = require('./node_modules/jsonwebtoken');

async function register(name, email) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ name, email, password: 'TestPass123' });
    const req = http.request({ hostname:'localhost', port:5000, path:'/api/auth/register', method:'POST', headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)} }, (res) => {
      let d=''; res.on('data',c=>d+=c);
      res.on('end',()=> resolve(JSON.parse(d)));
    });
    req.write(body); req.end();
  });
}

async function createFAQ(token, q) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ question:q, body:'FAQ body long enough for validation here as required', tags:['test'], category:'General' });
    const req = http.request({ hostname:'localhost', port:5000, path:'/api/faqs', method:'POST', headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body),'Authorization':'Bearer '+token} }, (res) => {
      let d=''; res.on('data',c=>d+=c);
      res.on('end',()=> resolve(JSON.parse(d)));
    });
    req.write(body); req.end();
  });
}

async function submitAnswer(token, faqId, body) {
  return new Promise((resolve) => {
    const b = JSON.stringify({ body });
    const req = http.request({ hostname:'localhost', port:5000, path:'/api/faqs/'+faqId+'/answers', method:'POST', headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(b),'Authorization':'Bearer '+token} }, (res) => {
      let d=''; res.on('data',c=>d+=c);
      res.on('end',()=> resolve({ status: res.statusCode, data: JSON.parse(d) }));
    });
    req.write(b); req.end();
  });
}

async function getFAQ(token, faqId) {
  return new Promise((resolve) => {
    const req = http.request({ hostname:'localhost', port:5000, path:'/api/faqs/'+faqId, method:'GET', headers:{'Authorization':'Bearer '+token} }, (res) => {
      let d=''; res.on('data',c=>d+=c);
      res.on('end',()=> resolve(JSON.parse(d)));
    });
    req.end();
  });
}

async function main() {
  // Register answerer
  const email = 'ans_' + Date.now() + '@test.com';
  const { token } = await register('Answerer', email);

  // Create FAQ as someone else (so answer can be posted)
  const email2 = 'faqauthor_' + Date.now() + '@test.com';
  const { token: token2 } = await register('FAQ Author', email2);
  const { data: { _id: faqId } } = await createFAQ(token2, 'Dup race test FAQ ' + Date.now());

  console.log('FAQ created:', faqId);

  // Fire TWO answer requests in parallel
  const [r1, r2] = await Promise.all([
    submitAnswer(token, faqId, 'Answer from parallel request 1 with some unique content'),
    submitAnswer(token, faqId, 'Answer from parallel request 2 with different content'),
  ]);

  console.log('Req1:', r1.status, r1.data._id || r1.data.message || JSON.stringify(r1.data));
  console.log('Req2:', r2.status, r2.data._id || r2.data.message || JSON.stringify(r2.data));

  // Check how many answers actually exist
  const faq = await getFAQ(token2, faqId);
  const answers = faq.data.answers || [];
  console.log('Total answers in DB:', answers.length);
  answers.forEach((a, i) => console.log(`  Answer ${i+1}:`, a._id, '|', a.body.slice(0,40)));
}

main().catch(console.error);