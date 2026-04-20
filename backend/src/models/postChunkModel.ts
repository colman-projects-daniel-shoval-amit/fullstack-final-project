import mongoose, { Document, Schema } from 'mongoose';

export interface IPostChunk extends Document {
    postId: mongoose.Types.ObjectId;
    content: string;
    embedding: number[];
  }
  
  const PostChunkSchema = new Schema<IPostChunk>({
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true
    },
    content: { type: String, required: true },
    embedding: {
      type: [Number],
      required: true
    }
  });
  PostChunkSchema.index({ postId: 1 });
  export const PostChunkModel = mongoose.model<IPostChunk>(
    'PostChunk',
    PostChunkSchema
  );


export default PostChunkModel;


