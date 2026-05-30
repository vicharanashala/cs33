require('dotenv').config();
const mongoose = require('mongoose');

const email = `debug${Date.now()}@test.com`;
const password = 'TestPass123!';

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  require('./models/User'); // register schema
  
  // Test 1: Direct find
  const existing = await mongoose.model('User').findOne({ email: email.toLowerCase() });
  console.log('1. findOne result:', existing ? existing.email : 'NONE');
  
  // Test 2: Create user
  try {
    const crypto = require('crypto');
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');
    const userData = {
      name: 'Test',
      email: email.toLowerCase(),
      password: password,
      emailVerifyToken
    };
    console.log('2. Creating user with email:', userData.email);
    const user = await mongoose.model('User').create(userData);
    console.log('3. Created user:', user._id, user.email, 'passwordHash set:', !!user.passwordHash);
  } catch (err) {
    console.log('3. Create ERR:', err.code, err.message);
  }
  
  process.exit(0);
}

main();