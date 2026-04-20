import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
  title: string;
  authorId: mongoose.Types.ObjectId;
  text: string;
  image: string;
  commentsCount: number;
  likesCount: number;
  topics: mongoose.Types.ObjectId[];
}

const PostSchema = new Schema<IPost>({
  title: { type: String, required: true },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: { type: String, required: true },
  image: { type: String, required: false },
  commentsCount: { type: Number, default: 0 },
  likesCount: { type: Number, default: 0 },
  topics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: [] }],
  
});


const PostModel = mongoose.model<IPost>('Post', PostSchema);

export default PostModel;
