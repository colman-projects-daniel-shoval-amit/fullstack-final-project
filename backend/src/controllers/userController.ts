import { Response } from 'express';
import mongoose from 'mongoose';
import UserModel from '../models/userModel';
import PostModel from '../models/postModel';
import BaseController from './baseController';
import { AuthRequest } from '../middlewares/authMiddleware';

class UserController extends BaseController {
    constructor() {
        super(UserModel);
    }

    async getMe(req: AuthRequest, res: Response) {
        try {
            const user = await UserModel.findById(req.user?._id)
                .populate('interests', 'name slug')
                .populate('following', 'email')
                .populate('followers', 'email');
            if (!user) return res.status(404).json({ error: 'User not found' });
            res.json(user);
        } catch (error) {
            this.handleError(res, error);
        }
    }

    async updateMe(req: AuthRequest, res: Response) {
        try {
            const { interests } = req.body;
            const user = await UserModel.findByIdAndUpdate(
                req.user?._id,
                { interests },
                { new: true }
            ).populate('interests', 'name slug')
             .populate('following', 'email')
             .populate('followers', 'email');
            res.json(user);
        } catch (error) {
            this.handleError(res, error);
        }
    }

    async follow(req: AuthRequest, res: Response) {
        const selfId = String(req.user?._id);
        const targetId = req.params.id;
        if (!selfId) return res.status(401).json({ error: 'Unauthorized' });
        if (targetId === selfId) return res.status(400).json({ error: 'Cannot follow yourself' });
        try {
            const target = await UserModel.findById(targetId);
            if (!target) return res.status(404).json({ error: 'User not found' });
            await UserModel.updateOne({ _id: selfId }, { $addToSet: { following: targetId } });
            await UserModel.updateOne({ _id: targetId }, { $addToSet: { followers: selfId } });
            res.json({ message: 'Followed' });
        } catch (error) {
            this.handleError(res, error);
        }
    }

    async unfollow(req: AuthRequest, res: Response) {
        const selfId = String(req.user?._id);
        const targetId = req.params.id;
        if (!selfId) return res.status(401).json({ error: 'Unauthorized' });
        try {
            await UserModel.updateOne({ _id: selfId }, { $pull: { following: targetId } });
            await UserModel.updateOne({ _id: targetId }, { $pull: { followers: selfId } });
            res.json({ message: 'Unfollowed' });
        } catch (error) {
            this.handleError(res, error);
        }
    }

    async getRecommended(req: AuthRequest, res: Response) {
        const selfId = req.user?._id;
        if (!selfId) return res.status(401).json({ error: 'Unauthorized' });
        try {
            const self = await UserModel.findById(selfId).select('interests');
            if (!self?.interests?.length) return res.json([]);
            const authorIds: mongoose.Types.ObjectId[] = await PostModel.distinct('authorId', { topics: { $in: self.interests } });
            const filtered = authorIds.filter(id => id.toString() !== selfId);
            const users = await UserModel.find({ _id: { $in: filtered } }).limit(5).select('email');
            res.json(users);
        } catch (error) {
            this.handleError(res, error);
        }
    }
}

export default new UserController();
