require('dotenv').config();
const { sequelize } = require('../src/models');

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

async function updateInactiveSellerDepositMinimum() {
  await sequelize.query('UPDATE Wallets SET minimumDeposit = 50000000 WHERE contractStatus != ? AND minimumDeposit = ?', {
    replacements: ['registered', 100000],
  });
}

(async () => {
  try {
    await ensureOrderColumns();
    await sequelize.sync({ alter: true });
    await updateInactiveSellerDepositMinimum();
    console.log('Migrations applied (sync alter)');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
