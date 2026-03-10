import { Router } from "express";
import chatController from "../controllers/chatController";

const chatRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Chats
 *   description: The Chats managing API
 */

/**
 * @swagger
 * /chats:
 *   get:
 *     summary: Returns the list of all the chats
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         required: false
 *         description: The page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         required: false
 *         description: The number of items per page
 *     responses:
 *       200:
 *         description: The list of the chats
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Chat'
 */
chatRouter.get("/", chatController.get.bind(chatController));

/**
 * @swagger
 * /chats/user/{userId}:
 *   get:
 *     summary: Get all chats for a specific user
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The user id
 *     responses:
 *       200:
 *         description: The list of chats for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Chat'
 */
chatRouter.get("/user/:userId", chatController.getByUserId.bind(chatController));

/**
 * @swagger
 * /chats/{id}:
 *   get:
 *     summary: Get the chat by id
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The chat id
 *     responses:
 *       200:
 *         description: The chat description by id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chat'
 *       404:
 *         description: The chat was not found
 */
chatRouter.get("/:id", chatController.getById.bind(chatController));

/**
 * @swagger
 * /chats:
 *   post:
 *     summary: Create a new chat
 *     tags: [Chats]
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
 *             properties:
 *               title:
 *                 type: string
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: The chat was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chat'
 *       400:
 *         description: Bad request
 */
chatRouter.post("/", chatController.create.bind(chatController));

/**
 * @swagger
 * /chats/{id}:
 *   delete:
 *     summary: Delete the chat by id
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The chat id
 *     responses:
 *       200:
 *         description: The chat was successfully deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not a participant)
 *       404:
 *         description: The chat was not found
 */
chatRouter.delete("/:id", chatController.delete.bind(chatController));

export default chatRouter;
