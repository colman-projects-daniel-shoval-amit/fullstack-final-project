import request from "supertest";
import initApp from "../server";
import mongoose from "mongoose";
import { Express } from "express";
import userModel from "../models/userModel";
import { describe, expect, test, beforeAll, afterAll, jest } from '@jest/globals';
import { getLogedInUser, UserData, userData1, userData2 } from "./utils";

jest.setTimeout(30000);

let app: Express;
let loginUser: UserData;
let otherUser: UserData;
let plainUserId: string; // a user NOT logged in via getLogedInUser

beforeAll(async () => {
    app = await initApp();
    await userModel.deleteMany();
    loginUser = await getLogedInUser(userData1, app);
    otherUser = await getLogedInUser(userData2, app);

    // Create a plain user (no token needed — just an ID to target)
    const plain = await userModel.create({ email: "plain@example.com", password: "plainpass" });
    plainUserId = plain._id.toString();
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
});

// ---------------------------------------------------------------------------
// GET /users  (pre-existing, kept)
// ---------------------------------------------------------------------------
describe("GET /users", () => {
    test("returns all users with auth", async () => {
        const res = await request(app).get("/users").set("Authorization", "Bearer " + loginUser.token);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBeTruthy();
        expect(res.body.length).toBeGreaterThan(0);
    });

    test("401 without auth", async () => {
        const res = await request(app).get("/users");
        expect(res.statusCode).toBe(401);
    });
});

// ---------------------------------------------------------------------------
// GET /users/me
// ---------------------------------------------------------------------------
describe("GET /users/me", () => {
    test("returns authenticated user's profile", async () => {
        const res = await request(app)
            .get("/users/me")
            .set("Authorization", "Bearer " + loginUser.token);
        expect(res.statusCode).toBe(200);
        expect(res.body.email).toBe(loginUser.email);
        expect(res.body._id).toBe(loginUser._id);
        expect(Array.isArray(res.body.interests)).toBeTruthy();
        expect(Array.isArray(res.body.following)).toBeTruthy();
        expect(Array.isArray(res.body.followers)).toBeTruthy();
    });

    test("401 without auth", async () => {
        const res = await request(app).get("/users/me");
        expect(res.statusCode).toBe(401);
    });
});

// ---------------------------------------------------------------------------
// PATCH /users/me  (update interests)
// ---------------------------------------------------------------------------
describe("PATCH /users/me", () => {
    test("updates interests array", async () => {
        const res = await request(app)
            .patch("/users/me")
            .set("Authorization", "Bearer " + loginUser.token)
            .send({ interests: [] });
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.interests)).toBeTruthy();
    });

    test("401 without auth", async () => {
        const res = await request(app).patch("/users/me").send({ interests: [] });
        expect(res.statusCode).toBe(401);
    });
});

// ---------------------------------------------------------------------------
// PATCH /users/me/password
// ---------------------------------------------------------------------------
describe("PATCH /users/me/password", () => {
    test("400 when fields are missing", async () => {
        const res = await request(app)
            .patch("/users/me/password")
            .set("Authorization", "Bearer " + loginUser.token)
            .send({ currentPassword: "testpass" }); // missing newPassword
        expect(res.statusCode).toBe(400);
    });

    test("400 when current password is wrong", async () => {
        const res = await request(app)
            .patch("/users/me/password")
            .set("Authorization", "Bearer " + loginUser.token)
            .send({ currentPassword: "wrongpassword", newPassword: "newpass123" });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/incorrect/i);
    });

    test("200 when current password is correct", async () => {
        const res = await request(app)
            .patch("/users/me/password")
            .set("Authorization", "Bearer " + loginUser.token)
            .send({ currentPassword: userData1.password, newPassword: "newpass456" });
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe("Password updated");
    });

    test("401 without auth", async () => {
        const res = await request(app)
            .patch("/users/me/password")
            .send({ currentPassword: "a", newPassword: "b" });
        expect(res.statusCode).toBe(401);
    });
});

// ---------------------------------------------------------------------------
// GET /users/recommended
// ---------------------------------------------------------------------------
describe("GET /users/recommended", () => {
    test("returns an array (possibly empty)", async () => {
        const res = await request(app)
            .get("/users/recommended")
            .set("Authorization", "Bearer " + loginUser.token);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBeTruthy();
    });

    test("401 without auth", async () => {
        const res = await request(app).get("/users/recommended");
        expect(res.statusCode).toBe(401);
    });
});

// ---------------------------------------------------------------------------
// POST /users/:id/follow
// ---------------------------------------------------------------------------
describe("POST /users/:id/follow", () => {
    test("follows another user successfully", async () => {
        const res = await request(app)
            .post(`/users/${otherUser._id}/follow`)
            .set("Authorization", "Bearer " + loginUser.token);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe("Followed");
    });

    test("400 when trying to follow yourself", async () => {
        const res = await request(app)
            .post(`/users/${loginUser._id}/follow`)
            .set("Authorization", "Bearer " + loginUser.token);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/yourself/i);
    });

    test("404 when target user does not exist", async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .post(`/users/${fakeId}/follow`)
            .set("Authorization", "Bearer " + loginUser.token);
        expect(res.statusCode).toBe(404);
    });

    test("401 without auth", async () => {
        const res = await request(app).post(`/users/${otherUser._id}/follow`);
        expect(res.statusCode).toBe(401);
    });

    test("following list is updated on the caller", async () => {
        const res = await request(app)
            .get("/users/me")
            .set("Authorization", "Bearer " + loginUser.token);
        const followingIds = res.body.following.map((u: { _id: string }) => u._id);
        expect(followingIds).toContain(otherUser._id);
    });

    test("followers list is updated on the target", async () => {
        const res = await request(app)
            .get(`/users/${otherUser._id}`)
            .set("Authorization", "Bearer " + loginUser.token);
        const followerIds = res.body.followers ?? [];
        expect(followerIds.some((u: any) => (u._id ?? u) === loginUser._id)).toBeTruthy();
    });
});

// ---------------------------------------------------------------------------
// DELETE /users/:id/follow  (unfollow)
// ---------------------------------------------------------------------------
describe("DELETE /users/:id/follow", () => {
    test("unfollows a user successfully", async () => {
        const res = await request(app)
            .delete(`/users/${otherUser._id}/follow`)
            .set("Authorization", "Bearer " + loginUser.token);
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe("Unfollowed");
    });

    test("following list no longer contains unfollowed user", async () => {
        const res = await request(app)
            .get("/users/me")
            .set("Authorization", "Bearer " + loginUser.token);
        const followingIds = res.body.following.map((u: { _id: string }) => u._id);
        expect(followingIds).not.toContain(otherUser._id);
    });

    test("401 without auth", async () => {
        const res = await request(app).delete(`/users/${otherUser._id}/follow`);
        expect(res.statusCode).toBe(401);
    });
});

// ---------------------------------------------------------------------------
// GET /users/:id  (pre-existing)
// ---------------------------------------------------------------------------
describe("GET /users/:id", () => {
    test("returns user by ID", async () => {
        const res = await request(app)
            .get(`/users/${plainUserId}`)
            .set("Authorization", "Bearer " + loginUser.token);
        expect(res.statusCode).toBe(200);
        expect(res.body._id).toBe(plainUserId);
    });

    test("400 for invalid ID format", async () => {
        const res = await request(app)
            .get("/users/invalid-id-format")
            .set("Authorization", "Bearer " + loginUser.token);
        expect(res.statusCode).toBe(400);
    });

    test("404 for non-existent ID", async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .get(`/users/${fakeId}`)
            .set("Authorization", "Bearer " + loginUser.token);
        expect(res.statusCode).toBe(404);
    });
});

// ---------------------------------------------------------------------------
// DELETE /users/:id  (pre-existing)
// ---------------------------------------------------------------------------
describe("DELETE /users/:id", () => {
    test("400 for invalid ID", async () => {
        const res = await request(app)
            .delete("/users/invalid-id")
            .set("Authorization", "Bearer " + loginUser.token);
        expect(res.statusCode).toBe(400);
    });

    test("404 for non-existent ID", async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
            .delete(`/users/${fakeId}`)
            .set("Authorization", "Bearer " + loginUser.token);
        expect(res.statusCode).toBe(404);
    });

    test("deletes user successfully", async () => {
        const res = await request(app)
            .delete(`/users/${plainUserId}`)
            .set("Authorization", "Bearer " + loginUser.token);
        expect(res.statusCode).toBe(200);
        expect(await userModel.findById(plainUserId)).toBeNull();
    });
});
