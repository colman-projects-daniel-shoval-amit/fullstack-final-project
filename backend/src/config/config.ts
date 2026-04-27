import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    DATABASE_URL: z.string().min(1).default('mongodb://localhost:27017/finalproj'),
    PORT: z.coerce.number().default(5000),
    JWT_SECRET: z.string().min(1).default('secret'),
    JWT_EXPIRES_IN: z.coerce.number().default(36000),
    REFRESH_TOKEN_EXPIRES_IN: z.coerce.number().default(36000),
    GOOGLE_CLIENT_ID: z.string().default(''),
    GOOGLE_CLIENT_SECRET: z.string().default(''),
    GOOGLE_CALLBACK_URL: z.string().default('http://10.10.246.69:4000/auth/google/callback'),
    FRONTEND_URL: z.string().default('http://10.10.246.69:443'),
    GEMINI_API_KEY: z.string().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('Invalid environment variables:');
    console.error(z.flattenError(parsed.error).fieldErrors);
    process.exit(1);
}

const data = parsed.data;

if (process.env.NODE_ENV === 'test') {
    data.DATABASE_URL = data.DATABASE_URL.replace(
        /(mongodb(?:\+srv)?:\/\/[^/]*\/)([^?#]*)(.*)/,
        (_match, prefix, _dbName, suffix) => `${prefix}finalproj_test${suffix}`
    );
}

export const config = data;