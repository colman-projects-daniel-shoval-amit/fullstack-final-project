import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface AuthTokens {
  token: string;
  refreshToken: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthTokens> {
    const { data } = await api.post<AuthTokens>("/auth/register", payload);
    return data;
  },

  async login(payload: LoginPayload): Promise<AuthTokens> {
    const { data } = await api.post<AuthTokens>("/auth/login", payload);
    return data;
  },

  loginWithGoogle(): Promise<AuthTokens> {
    return Promise.reject(new Error("Google sign-in is not yet configured."));
  },

  async logout(refreshToken: string): Promise<void> {
    await api.post("/auth/logout", { refreshToken });
  },

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const { data } = await api.post<AuthTokens>("/auth/refresh", { refreshToken });
    return data;
  },
};
