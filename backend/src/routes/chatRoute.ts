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
 * /chats/unread:
 *   get:
 *     summary: Get IDs of chats that have unread messages for the authenticated user
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of chat IDs with at least one unread message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 unreadChatIds:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ['697a9cd91b8ac38b2cde5352']
 *       401:
 *         description: Unauthorized
 */
chatRouter.get("/unread", chatController.getUnreadChatIds.bind(chatController));

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
/**
 * @swagger
 * /chats/{chatId}/read:
 *   put:
 *     summary: Mark all unread messages in a chat as read for the authenticated user
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         schema:
 *           type: string
 *         required: true
 *         description: The chat ID
 *     responses:
 *       200:
 *         description: Messages marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not a participant)
 *       404:
 *         description: Chat not found
 */
chatRouter.put("/:chatId/read", chatController.markRead.bind(chatController));
chatRouter.delete("/:id", chatController.delete.bind(chatController));

export default chatRouter;
