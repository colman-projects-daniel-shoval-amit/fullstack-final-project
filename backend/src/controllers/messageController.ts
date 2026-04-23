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

    async create(req: AuthRequest, res: Response) {
        req.body.senderId = req.user?._id;
        const chatId = req.body.chatId;

        try {
            const chat = await ChatModel.findById(chatId);
            if (!chat) {
                res.status(404).json({ error: "Chat not found" });
                return;
            }

            // Optional: User must be a participant to send messages
            if (!chat.participants.some(p => String(p) === req.user?._id)) {
                res.status(403).json({ error: "Not a participant of this chat" });
                return;
            }

            const message = await MessageModel.create({
                senderId: req.user?._id,
                chatId,
                content: req.body.content,
            });

            await ChatModel.findByIdAndUpdate(chatId, { $set: { updatedAt: new Date() } });

            const io = getIo();
            const payload = message.toJSON();

            // Broadcast the full message to the active chat room (message window)
            io?.to(message.chatId.toString()).emit('new_message', payload);

            // Broadcast a sidebar update to each participant's personal room
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
