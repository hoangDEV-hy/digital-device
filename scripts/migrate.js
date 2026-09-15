require('dotenv').config();
const { sequelize } = require('../src/models');

(async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('Migrations applied (sync alter)');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
