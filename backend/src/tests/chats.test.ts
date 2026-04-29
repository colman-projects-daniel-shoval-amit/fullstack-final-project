import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import { Express } from "express";
import userModel from "../models/userModel";
import chatModel from "../models/chatModel";
import messageModel from "../models/messageModel";
import { describe, expect, test, beforeAll, afterAll, jest } from '@jest/globals';
import { getLogedInUser, UserData, userData1, userData2, safeDropDatabase } from "./utils";

jest.setTimeout(30000);

let app: Express;
let loginUser1: UserData;
let loginUser2: UserData;

beforeAll(async () => {
    app = await initApp();
    await userModel.deleteMany();
    await chatModel.deleteMany();
    await messageModel.deleteMany();
    loginUser1 = await getLogedInUser(userData1, app);
    loginUser2 = await getLogedInUser(userData2, app);
});

afterAll(async () => {
    await safeDropDatabase(mongoose.connection);
});

describe("Chat Tests", () => {

    let chatId: string;

    test("Create Chat - Success", async () => {
        const response = await request(app)
            .post("/chats")
            .set("Authorization", "Bearer " + loginUser1.token)
            .send({
                title: "Test Chat",
                participants: [loginUser2._id]
            });
        expect(response.statusCode).toBe(201);
        expect(response.body.title).toBe("Test Chat");
        expect(response.body.participants.length).toBe(2);
        chatId = response.body._id;
    });

    test("Create Chat - Fail (No Auth)", async () => {
        const response = await request(app).post("/chats").send({
            title: "Anon Chat",
        });
        expect(response.statusCode).toBe(401);
    });

    test("Create Chat - deduplicates 1-on-1 chats (returns 200 with existing)", async () => {
        const response = await request(app)
            .post("/chats")
            .set("Authorization", "Bearer " + loginUser1.token)
            .send({ title: "Duplicate Chat", participants: [loginUser2._id] });
        expect(response.statusCode).toBe(200);
        expect(response.body._id).toBe(chatId);
    });

    test("Get All Chats", async () => {
        const response = await request(app).get("/chats").set("Authorization", "Bearer " + loginUser1.token);
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0]).toHaveProperty("unreadCount");
    });

    test("Get Chat By ID - Success", async () => {
        const response = await request(app).get("/chats/" + chatId).set("Authorization", "Bearer " + loginUser1.token);
        expect(response.statusCode).toBe(200);
        expect(response.body._id).toBe(chatId);
        expect(Array.isArray(response.body.messages)).toBe(true);
    });

    test("Get Chat By ID - Fail (Non-participant)", async () => {
        const outsider: UserData = { email: "outsider1@test.com", password: "123", _id: "", token: "", refreshToken: "" };
        const loginOutsider = await getLogedInUser(outsider, app);
        const response = await request(app).get("/chats/" + chatId).set("Authorization", "Bearer " + loginOutsider.token);
        expect(response.statusCode).toBe(403);
    });

    test("Get Chats By User ID - Success", async () => {
        const response = await request(app).get("/chats/user/" + loginUser1._id).set("Authorization", "Bearer " + loginUser1.token);
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        // participants are populated objects after the security refactor
        const participantIds = response.body[0].participants.map((p: any) => p._id ?? p);
        expect(participantIds).toContain(loginUser1._id);
    });

    test("Get Chats By User ID - Fail (different user's chats)", async () => {
        const response = await request(app)
            .get("/chats/user/" + loginUser2._id)
            .set("Authorization", "Bearer " + loginUser1.token);
        expect(response.statusCode).toBe(403);
    });

    // -----------------------------------------------------------------------
    // Read-receipt endpoints
    // -----------------------------------------------------------------------

    test("GET /chats/unread - empty before any messages sent", async () => {
        const res = await request(app)
            .get("/chats/unread")
            .set("Authorization", "Bearer " + loginUser1.token);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.unreadChatIds)).toBe(true);
        expect(res.body.unreadChatIds.length).toBe(0);
    });

    test("GET /chats/unread - 401 without auth", async () => {
        const res = await request(app).get("/chats/unread");
        expect(res.statusCode).toBe(401);
    });

    test("Seed: send a message from user1 to the chat", async () => {
        const res = await request(app)
            .post("/messages")
            .set("Authorization", "Bearer " + loginUser1.token)
            .send({ chatId, content: "Hey user2, read me!" });
        expect(res.statusCode).toBe(201);
        // sender is auto-added to readBy — so user1 has no unread
        expect(Array.isArray(res.body.readBy)).toBe(true);
        expect(res.body.readBy).toContain(loginUser1._id);
    });

    test("GET /chats/unread - user2 sees the chat as unread", async () => {
        const res = await request(app)
            .get("/chats/unread")
            .set("Authorization", "Bearer " + loginUser2.token);
        expect(res.statusCode).toBe(200);
        expect(res.body.unreadChatIds).toContain(chatId);
    });

    test("GET /chats/unread - user1 (sender) sees no unread for this chat", async () => {
        const res = await request(app)
            .get("/chats/unread")
            .set("Authorization", "Bearer " + loginUser1.token);
        expect(res.statusCode).toBe(200);
        expect(res.body.unreadChatIds).not.toContain(chatId);
    });

    test("PUT /chats/:chatId/read - 401 without auth", async () => {
        const res = await request(app).put(`/chats/${chatId}/read`);
        expect(res.statusCode).toBe(401);
    });

    test("PUT /chats/:chatId/read - 403 for non-participant", async () => {
        const outsider: UserData = { email: "outsider2@test.com", password: "123", _id: "", token: "", refreshToken: "" };
        const loginOutsider = await getLogedInUser(outsider, app);
        const res = await request(app)
            .put(`/chats/${chatId}/read`)
            .set("Authorization", "Bearer " + loginOutsider.token);
        expect(res.statusCode).toBe(403);
    });

    test("PUT /chats/:chatId/read - 200 marks messages read for user2", async () => {
        const res = await request(app)
            .put(`/chats/${chatId}/read`)
            .set("Authorization", "Bearer " + loginUser2.token);
        expect(res.statusCode).toBe(200);
        expect(res.body.ok).toBe(true);
    });

    test("GET /chats/unread - user2 has no unread after marking read", async () => {
        const res = await request(app)
            .get("/chats/unread")
            .set("Authorization", "Bearer " + loginUser2.token);
        expect(res.statusCode).toBe(200);
        expect(res.body.unreadChatIds).not.toContain(chatId);
    });

    // -----------------------------------------------------------------------
    // Delete
    // -----------------------------------------------------------------------

    test("Delete Chat - Fail (Not a Participant)", async () => {
        const userData3: UserData = { email: "user4@test.com", password: "123", _id: "", token: "", refreshToken: "" };
        const loginUser3 = await getLogedInUser(userData3, app);

        const response = await request(app)
            .delete("/chats/" + chatId)
            .set("Authorization", "Bearer " + loginUser3.token);
        expect(response.statusCode).toBe(403);
    });

    test("Delete Chat - Success", async () => {
        const response = await request(app)
            .delete("/chats/" + chatId)
            .set("Authorization", "Bearer " + loginUser1.token);
        expect(response.statusCode).toBe(200);
    });
});
