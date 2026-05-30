const http = require('http');

function makeReq(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const req = http.request({ hostname: 'localhost', port: 5000, path, method, headers }, (res) => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch (e) { resolve({ status: res.statusCode, raw: d.slice(0, 200) }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  const login = await makeReq('POST', '/api/auth/login', { email: 'lohi@gmail.com', password: 'password123' });
  console.log('1. Login:', login.status, login.body.success ? 'OK, token=' + login.body.token.slice(0, 12) + '...' : login.body.message);
  if (!login.body.success) return;
  const token = login.body.token;

  const faqs = await makeReq('GET', '/api/faqs?limit=1', null, token);
  console.log('2. GetAll:', faqs.status, faqs.body.success, Array.isArray(faqs.body.data) ? 'len=' + faqs.body.data.length : typeof faqs.body.data);
  if (!faqs.body.data?.length) return;
  const id = faqs.body.data[0]._id;
  console.log('   ID:', id);

  const answer = 'This is a very thorough test answer that is definitely over the minimum thirty character count required by validation rules.';
  const post = await makeReq('POST', '/api/faqs/' + id + '/answers', { body: answer }, token);
  console.log('3. PostAnswer:', post.status, JSON.stringify(post.body));
}
main().catch(console.error);