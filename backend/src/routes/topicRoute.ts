import { Router } from 'express';
import topicController from '../controllers/topicController';

const topicRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Topics
 *   description: The Topics managing API
 */

/**
 * @swagger
 * /topics:
 *   get:
 *     summary: Returns the list of all topics
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of topics
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 */
topicRouter.get('/', topicController.get.bind(topicController));

/**
 * @swagger
 * /topics/{id}:
 *   get:
 *     summary: Get a topic by id
 *     tags: [Topics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The topic id
 *     responses:
 *       200:
 *         description: The topic object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *       404:
 *         description: Topic not found
 */
topicRouter.get('/:id', topicController.getById.bind(topicController));

export default topicRouter;
