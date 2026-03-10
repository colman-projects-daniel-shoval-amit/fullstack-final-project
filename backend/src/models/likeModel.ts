import mongoose, { Schema, Document } from "mongoose";

export interface ILike extends Document {
    postId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
}

const likeSchema = new Schema<ILike>({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
});

likeSchema.index({ postId: 1, userId: 1 }, { unique: true });

likeSchema.post('save', async function (doc) {
    if (doc) {
        await mongoose.model("Post").findByIdAndUpdate(doc.postId, {
            $inc: { likesCount: 1 }
        });
    }
});

likeSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await mongoose.model("Post").findByIdAndUpdate(doc.postId, {
            $inc: { likesCount: -1 }
        });
    }
});

const LikeModel = mongoose.model<ILike>("Like", likeSchema);

export default LikeModel;
