process.chdir('C:\\Users\\cheru\\Desktop\\faq-portal\\server');
const http = require('http');

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
  // Register target
  const r1 = await api('/api/auth/register', 'POST', JSON.stringify({ name:'Target', email:'t2_'+Date.now()+'@t.com', password:'TestPass123' }));
  const targetId = JSON.parse(r1.body).user?.id;

  // Register follower
  const r2 = await api('/api/auth/register', 'POST', JSON.stringify({ name:'Follower', email:'f2_'+Date.now()+'@t.com', password:'TestPass123' }));
  const tok2 = JSON.parse(r2.body).token;

  // Follow
  const f1 = await api('/api/users/'+targetId+'/follow', 'POST', null, tok2);
  console.log('FOLLOW:', f1.status, f1.body.slice(0,100));

  // Unfollow
  const u1 = await api('/api/users/'+targetId+'/follow', 'DELETE', null, tok2);
  console.log('UNFOLLOW:', u1.status, u1.body.slice(0,100));

  // Unfollow again (should 400)
  const u2 = await api('/api/users/'+targetId+'/follow', 'DELETE', null, tok2);
  console.log('UNFOLLOW AGAIN:', u2.status, u2.body.slice(0,100));
}
main().catch(console.error);