import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import { Express } from "express";
import userModel from "../models/userModel";
import postModel from "../models/postModel";
import likeModel from "../models/likeModel";
import { describe, expect, test, beforeAll, afterAll, jest } from '@jest/globals';
import { getLogedInUser, UserData, userData1, userData2, safeDropDatabase } from "./utils";

jest.setTimeout(30000);

let app: Express;
let loginUser1: UserData;
let loginUser2: UserData;
let postId: string;

beforeAll(async () => {
    app = await initApp();
    await userModel.deleteMany();
    await postModel.deleteMany();
    await likeModel.deleteMany();
    loginUser1 = await getLogedInUser(userData1, app);
    loginUser2 = await getLogedInUser(userData2, app);
});

afterAll(async () => {
    await safeDropDatabase(mongoose.connection);
});

describe("Like Tests", () => {

    test("Post Setup: Create Test Post", async () => {
        const response = await request(app)
            .post("/posts")
            .set("Authorization", "Bearer " + loginUser1.token)
            .send({
                title: "Like post",
                text: "Post for Likes",
                image: "like.tests",
                authorId: loginUser1._id,
            });
        expect(response.statusCode).toBe(201);
        postId = response.body._id;
    });

    let likeId: string;

    test("Create Like - Success", async () => {
        const response = await request(app)
            .post("/likes")
            .set("Authorization", "Bearer " + loginUser1.token)
            .send({
                postId: postId
            });
        expect(response.statusCode).toBe(201);
        expect(response.body.userId).toBe(loginUser1._id);
        expect(response.body.postId).toBe(postId);
        likeId = response.body._id;
    });

    test("Create Like - Fail (Already Liked)", async () => {
        const response = await request(app)
            .post("/likes")
            .set("Authorization", "Bearer " + loginUser1.token)
            .send({
                postId: postId
            });
        expect(response.statusCode).toBe(400);
    });

    test("Create Like - Fail (No Auth)", async () => {
        const response = await request(app).post("/likes").send({
            postId: postId,
        });
        expect(response.statusCode).toBe(401);
    });

    test("Create Like - Fail (Post Not Found)", async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const response = await request(app)
            .post("/likes")
            .set("Authorization", "Bearer " + loginUser1.token)
            .send({
                postId: nonExistentId,
            });
        expect(response.statusCode).toBe(404);
    });

    test("Create Like - Fail (Invalid Post ID)", async () => {
        const response = await request(app)
            .post("/likes")
            .set("Authorization", "Bearer " + loginUser1.token)
            .send({
                postId: "invalid-id",
            });
        expect(response.statusCode).toBe(400);
    });

    test("Get All Likes", async () => {
        const response = await request(app).get("/likes").set("Authorization", "Bearer " + loginUser1.token);

        expect(response.statusCode).toBe(200);
        expect(response.body.length).toBeGreaterThan(0);
    });

    test("Get Like By ID - Success", async () => {
        const response = await request(app).get("/likes/" + likeId).set("Authorization", "Bearer " + loginUser1.token);
        expect(response.statusCode).toBe(200);
        expect(response.body._id).toBe(likeId);
    });

    test("Update Like - Fail (Method Not Allowed)", async () => {
        const response = await request(app)
            .put("/likes/" + likeId)
            .set("Authorization", "Bearer " + loginUser1.token)
            .send({});
        expect(response.statusCode).toBe(404);
    });

    test("Delete Like - Fail (Not Owner)", async () => {
        const response = await request(app)
            .delete("/likes/" + likeId)
            .set("Authorization", "Bearer " + loginUser2.token);
        expect(response.statusCode).toBe(403);
    });

    test("Delete Like - Success", async () => {
        const response = await request(app)
            .delete("/likes/" + likeId)
            .set("Authorization", "Bearer " + loginUser1.token);
        expect(response.statusCode).toBe(200);
    });

    test("Delete Like - Fail (Not Found)", async () => {
        const response = await request(app)
            .delete("/likes/" + likeId)
            .set("Authorization", "Bearer " + loginUser1.token);
        expect(response.statusCode).toBe(404);
    });
});
