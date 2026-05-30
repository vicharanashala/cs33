// Run directly with: node test-user.js
require('./models/User');
const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb://localhost:27017/faq_portal');
  
  const email = "debug_" + Date.now() + "@xyzabc123.com";
  console.log('Testing email:', email);
  console.log('Lowercased:', email.toLowerCase());
  
  const User = mongoose.model('User');
  const existing = await User.findOne({ email: email.toLowerCase() });
  console.log('Found:', existing ? existing.email : 'NONE');
  
  // Also check what the raw DB returns
  const raw = await mongoose.connection.db.collection('users').findOne({ email: email.toLowerCase() });
  console.log('Raw DB:', raw ? raw.email : 'NONE');
  
  await mongoose.disconnect();
}
main().catch(e => console.error(e.message));