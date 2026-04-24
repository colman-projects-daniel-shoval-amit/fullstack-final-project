import { Response } from "express";
import baseController from "./baseController";
import ChatModel from "../models/chatModel";
import MessageModel from "../models/messageModel";
import { AuthRequest } from "../middlewares/authMiddleware";

class ChatController extends baseController {
    constructor() {
        super(ChatModel);
    }

    // Vuln 6 fix: scope GET /chats to the authenticated user's own chats
    async get(req: AuthRequest, res: Response): Promise<void> {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        try {
            const chats = await ChatModel.find({ participants: req.user?._id })
                .populate('participants', '_id email avatar')
                .sort({ updatedAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit);
            res.json(chats);
        } catch (error) {
            this.handleError(res, error);
        }
    }

    // Vuln 4 fix: enforce that the caller can only request their own chat list
    async getByUserId(req: AuthRequest, res: Response) {
        const userId = req.params.userId;
        if (String(req.user?._id) !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        try {
            const chats = await ChatModel.find({ participants: userId })
                .populate('participants', '_id email avatar')
                .sort({ updatedAt: -1 });
            res.json(chats);
        } catch (error) {
            this.handleError(res, error);
        }
    }

    // Vuln 5 fix: verify the caller is a participant before returning the chat + messages
    async getById(req: AuthRequest, res: Response) {
        const id = req.params.id;
        try {
            const chat = await ChatModel.findById(id).populate('participants', '_id email avatar').lean();
            if (!chat) {
                return res.status(404).json({ error: "Chat not found" });
            }
            // After populate, each participant is { _id, email }; fall back to raw ObjectId for unpopulated docs
            const participantIds = chat.participants.map(p => String((p as any)._id ?? p));
            if (!participantIds.includes(String(req.user?._id))) {
                return res.status(403).json({ error: "Forbidden" });
            }
            const messages = await MessageModel.find({ chatId: id });
            res.json({ ...chat, messages });
        } catch (error) {
            this.handleError(res, error);
        }
    }

    async create(req: AuthRequest, res: Response) {
        if (!req.body.participants) {
            req.body.participants = [];
        }
        const userId = req.user?._id;
        if (userId && !req.body.participants.includes(userId)) {
            req.body.participants.push(userId);
        }

        // For 1-on-1 chats, return the existing chat rather than creating a duplicate
        const allParticipants: string[] = req.body.participants;
        if (allParticipants.length === 2) {
            try {
                const existing = await ChatModel.findOne({
                    participants: { $all: allParticipants, $size: 2 },
                });
                if (existing) {
                    res.status(200).json(existing);
                    return;
                }
            } catch (error) {
                this.handleError(res, error);
                return;
            }
        }

        super.create(req, res);
    }

    async delete(req: AuthRequest, res: Response) {
        const id = req.params.id;
        const userId = req.user?._id;
        try {
            const chat = await ChatModel.findById(id);
            if (!chat) {
                return res.status(404).json({ error: "Chat not found" });
            }
            if (!chat.participants.some(p => String(p) === userId)) {
                return res.status(403).json({ error: "Unauthorized" });
            }
            return super.delete(req, res);
        } catch (error) {
            this.handleError(res, error);
        }
    }
}

export default new ChatController();
