const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb://localhost:27017/faq_portal');
  console.log('Connected to MongoDB');

  const users = await mongoose.connection.db.collection('users').find({}).limit(20).toArray();
  console.log('Total users:', users.length);
  users.forEach(u => {
    console.log('  email:', u.email, '| role:', u.role, '| hasPasswordHash:', !!u.passwordHash, '| hasPassword:', !!u.password);
  });

  await mongoose.disconnect();
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });