const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const logger = require('./config/logger');
const errorHandler = require('./middlewares/errorHandler');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const paymentRoutes = require('./routes/payments');
const uploadRoutes = require('./routes/uploads');
const adminRoutes = require('./routes/admin');
const cartRoutes = require('./routes/cart');
const contentRoutes = require('./routes/content');
const productsRoutes = require('./routes/products');
const categoriesRoutes = require('./routes/categories');
const reportRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');
const reviewRoutes = require('./routes/reviews');
const orderRoutes = require('./routes/orders');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/orders', orderRoutes);

app.use(errorHandler);

module.exports = app;
