import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config/config';
import initApp from './server';
import { setIo } from './socket';

initApp().then((app) => {
    const httpServer = createServer(app);

    const io = new Server(httpServer, {
        cors: { origin: config.FRONTEND_URL, credentials: true },
    });

    setIo(io);

    io.on('connection', (socket) => {
        socket.on('join_chat', (chatId: string) => {
            socket.join(chatId);
        });

        socket.on('disconnect', () => {});
    });

    httpServer.listen(config.PORT, () => {
        console.log(`Server listening on http://localhost:${config.PORT}`);
    });
});
