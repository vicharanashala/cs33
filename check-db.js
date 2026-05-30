require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const users = await mongoose.connection.db.collection('users').find({}, { projection: { email: 1, name: 1, _id: 1 } }).limit(10).toArray();
  console.log('Users in DB:', JSON.stringify(users, null, 2));
  const count = await mongoose.connection.db.collection('users').countDocuments();
  console.log('Total users:', count);
  process.exit(0);
}).catch(e => { console.log('ERR:', e.message); process.exit(1); });