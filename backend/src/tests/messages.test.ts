import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import { Express } from "express";
import userModel from "../models/userModel";
import chatModel from "../models/chatModel";
import messageModel from "../models/messageModel";
import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';
import { getLogedInUser, UserData, userData1, userData2 } from "./utils";

let app: Express;
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
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
});

describe("Message Tests", () => {

    test("Chat Setup: Create Test Chat", async () => {
        const response = await request(app)
            .post("/chats")
            .set("Authorization", "Bearer " + loginUser1.token)
            .send({
                title: "Test Chat",
                participants: [loginUser2._id]
            });
        expect(response.statusCode).toBe(201);
        chatId = response.body._id;
    });

    let messageId: string;

    test("Create Message - Success", async () => {
        const response = await request(app)
            .post("/messages")
            .set("Authorization", "Bearer " + loginUser1.token)
            .send({
                chatId: chatId,
                content: "Hello Chat!"
            });
        expect(response.statusCode).toBe(201);
        expect(response.body.senderId).toBe(loginUser1._id);
        expect(response.body.chatId).toBe(chatId);
        expect(response.body.content).toBe("Hello Chat!");
        messageId = response.body._id;
    });

    test("Create Message - Fail (Not Participant)", async () => {
        const userData3: UserData = { email: "user10@test.com", password: "123", _id: "", token: "", refreshToken: "" };
        const loginUser3 = await getLogedInUser(userData3, app);

        const response = await request(app)
            .post("/messages")
            .set("Authorization", "Bearer " + loginUser3.token)
            .send({
                chatId: chatId,
                content: "Can I join?"
            });
        expect(response.statusCode).toBe(403);
    });

    test("Get All Messages for Chat", async () => {
        const response = await request(app).get(`/messages?chatId=${chatId}`).set("Authorization", "Bearer " + loginUser1.token);
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].content).toBe("Hello Chat!");
    });

    test("Get Message By ID - Success", async () => {
        const response = await request(app).get("/messages/" + messageId).set("Authorization", "Bearer " + loginUser1.token);
        expect(response.statusCode).toBe(200);
        expect(response.body._id).toBe(messageId);
    });

    test("Delete Message - Fail (Not Sender)", async () => {
        const response = await request(app)
            .delete("/messages/" + messageId)
            .set("Authorization", "Bearer " + loginUser2.token);
        expect(response.statusCode).toBe(403);
    });

    test("Delete Message - Success", async () => {
        const response = await request(app)
            .delete("/messages/" + messageId)
            .set("Authorization", "Bearer " + loginUser1.token);
        expect(response.statusCode).toBe(200);
    });
});
