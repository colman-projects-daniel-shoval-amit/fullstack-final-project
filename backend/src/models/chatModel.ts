import mongoose, { Schema, Document } from "mongoose";

export interface IChat extends Document {
    title: string;
    participants: mongoose.Types.ObjectId[];
    latestMessage?: mongoose.Types.ObjectId;
    updatedAt: Date;
    createdAt: Date;
}

const chatSchema = new Schema<IChat>({
    title: {
        type: String,
        required: true
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }],
    latestMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        required: false,
    },
}, { timestamps: true });
const ChatModel = mongoose.model<IChat>("Chat", chatSchema);

chatSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await mongoose.model("Message").deleteMany({ chatId: doc._id });
    }
});

export default ChatModel;
