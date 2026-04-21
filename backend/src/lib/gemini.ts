import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/config';

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
