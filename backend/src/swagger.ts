import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/config';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Fullstack Final Project API ',
            version: '1.0.0',
            description: 'API for managing Users, Posts, and Comments with authentication',
            contact: {
                name: 'Shoval & Daniel & Amit',
            },
        },
        servers: [
            {
                url: `http://localhost:${config.PORT || 3000}`,
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        _id: { type: 'string', example: '697a92d4725f95ca20e1300c' },
                        email: { type: 'string', example: 'shovalking@gmail.com' },
                        password: { type: 'string', example: '123456' },
                        refreshTokens: { type: 'array', items: { type: 'string' } },
                    },
                },
                Post: {
                    type: 'object',
                    required: ['title', 'content', 'authorId'],
                    properties: {
                        _id: { type: 'string', example: '697a65f59de97b4c60af618d' },
                        text: { type: 'string', example: 'safdsafd First Post' },
                        image: { type: 'string', example: 'shoval.jpg' },
                        authorId: { type: 'string', example: '697a65f59de97b4c60af618d' },
                    },
                },
                Comment: {
                    type: 'object',
                    required: ['postId', 'message', 'authorId'],
                    properties: {
                        _id: { type: 'string', example: '697a9cd91b8ac38b2cde5352' },
                        postId: { type: 'string', example: '697a65f59de97b4c60af618d60d0fe4f5311236168a109cb' },
                        content: { type: 'string', example: 'Shoval post! :)' },
                        authorId: { type: 'string', example: '697a92d4725f95ca20e1300c' },
                    },
                },
                Like: {
                    type: 'object',
                    required: ['postId', 'userId'],
                    properties: {
                        _id: { type: 'string', example: '697a9cd91b8ac38b2cde5352' },
                        postId: { type: 'string', example: '697a65f59de97b4c60af618d60d0fe4f5311236168a109cb' },
                        userId: { type: 'string', example: '697a92d4725f95ca20e1300c' },
                    },
                },
                Chat: {
                    type: 'object',
                    required: ['title', 'participants'],
                    properties: {
                        _id: { type: 'string', example: '697a9cd91b8ac38b2cde5352' },
                        title: { type: 'string', example: 'Group Chat' },
                        participants: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    _id: { type: 'string', example: '697a92d4725f95ca20e1300c' },
                                    email: { type: 'string', example: 'alice@example.com' },
                                    avatar: { type: 'string', example: '/uploads/avatar.jpg' },
                                },
                            },
                        },
                        latestMessage: { type: 'string', nullable: true, description: 'ObjectId ref to the most recent Message', example: '697a9cd91b8ac38b2cde5399' },
                        unreadCount: { type: 'integer', description: 'Number of messages not yet read by the requesting user', example: 3 },
                        updatedAt: { type: 'string', format: 'date-time' },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                Message: {
                    type: 'object',
                    required: ['senderId', 'chatId', 'content'],
                    properties: {
                        _id: { type: 'string', example: '697a9cd91b8ac38b2cde5352' },
                        senderId: { type: 'string', example: '697a92d4725f95ca20e1300c' },
                        chatId: { type: 'string', example: '697a65f59de97b4c60af618d60d0fe4f5311236168a109cb' },
                        content: { type: 'string', example: 'Hello everyone!' },
                        timestamp: { type: 'string', format: 'date-time' },
                        readBy: {
                            type: 'array',
                            description: 'IDs of users who have read this message. The sender is added automatically on creation.',
                            items: { type: 'string', example: '697a92d4725f95ca20e1300c' },
                        },
                    },
                },
            },
        },
    },
    apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerUi, swaggerSpec };