import { Router } from 'express';
import aiController from '../controllers/aiController';

const aiRouter = Router();

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI-powered writing assistance and content analysis
 */

/**
 * @swagger
 * /ai/assist:
 *   post:
 *     summary: AI writing assistant — improve, continue, or outline a post
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - instruction
 *             properties:
 *               title:
 *                 type: string
 *                 description: The post title
 *               content:
 *                 type: string
 *                 description: The current post content in markdown
 *               instruction:
 *                 type: string
 *                 enum: [improve, continue, outline]
 *                 description: The type of AI assistance requested
 *     responses:
 *       200:
 *         description: The AI-generated result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: string
 *       400:
 *         description: Invalid instruction value
 *       500:
 *         description: AI request failed
 */
aiRouter.post('/assist', aiController.assist.bind(aiController));

/**
 * @swagger
 * /ai/summarize:
 *   post:
 *     summary: Generate a 2-3 sentence summary of a post
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: The generated summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: string
 *       500:
 *         description: AI request failed
 */
aiRouter.post('/summarize', aiController.summarize.bind(aiController));

/**
 * @swagger
 * /ai/suggest-topics:
 *   post:
 *     summary: Suggest relevant topic IDs for a post based on its content
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - topics
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               topics:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *     responses:
 *       200:
 *         description: Array of suggested topic IDs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 topicIds:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         description: AI request failed
 */
aiRouter.post('/suggest-topics', aiController.suggestTopics.bind(aiController));

export default aiRouter;
