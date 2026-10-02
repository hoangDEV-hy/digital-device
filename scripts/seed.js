require('dotenv').config();
const { sequelize, User, Category, Product } = require('../src/models');

const customerSeedUsers = [
  {
    id: '0ad6fa0d-4539-4c7b-a5a4-5d099535e7e5',
    fullName: 'hoang',
    email: 'nhh19072005@gmail.com',
    phone: '0966331960',
    password: 'customer123',
    role: 'customer',
    status: 'active',
    avatar: '/uploads/1789976840060-tilp6d.jpg',
    deviceIp: null,
    createdAt: '2026-09-16 02:15:06',
    updatedAt: '2026-09-22 00:38:35',
  },
  {
    id: '93931cfd-38af-481e-9abb-b9fad7ae7eed',
    fullName: 'sang',
    email: 'sangNgu@gmail.com',
    phone: '123456789',
    password: 'customer123',
    role: 'customer',
    status: 'active',
    avatar: null,
    deviceIp: null,
    createdAt: '2026-09-22 00:40:22',
    updatedAt: '2026-09-22 00:40:22',
  },
];

const adminSeedUser = {
  id: 'c4a4de5c-078f-4fcc-8117-04ceee7403f6',
  fullName: 'Administrator',
  email: 'admin@example.com',
  phone: null,
  password: 'Admin1234',
  role: 'admin',
  status: 'active',
  avatar: null,
  deviceIp: null,
  createdAt: '2026-09-15 14:42:53',
  updatedAt: '2026-09-15 14:42:53',
};

const categorySeedEntries = [
  { id: '0f87502e-8bce-4bd9-bc48-2d77f6daa209', name: 'Template', description: 'Template', createdAt: '2026-09-16 03:53:20', updatedAt: '2026-09-16 03:53:20' },
  { id: 'a5d82381-8293-4c1e-836e-5d1ef9937156', name: 'Ebook', description: 'Ebook', createdAt: '2026-09-16 03:53:20', updatedAt: '2026-09-16 03:53:20' },
  { id: 'd6ec3d87-1658-4efd-8506-c85f170e28dc', name: 'Document', description: 'Document', createdAt: '2026-09-16 03:53:20', updatedAt: '2026-09-16 03:53:20' },
  { id: 'f73cdde8-188c-4020-8656-dace8eb2e5df', name: 'Video Course', description: 'Video Course', createdAt: '2026-09-16 03:53:20', updatedAt: '2026-09-16 03:53:20' },
];

(async () => {
  try {
    await sequelize.sync();

    for (const user of [adminSeedUser, ...customerSeedUsers]) {
      const existing = await User.findOne({ where: { id: user.id } });
      if (!existing) {
        await User.create({
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          password: user.password,
          role: user.role,
          status: user.status,
          avatar: user.avatar,
          deviceIp: user.deviceIp,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        });
        console.log(`Seeded ${user.role}: ${user.email}`);
      }
    }

    for (const category of categorySeedEntries) {
      const existing = await Category.findOne({ where: { id: category.id } });
      if (!existing) {
        await Category.create({
          id: category.id,
          name: category.name,
          description: category.description,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
        });
        console.log(`Seeded category: ${category.name}`);
      }
    }

    const sellers = await User.findAll({ where: { role: 'customer', status: 'active' }, order: [['createdAt', 'ASC']] });
    const productSeedEntries = [
      {
        id: '7b2d55c8-0a1a-4fef-8d5a-b73e2d8d1111',
        title: 'Public Template Demo',
        description: 'Public template product sold by a customer account and visible in the marketplace.',
        price: 49.99,
        stock: 100,
        categoryName: 'Template',
        type: 'template',
        fileUrl: '/uploads/template-demo.zip',
        thumbnail: '/uploads/template-demo.jpg',
        sellerIndex: 0,
      },
      {
        id: '8c75268d-34b8-4a04-a39d-0e5e507d8a22',
        title: 'Startup EBook Pack',
        description: 'Bundle of beginner digital business and startup eBooks by a customer seller.',
        price: 29.99,
        stock: 100,
        categoryName: 'Ebook',
        type: 'ebook',
        fileUrl: '/uploads/startup-ebook-pack.pdf',
        thumbnail: '/uploads/startup-ebook-pack.jpg',
        sellerIndex: 0,
      },
      {
        id: '4dbd622c-4ab1-4c53-8fe1-3b9e840f2d55',
        title: 'Sales Document Vault',
        description: 'Ready-to-use sales document templates and internal operational docs.',
        price: 39.5,
        stock: 100,
        categoryName: 'Document',
        type: 'document',
        fileUrl: '/uploads/sales-document-vault.pdf',
        thumbnail: '/uploads/sales-document-vault.jpg',
        sellerIndex: 1,
      },
      {
        id: '1b1d2439-bad5-4d4d-9aa9-fa993f3845f0',
        title: 'Product Marketing Course',
        description: 'Video course about product marketing for digital sellers.',
        price: 79.0,
        stock: 100,
        categoryName: 'Video Course',
        type: 'video',
        fileUrl: '/uploads/product-marketing-course.mp4',
        thumbnail: '/uploads/product-marketing-course.jpg',
        sellerIndex: 1,
      },
    ];

    for (const entry of productSeedEntries) {
      const seller = sellers[entry.sellerIndex];
      const category = await Category.findOne({ where: { name: entry.categoryName } });
      if (!seller || !category) continue;

      const [product, created] = await Product.findOrCreate({
        where: { id: entry.id },
        defaults: {
          id: entry.id,
          title: entry.title,
          description: entry.description,
          price: entry.price,
          stock: entry.stock,
          categoryId: category.id,
          type: entry.type,
          fileUrl: entry.fileUrl,
          thumbnail: entry.thumbnail,
          sellerId: seller.id,
          visibility: 'active',
          reviewStatus: 'approved',
          createdAt: '2026-09-23 10:00:00',
          updatedAt: '2026-09-23 10:00:00',
        },
      });

      if (created) {
        console.log(`Seeded public product: ${product.title} (seller: ${seller.email}, category: ${category.name})`);
      }
    }

    console.log('Seeding done');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
