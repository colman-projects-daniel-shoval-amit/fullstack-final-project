import { createServer } from 'https';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from './config/config';
import initApp from './server';
import { setIo } from './socket';
import ChatModel from './models/chatModel';
import { readFileSync } from 'fs';

initApp().then((app) => {
    const httpsServer = createServer({
        key: readFileSync('/home/node69/cert/client-key.pem'),
        cert: readFileSync('/home/node69/cert/client-cert.pem'),
    }, app);

    const io = new Server(httpsServer, {
        cors: { origin: config.FRONTEND_URL, credentials: true },
    });

    // Vuln 1 fix: authenticate every socket connection with the same JWT used by REST routes
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token as string | undefined;
        if (!token) return next(new Error('Unauthorized'));
        try {
            const decoded = jwt.verify(token, config.JWT_SECRET) as { _id: string };
            socket.data.userId = decoded._id;
            next();
        } catch {
            next(new Error('Unauthorized'));
        }
    });

    setIo(io);

    io.on('connection', (socket) => {
        // Vuln 3 fix: only join a chat room if the authenticated user is a participant
        socket.on('join_chat', async (chatId: string) => {
            if (!chatId) return;
            try {
                const chat = await ChatModel.findById(chatId).lean();
                if (chat && chat.participants.some(p => String(p) === socket.data.userId)) {
                    socket.join(chatId.toString());
                }
            } catch {
                // invalid chatId format — silently ignore
            }
        });

        // Vuln 2 fix: only allow a socket to join its own personal room
        socket.on('join_user_room', (userId: string) => {
            if (userId && userId === socket.data.userId) {
                socket.join(userId.toString());
            }
        });
    });

    httpsServer.listen(config.PORT, () => {
        console.log(`Server listening on http://localhost:${config.PORT}`);
    });
});
