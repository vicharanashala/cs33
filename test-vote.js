const http = require('http');

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const opts = { hostname: 'localhost', port: 5000, path, method, headers };
    const r = http.request(opts, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(d) }); } catch (e) { resolve({ status: res.statusCode, raw: d.slice(0, 200) }); } });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function main() {
  // Login as admin (different from lohi who owns the FAQ)
  const login = await req('POST', '/api/auth/login', { email: 'admin@test.com', password: 'password123' });
  console.log('Login admin@test.com:', login.status, login.body.success ? 'OK' : login.body.message);
  if (!login.body.token) return;
  const token = login.body.token;

  const faqs = await req('GET', '/api/faqs?limit=3', null, token);
  console.log('GetAll:', faqs.status, faqs.body.success ? 'OK, count=' + faqs.body.data.length : 'FAIL');
  if (!faqs.body.data.length) return;

  const faq = faqs.body.data[0];
  const authorId = typeof faq.author === 'object' ? faq.author._id : faq.author;
  console.log('FAQ:', faq._id, '| votes:', faq.votes, '| author:', authorId);

  const v1 = await req('PUT', '/api/faqs/' + faq._id + '/vote', { vote: 1 }, token);
  console.log('Upvote result:', v1.status, JSON.stringify(v1.body));
}
main().catch(console.error);