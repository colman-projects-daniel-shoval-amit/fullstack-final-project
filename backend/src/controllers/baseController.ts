
import { Request, Response } from "express";

class BaseController {
    model: any;

    constructor(model: any) {
        this.model = model;
    }

    handleError(res: Response, error: any) {
        if (error.name === 'ValidationError' || error.name === 'CastError') {
            res.status(400).send({ error: error.message });
        } else {
            res.status(500).send({ error: 'An unknown error occurred' });
        }
    }

    async get(req: Request, res: Response) {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        // Remove pagination parameters so they aren't used in the db filter
        const filter = { ...req.query };
        delete filter.page;
        delete filter.limit;

        try {
            const data = await this.model.find(filter)
                .skip((page - 1) * limit)
                .limit(limit);
            res.json(data);
        } catch (error) {
            this.handleError(res, error);
        }
    };

    async getById(req: Request, res: Response) {
        const id = req.params.id;
        try {
            const data = await this.model.findById(id);
            if (!data) {
                return res.status(404).json({ error: "Data not found" });
            } else {
                res.json(data);
            }
        } catch (error) {
            this.handleError(res, error);
        }
    };

    async create(req: Request, res: Response) {
        const obj = req.body;
        try {
            const response = await this.model.create(obj);
            res.status(201).json(response);
        } catch (error) {
            this.handleError(res, error);
        }
    };

    async put(req: Request, res: Response) {
        const id = req.params.id;
        const obj = req.body;
        try {
            const response = await this.model.findByIdAndUpdate(id, obj, { new: true });
            res.json(response);
        } catch (error) {
            this.handleError(res, error);
        }
    };

    async delete(req: Request, res: Response) {
        const id = req.params.id;
        try {
            const response = await this.model.findByIdAndDelete(id);
            if (!response) {
                return res.status(404).json({ error: "Data not found" });
            }
            res.send(response);
        } catch (error) {
            this.handleError(res, error);
        }
    };
};
export default BaseController