import { Response } from "express";
import baseController from "./baseController";
import ChatModel from "../models/chatModel";
import MessageModel from "../models/messageModel";
import { AuthRequest } from "../middlewares/authMiddleware";

class ChatController extends baseController {
    constructor() {
        super(ChatModel);
    }

    async getByUserId(req: AuthRequest, res: Response) {
        const userId = req.params.userId;
        try {
            const chats = await ChatModel.find({ participants: userId }).sort({ updatedAt: -1 });
            res.json(chats);
        } catch (error) {
            this.handleError(res, error);
        }
    }

    async getById(req: AuthRequest, res: Response) {
        const id = req.params.id;
        try {
            const chat = await ChatModel.findById(id).lean();
            if (!chat) {
                return res.status(404).json({ error: "Chat not found" });
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
            // Check if user is a participant before allowing delete
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
