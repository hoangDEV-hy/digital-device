require('dotenv').config();
const { sequelize, User, Category, Product } = require('../src/models');

(async () => {
  try {
    await sequelize.sync();
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin1234';
    const admin = await User.findOne({ where: { email: adminEmail } });
    if (!admin) {
      await User.create({ fullName: 'Administrator', email: adminEmail, password: adminPassword, role: 'admin' });
      console.log(`Seeded admin: ${adminEmail}`);
    }
    // seed categories
    const cats = ['Ebook','Video Course','Document','Template'];
    for (const name of cats) {
      await Category.findOrCreate({ where: { name }, defaults: { description: name } });
    }
    // optional sample product
    const [cat] = await Category.findAll({ limit: 1 });
    const p = await Product.findOne({ where: { title: 'Sample Ebook' } });
    if (!p) {
      await Product.create({ title: 'Sample Ebook', description: 'Sample', price: 9.99, categoryId: cat.id, type: 'ebook', fileUrl: '/uploads/sample.pdf', visibility: 'active', reviewStatus: 'approved' });
      console.log('Seeded sample product');
    }
    console.log('Seeding done');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
