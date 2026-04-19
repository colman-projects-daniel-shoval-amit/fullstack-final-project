import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  googleId: string;
  refreshTokens: string[];
  interests: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  followers: mongoose.Types.ObjectId[];
}

const userSchema = new Schema<IUser>({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: false,
    },
    googleId: {
        type: String,
        required: false,
    },
    refreshTokens: {
        type: [String],
        default: [],
    },
    interests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: [] }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
}, {
    toJSON: {
        transform(_doc, ret: Record<string, unknown>) {
            delete ret.password;
            delete ret.refreshTokens;
            return ret;
        },
    },
});

const UserModel = mongoose.model<IUser>('User', userSchema);

export default UserModel;