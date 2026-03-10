import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
    senderId: mongoose.Types.ObjectId;
    chatId: mongoose.Types.ObjectId;
    content: string;
    timestamp: Date;
}

const messageSchema = new Schema<IMessage>({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat",
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    }
});

const MessageModel = mongoose.model<IMessage>("Message", messageSchema);
export default MessageModel;
