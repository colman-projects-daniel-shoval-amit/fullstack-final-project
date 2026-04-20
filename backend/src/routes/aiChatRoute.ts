import express from "express";
import aiController from "../controllers/aiChatController"

const aiChatRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI Chat API
 */

/**
 * @swagger
 * /ai/ask:
 *   post:
 *     summary: Ask AI a question based on articles
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *             properties:
 *               question:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 answer:
 *                   type: string
 *       400:
 *         description: Invalid input
 */
aiChatRouter.post("/ask", aiController.ask);

export default aiChatRouter;