import { createServer } from 'http';
import { AddressInfo } from 'net';
import { Server } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import request from 'supertest';
import initApp from '../server';
import mongoose from 'mongoose';
import { Express } from 'express';
import userModel from '../models/userModel';
import chatModel from '../models/chatModel';
import messageModel from '../models/messageModel';
import { describe, expect, test, beforeAll, afterAll, jest } from '@jest/globals';
import { getLogedInUser, UserData, userData1, userData2, safeDropDatabase } from './utils';
import { setIo } from '../socket';

jest.setTimeout(30000);

let app: Express;
let httpServer: ReturnType<typeof createServer>;
let clientSocket: ClientSocket;
let loginUser1: UserData;
let loginUser2: UserData;
let chatId: string;

beforeAll(async () => {
    app = await initApp();
    await userModel.deleteMany();
    await chatModel.deleteMany();
    await messageModel.deleteMany();

    loginUser1 = await getLogedInUser(userData1, app);
    loginUser2 = await getLogedInUser(userData2, app);

    // Spin up a real HTTP + Socket.io server on a random OS-assigned port.
    // supertest's request(app) still goes through the Express app, and
    // getIo() returns this io instance, so broadcasts reach clientSocket.
    httpServer = createServer(app);
    const io = new Server(httpServer, { cors: { origin: '*' } });
    setIo(io);
    io.on('connection', socket => {
        socket.on('join_chat', (cid: string) => socket.join(cid.toString()));
    });

    await new Promise<void>(resolve => httpServer.listen(0, resolve));
    const { port } = httpServer.address() as AddressInfo;

    // Create a chat so we have a real chatId to test with
    const chatRes = await request(app)
        .post('/chats')
        .set('Authorization', 'Bearer ' + loginUser1.token)
        .send({ title: 'Socket Test Chat', participants: [loginUser2._id] });
    chatId = chatRes.body._id;

    // Connect a socket.io-client and join the chat room
    clientSocket = ioClient(`http://localhost:${port}`, { transports: ['websocket'] });
    await new Promise<void>(resolve => clientSocket.on('connect', resolve));
    clientSocket.emit('join_chat', chatId);
    // Wait for the server to process the join before tests start
    await new Promise(res => setTimeout(res, 100));
});

afterAll(async () => {
    clientSocket?.disconnect();
    await new Promise<void>(resolve => httpServer.close(() => resolve()));
    setIo(null as any);
    await safeDropDatabase(mongoose.connection);
    await mongoose.connection.close();
});

describe('Socket.io — new_message broadcast', () => {
    test('emits new_message to the room when POST /messages is called', async () => {
        const received = new Promise<Record<string, unknown>>(resolve => {
            clientSocket.once('new_message', resolve);
        });

        await request(app)
            .post('/messages')
            .set('Authorization', 'Bearer ' + loginUser1.token)
            .send({ chatId, content: 'hello socket' })
            .expect(201);

        const msg = await received;
        expect(msg).toMatchObject({
            chatId,
            content: 'hello socket',
            senderId: loginUser1._id,
        });
    });

    test('new_message payload contains _id, senderId, chatId, content, and timestamp', async () => {
        const received = new Promise<Record<string, unknown>>(resolve => {
            clientSocket.once('new_message', resolve);
        });

        await request(app)
            .post('/messages')
            .set('Authorization', 'Bearer ' + loginUser1.token)
            .send({ chatId, content: 'field check' })
            .expect(201);

        const msg = await received;
        expect(typeof msg._id).toBe('string');
        expect(typeof msg.senderId).toBe('string');
        expect(typeof msg.chatId).toBe('string');
        expect(msg.content).toBe('field check');
        expect(msg.timestamp).toBeDefined();
    });

    test('non-participant receives 403 and no broadcast is emitted', async () => {
        const outsider = await getLogedInUser(
            { email: 'outsider@socket.test', password: 'pass', _id: '', token: '', refreshToken: '' },
            app,
        );

        // Register a listener that would catch any stray broadcast
        let received = false;
        clientSocket.once('new_message', () => { received = true; });

        const res = await request(app)
            .post('/messages')
            .set('Authorization', 'Bearer ' + outsider.token)
            .send({ chatId, content: 'should be blocked' });

        expect(res.statusCode).toBe(403);

        // Give the event loop a chance to deliver any errant socket event
        await new Promise(res => setTimeout(res, 150));
        expect(received).toBe(false);
        clientSocket.off('new_message');
    });
});
