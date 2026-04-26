import { Response } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
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
                .populate('following', 'email avatar')
                .populate('followers', 'email avatar');
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

    async changePassword(req: AuthRequest, res: Response) {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'currentPassword and newPassword are required' });
        }
        try {
            const user = await UserModel.findById(req.user?._id).select('+password');
            if (!user) return res.status(404).json({ error: 'User not found' });
            if (!user.password) {
                return res.status(400).json({ error: 'Account uses Google sign-in; no password to change' });
            }
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect' });
            user.password = await bcrypt.hash(newPassword, 10);
            await user.save();
            res.json({ message: 'Password updated' });
        } catch (error) {
            this.handleError(res, error);
        }
    }

    async uploadAvatar(req: AuthRequest, res: Response) {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const avatar = `/uploads/${req.file.filename}`;
        try {
            const user = await UserModel.findByIdAndUpdate(
                req.user?._id,
                { avatar },
                { new: true }
            ).populate('interests', 'name slug')
             .populate('following', 'email')
             .populate('followers', 'email');
            res.json(user);
        } catch (error) {
            this.handleError(res, error);
        }
    }

    async getRecommended(req: AuthRequest, res: Response) {
        const selfId = req.user?._id;
        if (!selfId) return res.status(401).json({ error: 'Unauthorized' });
        try {
            const self = await UserModel.findById(selfId).select('interests');
            let matchedUsers: any[] = [];
            let matchedIds: mongoose.Types.ObjectId[] = [];

            if (self?.interests?.length) {
                matchedIds = await PostModel.distinct('authorId', { topics: { $in: self.interests } });
                const filteredIds = matchedIds.filter(id => id.toString() !== String(selfId));
                matchedUsers = await UserModel.find({ _id: { $in: filteredIds } }).limit(5).select('email avatar');
            }

            const remaining = 5 - matchedUsers.length;
            let otherUsers: any[] = [];
            if (remaining > 0) {
                otherUsers = await UserModel.find({
                    _id: { $nin: [...matchedIds, selfId] },
                }).limit(remaining).select('email avatar');
            }

            res.json([...matchedUsers, ...otherUsers]);
        } catch (error) {
            this.handleError(res, error);
        }
    }
}

export default new UserController();
