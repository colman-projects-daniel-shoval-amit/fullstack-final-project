import { Router } from "express";
import likeController from "../controllers/likeController";

const likeRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Likes
 *   description: The Likes managing API
 */

/**
 * @swagger
 * /likes:
 *   get:
 *     summary: Returns the list of all the likes
 *     tags: [Likes]
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
 *         description: The list of the likes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Like'
 */
likeRouter.get("/", likeController.get.bind(likeController));

/**
 * @swagger
 * /likes/{id}:
 *   get:
 *     summary: Get the like by id
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The like id
 *     responses:
 *       200:
 *         description: The like description by id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Like'
 *       404:
 *         description: The like was not found
 */
likeRouter.get("/:id", likeController.getById.bind(likeController));

/**
 * @swagger
 * /likes:
 *   post:
 *     summary: Create a new like
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - postId
 *             properties:
 *               postId:
 *                 type: string
 *     responses:
 *       201:
 *         description: The like was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Like'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 */
likeRouter.post("/", likeController.create.bind(likeController));

/**
 * @swagger
 * /likes/{id}:
 *   delete:
 *     summary: Delete the like by id
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The like id
 *     responses:
 *       200:
 *         description: The like was successfully deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not the owner)
 *       404:
 *         description: The like was not found
 */
likeRouter.delete("/:id", likeController.delete.bind(likeController));

export default likeRouter;
