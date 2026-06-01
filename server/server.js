const app = require('./app');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/userModel');

require('dotenv').config();
connectDB();

const ensureAdminUser = async () => {
  try {
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) return;

    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@123';
    const name = process.env.ADMIN_NAME || 'Admin';

    const adminUser = await User.create({
      name,
      email,
      password,
      role: 'admin',
      isActive: true,
    });

    console.log('Default admin created:', adminUser.email);
  } catch (error) {
    console.error('Failed to create default admin user:', error.message);
  }
};

ensureAdminUser();

const port = process.env.PORT || 8001;
const server = app.listen(port, () => {
  console.log(` Server is running on port ${port}`);
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  server.close(() => {
    console.log('🛑 Server stopped');
    process.exit(1);
  });
});
