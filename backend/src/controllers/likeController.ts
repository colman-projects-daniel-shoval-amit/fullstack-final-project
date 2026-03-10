import { Response } from "express";
import baseController from "./baseController";
import PostModel from "../models/postModel";
import LikeModel from "../models/likeModel";
import { AuthRequest } from "../middlewares/authMiddleware";

class LikeController extends baseController {
    constructor() {
        super(LikeModel);
    }

    async delete(req: AuthRequest, res: Response) {
        const id = req.params.id;
        const userId = req.user?._id;
        try {
            const like = await LikeModel.findById(id);
            if (!like) {
                return res.status(404).json({ error: "Like not found" });
            }
            if (String(like.userId) !== userId) {
                return res.status(403).json({ error: "Unauthorized" });
            }
            return super.delete(req, res);
        } catch (error) {
            this.handleError(res, error);
        }
    }

    async create(req: AuthRequest, res: Response) {
        const postId = req.body.postId;
        req.body.userId = req.user?._id;
        req.body.author = undefined; // don't write author
        try {
            const post = await PostModel.findById(postId);
            if (!post) {
                res.status(404).json({ error: "Post not found" });
                return;
            }

            // Check if user already liked the post
            const existingLike = await LikeModel.findOne({ postId, userId: req.user?._id });
            if (existingLike) {
                res.status(400).json({ error: "Post already liked by this user" });
                return;
            }

            super.create(req, res);
        } catch (error) {
            this.handleError(res, error);
        }
    }

    async put(req: AuthRequest, res: Response) {
        res.status(405).json({ error: "Method not allowed. Cannot update a like." });
    }
}

export default new LikeController();
