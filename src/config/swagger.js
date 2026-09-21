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
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: ['object','array','null'] }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            fullName: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            role: { type: 'string', enum: ['customer','admin'] },
            status: { type: 'string', enum: ['active','locked'] },
            avatar: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        UserInput: {
          type: 'object',
          properties: {
            fullName: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            password: { type: 'string' }
          }
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number', format: 'double' },
            type: { type: 'string' },
            fileUrl: { type: 'string' },
            thumbnail: { type: 'string' },
            reviewStatus: { type: 'string', enum: ['pending','approved','rejected'] },
            visibility: { type: 'string', enum: ['active','inactive'] },
            category: { $ref: '#/components/schemas/Category' },
            seller: { $ref: '#/components/schemas/User' }
          }
        },
        ProductInput: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            categoryId: { type: 'string' },
            type: { type: 'string' }
          }
        },
        Report: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            reporterId: { type: 'string' },
            reportedUserId: { type: 'string' },
            reason: { type: 'string' },
            status: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        ReportedUser: {
          type: 'object',
          properties: {
            reportedUserId: { type: 'string' },
            reportsCount: { type: 'integer' },
            lastReportAt: { type: 'string', format: 'date-time' },
            user: { $ref: '#/components/schemas/User' }
          }
        },
        RevenuePeriod: {
          type: 'object',
          properties: {
            period: { type: 'string' },
            total: { type: 'number', format: 'double' }
          }
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            type: { type: 'string' },
            channel: { type: 'string', enum: ['email','push','in-app'] },
            payload: { type: 'object' },
            read: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        PaginatedUsers: {
          type: 'object',
          properties: {
            items: { type: 'array', items: { $ref: '#/components/schemas/User' } },
            total: { type: 'integer' }
          }
        },
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
