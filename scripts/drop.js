require('dotenv').config();
const { sequelize } = require('../src/models');

(async () => {
    try {
        await sequelize.drop();
        console.log('All tables dropped');

        await sequelize.sync();
        console.log('Database recreated');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();