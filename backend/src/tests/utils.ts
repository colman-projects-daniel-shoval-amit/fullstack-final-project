import request from "supertest";
import { Express } from "express";
import mongoose from "mongoose";
import userModel from "../models/userModel";

export const safeDropDatabase = async (connection: typeof mongoose.connection): Promise<void> => {
    const dbName = connection.db?.databaseName ?? '';
    if (!dbName.endsWith('_test')) {
        throw new Error(`Refusing to drop database "${dbName}" — only _test databases are allowed`);
    }
    await connection.dropDatabase();
};

export type UserData = {
    email: string,
    password: string,
    _id: string,
    token: string,
    refreshToken: string
};

export const userData1 = {
    email: "test@test.com",
    password: "testpass",
    _id: "",
    token: "",
    refreshToken: ""
};
export const userData2 = {
    email: "testing@test.com",
    password: "test",
    _id: "",
    token: "",
    refreshToken: ""
};

export const getLogedInUser = async (userData:UserData,app: Express): Promise<UserData> => {
    const email = userData.email;
    const password = userData.password;
    let response = await request(app).post("/auth/register").send(
        { "email": email, "password": password }
    );
    if (response.status !== 201) {
        response = await request(app).post("/auth/login").send(
            { "email": email, "password": password });
    }
    const user = await userModel.findOne({ email: email });

    const logedUser = {
        _id: user?._id.toString() ?? '',
        token: response.body.token,
        refreshToken: response.body.refreshToken,
        email: email,
        password: password
    };
    
    return logedUser;
}
