import mongoose, { Schema } from "mongoose";

export interface IComment extends Document {
    postId: mongoose.Types.ObjectId;
    authorId: mongoose.Types.ObjectId;
    content: string;
}

const commentSchema = new Schema<IComment>({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
    },
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
});

commentSchema.post('save', async function (doc) {
    await mongoose.model("Post").findByIdAndUpdate(doc.postId, {
        $inc: { commentsCount: 1 }
    });
});

commentSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await mongoose.model("Post").findByIdAndUpdate(doc.postId, {
            $inc: { commentsCount: -1 }
        });
    }
});

const CommentModel = mongoose.model<IComment>("Comment", commentSchema);

export default CommentModel;
