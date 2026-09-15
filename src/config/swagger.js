const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'Digital Marketplace API', version: '0.1.0' },
    servers: [
      { url: 'http://localhost:3000', description: 'Local server' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
