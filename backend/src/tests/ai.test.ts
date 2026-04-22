import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import { Express } from "express";
import userModel from "../models/userModel";
import { geminiModel } from "../lib/gemini";
import { describe, expect, test, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { getLogedInUser, UserData, userData1, safeDropDatabase } from "./utils";

jest.setTimeout(30000);

// Auto-replace geminiModel with jest mocks so tests run without a real API key.
jest.mock('../lib/gemini', () => ({
    geminiModel: { generateContent: jest.fn() },
}));

// Convenience alias with `any` to avoid ts-jest strict-inference issues on
// mockResolvedValue (the real return type is a complex Google AI generic).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockGenerate = geminiModel.generateContent as any;

let app: Express;
let loginUser: UserData;

beforeAll(async () => {
    app = await initApp();
    await userModel.deleteMany();
    loginUser = await getLogedInUser(userData1, app);
});

beforeEach(() => {
    mockGenerate.mockResolvedValue({ response: { text: () => 'mocked AI response' } });
});

afterAll(async () => {
    await safeDropDatabase(mongoose.connection);
    await mongoose.connection.close();
});

// ---------------------------------------------------------------------------
// POST /ai/assist
// ---------------------------------------------------------------------------
describe("POST /ai/assist", () => {
    test("400 for invalid instruction value", async () => {
        const res = await request(app)
            .post("/ai/assist")
            .set("Authorization", "Bearer " + loginUser.token)
            .send({ title: "My Post", content: "Some content", instruction: "invalid_op" });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/invalid instruction/i);
    });

    test("200 with instruction=improve", async () => {
        const res = await request(app)
            .post("/ai/assist")
            .set("Authorization", "Bearer " + loginUser.token)
            .send({ title: "My Post", content: "Some content", instruction: "improve" });
        expect(res.statusCode).toBe(200);
        expect(typeof res.body.result).toBe("string");
    });

    test("200 with instruction=continue", async () => {
        const res = await request(app)
            .post("/ai/assist")
            .set("Authorization", "Bearer " + loginUser.token)
            .send({ title: "My Post", content: "Some content", instruction: "continue" });
        expect(res.statusCode).toBe(200);
        expect(typeof res.body.result).toBe("string");
    });

    test("200 with instruction=outline", async () => {
        const res = await request(app)
            .post("/ai/assist")
            .set("Authorization", "Bearer " + loginUser.token)
            .send({ title: "My Post", content: "Some content", instruction: "outline" });
        expect(res.statusCode).toBe(200);
        expect(typeof res.body.result).toBe("string");
    });

    test("401 without auth", async () => {
        const res = await request(app)
            .post("/ai/assist")
            .send({ title: "My Post", content: "Some content", instruction: "improve" });
        expect(res.statusCode).toBe(401);
    });
});

// ---------------------------------------------------------------------------
// POST /ai/summarize
// ---------------------------------------------------------------------------
describe("POST /ai/summarize", () => {
    test("200 returns a summary string", async () => {
        const res = await request(app)
            .post("/ai/summarize")
            .set("Authorization", "Bearer " + loginUser.token)
            .send({ title: "My Post", content: "Some long blog post content here." });
        expect(res.statusCode).toBe(200);
        expect(typeof res.body.summary).toBe("string");
    });

    test("401 without auth", async () => {
        const res = await request(app)
            .post("/ai/summarize")
            .send({ title: "My Post", content: "Content." });
        expect(res.statusCode).toBe(401);
    });
});

// ---------------------------------------------------------------------------
// POST /ai/suggest-topics
// ---------------------------------------------------------------------------
describe("POST /ai/suggest-topics", () => {
    test("200 returns matching topicIds when AI returns a JSON array", async () => {
        mockGenerate.mockResolvedValueOnce({
            response: { text: () => '["Technology"]' },
        });

        const topics = [
            { _id: "abc123", name: "Technology" },
            { _id: "def456", name: "Science" },
        ];

        const res = await request(app)
            .post("/ai/suggest-topics")
            .set("Authorization", "Bearer " + loginUser.token)
            .send({ title: "Tech Trends", content: "About AI and software.", topics });

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.topicIds)).toBeTruthy();
        expect(res.body.topicIds).toContain("abc123");
        expect(res.body.topicIds).not.toContain("def456");
    });

    test("200 returns empty topicIds when AI response has no JSON array", async () => {
        mockGenerate.mockResolvedValueOnce({
            response: { text: () => 'I cannot determine the topics.' },
        });

        const res = await request(app)
            .post("/ai/suggest-topics")
            .set("Authorization", "Bearer " + loginUser.token)
            .send({ title: "My Post", content: "Content.", topics: [] });

        expect(res.statusCode).toBe(200);
        expect(res.body.topicIds).toEqual([]);
    });

    test("401 without auth", async () => {
        const res = await request(app)
            .post("/ai/suggest-topics")
            .send({ title: "My Post", content: "Content.", topics: [] });
        expect(res.statusCode).toBe(401);
    });
});
