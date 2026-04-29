import express, { Express } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import path from "path";
import { config } from "./config/config";
import commentsRouter from "./routes/commentRoute";
import userRouter from "./routes/userRoute";
import postRouter from "./routes/postRoute";
import authRouter from "./routes/authRoute";
import likeRouter from "./routes/likeRoute";
import chatRouter from "./routes/chatRoute";
import messageRouter from "./routes/messageRoute";
import topicRouter from "./routes/topicRoute";
import aiRouter from "./routes/aiRoute";
import cors from "cors";
import { authenticate } from "./middlewares/authMiddleware";
import { uploadSingle } from "./middlewares/uploadMiddleware";
import { swaggerUi, swaggerSpec } from "./swagger";
import aiChatRouter from "./routes/aiChatRoute";

const app = express();

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Shoval & Daniel Posts & Comments API Documentation'
}));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors());

app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/auth', authRouter);
app.use(authenticate);

app.post('/upload', uploadSingle('image'), (req, res) => {
    if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
    }
    const url = `/uploads/${req.file.filename}`;
    res.status(201).json({ url });
});
app.use('/aichat', aiChatRouter);
app.use('/posts', postRouter);
app.use('/comments', commentsRouter);
app.use('/users', userRouter);
app.use('/likes', likeRouter);
app.use('/chats', chatRouter);
app.use('/messages', messageRouter);
app.use('/topics', topicRouter);
app.use('/ai', aiRouter);

const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to Database"));

const initApp = () => {
    return new Promise<Express>((resolve, reject) => {

        if (!config.DATABASE_URL) {
            reject("DATABASE_URL is not defined in .env file");
        } else {
            mongoose
                .connect(config.DATABASE_URL)
                .then(() => {
                    resolve(app);
                })
                .catch((error) => {
                    reject(error);
                });
        }
    });
};

export default initApp;
