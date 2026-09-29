require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 3000;

async function ensureOrderColumns() {
  const checks = [
    ['escrowReleased', 'BOOLEAN NOT NULL DEFAULT FALSE'],
    ['releasedAt', 'DATETIME NULL'],
  ];

  for (const [columnName, definition] of checks) {
    const [rows] = await sequelize.query('SHOW COLUMNS FROM `Orders` LIKE ?', { replacements: [columnName] });
    if (!rows || rows.length === 0) {
      await sequelize.query(`ALTER TABLE \`Orders\` ADD COLUMN ${columnName} ${definition}`);
    }
  }
}

async function start() {
  try {
    await sequelize.authenticate();
    const enableSync = process.env.DB_SYNC ? process.env.DB_SYNC === 'true' : (process.env.NODE_ENV !== 'production');
    if (enableSync) {
      await ensureOrderColumns();
      await sequelize.sync({ alter: true });
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
