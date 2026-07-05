// One-time bootstrap: creates the very first admin account.
// Usage: node scripts/create-admin.js "Full Name" email@example.com password
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function main() {
  const [, , name, email, password] = process.argv;

  if (!name || !email || !password) {
    console.log('Usage: node scripts/create-admin.js "Full Name" email@example.com password');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URL);

  const exists = await User.findOne({ email });
  if (exists) {
    console.log(`❌ A user with email ${email} already exists (role: ${exists.role})`);
    process.exit(1);
  }

  const hashed = await bcrypt.hash(password, 10);
  await User.create({ name, email, password: hashed, role: 'admin' });

  console.log(`✅ Admin account created: ${email}`);
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
