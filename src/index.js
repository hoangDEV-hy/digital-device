require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    const enableSync = process.env.DB_SYNC ? process.env.DB_SYNC === 'true' : (process.env.NODE_ENV !== 'production');
    if (enableSync) {
      await sequelize.sync();
      console.log('Database connected and synced');
    } else {
      console.log('Database connected (sync disabled by DB_SYNC=false)');
    }
    // Seed default admin if not exists
    const { User } = require('./models');
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin1234';
    const admin = await User.findOne({ where: { email: adminEmail } });
    if (!admin) {
      await User.create({ fullName: 'Administrator', email: adminEmail, password: adminPassword, role: 'admin' });
      console.log(`Seeded admin: ${adminEmail} / ${adminPassword}`);
    }
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
