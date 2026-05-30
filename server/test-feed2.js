const http = require('http');
const fs = require('fs');
const env = fs.readFileSync('./.env','utf8');
const match = env.match(/JWT_SECRET=(.+)/);
const jwtSecret = match ? match[1].trim() : null;
const jwt = require('./node_modules/jsonwebtoken');

async function api(path, method, body, token) {
  return new Promise((resolve) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (body) headers['Content-Length'] = Buffer.byteLength(body);
    const req = http.request({ hostname:'localhost', port:5000, path, method, headers }, (res) => {
      let d=''; res.on('data',c=>d+=c);
      res.on('end',()=> resolve({ status: res.statusCode, data: JSON.parse(d) }));
    });
    if (body) req.write(body);
    req.end();
  });
}

async function main() {
  // Register author (someone who posts)
  const r1 = await api('/api/auth/register', 'POST', JSON.stringify({ name:'AuthorA', email:'autest_'+Date.now()+'@t.com', password:'TestPass123' }));
  const tok1 = r1.data.token;
  const authorId = r1.data.data?._id;

  // Register follower (you)
  const r2 = await api('/api/auth/register', 'POST', JSON.stringify({ name:'FollowerB', email:'fltest_'+Date.now()+'@t.com', password:'TestPass123' }));
  const tok2 = r2.data.token;
  console.log('User IDs:', authorId, r2.data.data?._id);

  // Follow the author
  const follow = await api('/api/users/'+authorId+'/follow', 'POST', null, tok2);
  console.log('Follow result:', follow.status, JSON.stringify(follow.data));

  // Author creates FAQ and it's approved
  const faq = await api('/api/faqs', 'POST', JSON.stringify({ question:'What is React? '+Date.now(), body:'React is a JavaScript library for building UIs with components and state management', tags:['react','javascript'], category:'General' }), tok1);
  console.log('FAQ created:', faq.status, faq.data.data?._id);
  const faqId = faq.data.data?._id;

  // Approve it
  const approve = await api('/api/faqs/'+faqId+'/status', 'PUT', JSON.stringify({ status:'approved' }), tok1);
  console.log('Approved:', approve.status, JSON.stringify(approve.data));

  // Now check feed
  const feed = await api('/api/users/feed/activity', 'GET', null, tok2);
  console.log('Feed status:', feed.status, '| items:', feed.data.data?.length, '| data:', JSON.stringify(feed.data.data));
}

main().catch(console.error);