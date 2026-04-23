import express from "express";
import userController from "../controllers/userController";
import { uploadSingle } from "../middlewares/uploadMiddleware";

const userRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: The Users managing API
 */

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get the currently authenticated user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The authenticated user's profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
userRouter.get("/me", (userController as any).getMe.bind(userController));

/**
 * @swagger
 * /users/me:
 *   patch:
 *     summary: Update the current user's interests
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               interests:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of topic IDs
 *     responses:
 *       200:
 *         description: Updated user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
userRouter.patch("/me", (userController as any).updateMe.bind(userController));

/**
 * @swagger
 * /users/me/password:
 *   patch:
 *     summary: Change the current user's password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Current password incorrect, or account uses Google sign-in
 *       401:
 *         description: Unauthorized
 */
userRouter.patch("/me/password", (userController as any).changePassword.bind(userController));

/**
 * @swagger
 * /users/me/avatar:
 *   post:
 *     summary: Upload a profile picture for the current user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Updated user profile with new avatar URL
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: No file uploaded or invalid file type
 *       401:
 *         description: Unauthorized
 */
userRouter.post("/me/avatar", uploadSingle("image"), (userController as any).uploadAvatar.bind(userController));

/**
 * @swagger
 * /users/recommended:
 *   get:
 *     summary: Get recommended users based on shared topic interests
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of recommended users (up to 5)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
userRouter.get("/recommended", (userController as any).getRecommended.bind(userController));

/**
 * @swagger
 * /users/{id}/follow:
 *   post:
 *     summary: Follow a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the user to follow
 *     responses:
 *       200:
 *         description: Successfully followed
 *       400:
 *         description: Cannot follow yourself
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
userRouter.post("/:id/follow", (userController as any).follow.bind(userController));

/**
 * @swagger
 * /users/{id}/follow:
 *   delete:
 *     summary: Unfollow a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the user to unfollow
 *     responses:
 *       200:
 *         description: Successfully unfollowed
 *       401:
 *         description: Unauthorized
 */
userRouter.delete("/:id/follow", (userController as any).unfollow.bind(userController));

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Returns the list of all the users
 *     tags: [Users]
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
 *         description: The list of the users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
userRouter.get("/", userController.get.bind(userController));

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user id
 *     responses:
 *       200:
 *         description: The user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: The user was not found
 */
userRouter.get("/:id", userController.getById.bind(userController));

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Remove a user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user id
 *     responses:
 *       200:
 *         description: The user was deleted
 *       404:
 *         description: The user was not found
 */
userRouter.delete("/:id", userController.delete.bind(userController));

export default userRouter;
