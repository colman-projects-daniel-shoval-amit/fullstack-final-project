import PostModel from "../models/postModel";
import baseController from "./baseController";
import { AuthRequest } from "../middlewares/authMiddleware";
import { Request, Response } from "express";
import PostChunkModel from "../models/postChunkModel";
import { getEmbedding } from "../services/embeddingService";

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

    async create(req: Request, res: Response): Promise<void>  {
        const authReq = req as AuthRequest;
        const userId = authReq.user?._id;
        if (!userId) {
            res.status(401).send();
            return;
        }
        try {
          const post = await PostModel.create({
            ...req.body,
            authorId: userId
          });
      
          const chunks = this.splitArticle(post.text);

      

          const chunkDocs = await Promise.all(
            chunks.map(async (chunk) => {
              const embedding = await getEmbedding(chunk);
              return {
                postId: post._id,
                content: chunk,
                embedding
              };
            })
          );

          await PostChunkModel.insertMany(chunkDocs);
      
          res.status(201).json(post);
      
        } catch (error) {
          this.handleError(res, error);
        }
      }
    
    splitArticle(text: string, size = 500, overlap = 100) {
        const chunks: string[] = [];
      
        for (let i = 0; i < text.length; i += size - overlap) {
          chunks.push(text.slice(i, i + size));
        }
      
        return chunks;
    }

    
    async put(req: AuthRequest, res: Response) {
        const authReq = req as AuthRequest;
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
            post.text = req.body.text ?? post.text;
            post.title = req.body.title ?? post.title;
            post.image = req.body.image ?? post.image;
            post.topics = req.body.topics ?? post.topics;

            await post.save();
            if (req.body.text) {
                await PostChunkModel.deleteMany({ postId: post._id });
        
                const chunks = this.splitArticle(post.text);
        
                const chunkDocs = await Promise.all(
                chunks.map(async (chunk) => {
                    const embedding = await getEmbedding(chunk);
                    return {
                    postId: post._id,
                    content: chunk,
                    embedding
                    };
                })
                );
        
                await PostChunkModel.insertMany(chunkDocs);
            }
            res.json(post);
            return;
        } catch (error) {
            this.handleError(res, error);
            return;
        }
    }
}

export default new PostController();