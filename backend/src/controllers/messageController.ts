import { Response } from "express";
import baseController from "./baseController";
import MessageModel from "../models/messageModel";
import ChatModel from "../models/chatModel";
import { AuthRequest } from "../middlewares/authMiddleware";
import { getIo } from "../socket";

class MessageController extends baseController {
    constructor() {
        super(MessageModel);
    }

    // Vuln 7 fix: scope message listing to chats the authenticated user participates in.
    // If ?chatId is specified, additionally verify the user is a participant of that chat.
    async get(req: AuthRequest, res: Response): Promise<void> {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const userId = req.user?._id;
        const chatId = req.query.chatId as string | undefined;
        try {
            if (chatId) {
                const chat = await ChatModel.findById(chatId).lean();
                if (!chat || !chat.participants.some(p => String(p) === userId)) {
                    res.status(403).json({ error: 'Forbidden' });
                    return;
                }
                const messages = await MessageModel.find({ chatId })
                    .skip((page - 1) * limit)
                    .limit(limit);
                res.json(messages);
                return;
            }

            // No chatId filter: return messages only from the user's own chats
            const userChats = await ChatModel.find({ participants: userId }, '_id').lean();
            const chatIds = userChats.map(c => c._id);
            const messages = await MessageModel.find({ chatId: { $in: chatIds } })
                .skip((page - 1) * limit)
                .limit(limit);
            res.json(messages);
        } catch (error) {
            this.handleError(res, error);
        }
    }

    async create(req: AuthRequest, res: Response) {
        req.body.senderId = req.user?._id;
        const chatId = req.body.chatId;

        try {
            const chat = await ChatModel.findById(chatId);
            if (!chat) {
                res.status(404).json({ error: "Chat not found" });
                return;
            }

            if (!chat.participants.some(p => String(p) === req.user?._id)) {
                res.status(403).json({ error: "Not a participant of this chat" });
                return;
            }

            const message = await MessageModel.create({
                senderId: req.user?._id,
                chatId,
                content: req.body.content,
                readBy: [req.user?._id],
            });

            await ChatModel.findByIdAndUpdate(chatId, {
                $set: { updatedAt: new Date(), latestMessage: message._id },
            });

            const io = getIo();
            const payload = message.toJSON();

            io?.to(message.chatId.toString()).emit('new_message', payload);

            for (const participantId of chat.participants) {
                io?.to(participantId.toString()).emit('chat_list_update', payload);
            }

            res.status(201).json(message);
        } catch (error) {
            this.handleError(res, error);
        }
    }

    async delete(req: AuthRequest, res: Response) {
        const id = req.params.id;
        const userId = req.user?._id;
        try {
            const msg = await MessageModel.findById(id);
            if (!msg) {
                return res.status(404).json({ error: "Message not found" });
            }
            if (String(msg.senderId) !== userId) {
                return res.status(403).json({ error: "Unauthorized" });
            }
            return super.delete(req, res);
        } catch (error) {
            this.handleError(res, error);
        }
    }
}

export default new MessageController();
