import mongoose, { Document, Schema } from 'mongoose';

export interface ITopic extends Document {
  name: string;
  slug: string;
}

const TopicSchema = new Schema<ITopic>({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
});

const TopicModel = mongoose.model<ITopic>('Topic', TopicSchema);

export default TopicModel;
