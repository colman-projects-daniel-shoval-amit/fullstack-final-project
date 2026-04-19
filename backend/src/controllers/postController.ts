import PostModel from "../models/postModel";
import baseController from "./baseController";
import { AuthRequest } from "../middlewares/authMiddleware";
import { Request, Response } from "express";

class PostController extends baseController {
    constructor() {
        super(PostModel);
    }

    async get(req: Request, res: Response) {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const filter: Record<string, unknown> = {};
        const rawTopics = req.query.topics;
        if (rawTopics) {
            const ids = Array.isArray(rawTopics) ? rawTopics : [rawTopics];
            filter.topics = { $in: ids };
        }
        const rawAuthorId = req.query.authorId;
        if (rawAuthorId) {
            const ids = Array.isArray(rawAuthorId) ? rawAuthorId : [rawAuthorId];
            filter.authorId = ids.length === 1 ? ids[0] : { $in: ids };
        }
        try {
            const data = await PostModel.find(filter)
                .populate('authorId', 'email')
                .skip((page - 1) * limit)
                .limit(limit);
            res.json(data);
        } catch (error) {
            this.handleError(res, error);
        }
    }

    async getById(req: Request, res: Response) {
        const id = req.params.id;
        try {
            const data = await PostModel.findById(id).populate('authorId', 'email');
            if (!data) {
                return res.status(404).json({ error: "Post not found" });
            }
            res.json(data);
        } catch (error) {
            this.handleError(res, error);
        }
    }

    async create(req: AuthRequest, res: Response) {
        const userId = req.user?._id;
        if (!userId) {
            return;
        }
        req.body.authorId = userId;
        super.create(req, res);
    }

    async put(req: AuthRequest, res: Response) {
        const id = req.params.id;
        const userId = req.user?._id;
        try {
            const post = await PostModel.findById(id);
            if (!post) {
                res.status(404).json({ error: "Post not found" });
                return;
            }
            if (String(post.authorId) !== userId) {
                res.status(403).json({ error: "Unauthorized" });
                return;
            }
            super.put(req, res);
        } catch (error) {
            this.handleError(res, error);
        }
    }
}

export default new PostController();