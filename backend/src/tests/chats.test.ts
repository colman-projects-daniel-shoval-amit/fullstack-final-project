import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import { Express } from "express";
import userModel from "../models/userModel";
import chatModel from "../models/chatModel";
import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';
import { getLogedInUser, UserData, userData1, userData2 } from "./utils";

let app: Express;
let loginUser1: UserData;
let loginUser2: UserData;

beforeAll(async () => {
    app = await initApp();
    await userModel.deleteMany();
    await chatModel.deleteMany();
    loginUser1 = await getLogedInUser(userData1, app);
    loginUser2 = await getLogedInUser(userData2, app);
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
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
        expect(response.body.participants.length).toBe(2); // creator should be added automatically
        chatId = response.body._id;
    });

    test("Create Chat - Fail (No Auth)", async () => {
        const response = await request(app).post("/chats").send({
            title: "Anon Chat",
        });
        expect(response.statusCode).toBe(401);
    });

    test("Get All Chats", async () => {
        const response = await request(app).get("/chats").set("Authorization", "Bearer " + loginUser1.token);
        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBeGreaterThan(0);
    });

    test("Get Chat By ID - Success", async () => {
        const response = await request(app).get("/chats/" + chatId).set("Authorization", "Bearer " + loginUser1.token);
        expect(response.statusCode).toBe(200);
        expect(response.body._id).toBe(chatId);
        expect(Array.isArray(response.body.messages)).toBe(true);
    });

    test("Get Chats By User ID - Success", async () => {
        const response = await request(app).get("/chats/user/" + loginUser1._id).set("Authorization", "Bearer " + loginUser1.token);
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0].participants).toContain(loginUser1._id);
    });

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
