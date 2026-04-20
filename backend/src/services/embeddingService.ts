import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const embeddingModel = genAI.getGenerativeModel({
  // FIX: Change text-embedding-004 to gemini-embedding-001
  model: "gemini-embedding-001", 
});

const chatModel = genAI.getGenerativeModel({
  // 2026 Best Practice: Use the latest Flash model for speed/cost
  model: "gemini-2.5-flash", 
});

export async function getEmbedding(text: string): Promise<number[]> {
  try {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error("❌ Embedding Error:", error);
    throw new Error("Failed to generate vector representation.");
  }
}

export async function generateAnswer(
  question: string,
  context: string
): Promise<string> {
  try {
    const prompt = `
      SYSTEM INSTRUCTIONS:
      You are an expert research assistant for a Medium-style tech blog. 
      Your goal is to answer the user's question using ONLY the provided context.

      RULES:
      1. If the answer is NOT in the context, strictly state: "I'm sorry, I don't have enough information in my database to answer that."
      2. Do not use outside knowledge.
      3. Use Markdown for formatting (bolding, lists) to make the answer readable.

      CONTEXT FROM DATABASE:
      ---
      ${context}
      ---

      USER QUESTION: 
      ${question}

      ANSWER:
    `;

    const result = await chatModel.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return text || "No response generated.";
  } catch (error) {
    console.error("Chat Generation Error:", error);
    return "I encountered an error while trying to process your question.";
  }
}