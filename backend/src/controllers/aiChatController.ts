import { Request, Response } from "express";
import PostChunkModel from "../models/postChunkModel";
import { getEmbedding,generateAnswer } from "../services/embeddingService";

// 🔹 cosine similarity
function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

class AIChatController {
  async ask(req: Request, res: Response): Promise<void> {
    const { question } = req.body;

    if (!question || typeof question !== "string") {
      res.status(400).json({ error: "Question is required" });
      return;
    }

    try {
      // 1. embed question
      const queryEmbedding = await getEmbedding(question);

      // 2. fetch chunks (limit for performance)
      const chunks = await PostChunkModel.find().limit(200);

      if (!chunks.length) {
        res.json({ answer: "No content available to answer from." });
        return;
      }

      // 3. score chunks
      const scored = chunks.map((chunk) => ({
        content: chunk.content,
        score: cosineSimilarity(queryEmbedding, chunk.embedding),
      }));

      // 4. sort by similarity
      scored.sort((a, b) => b.score - a.score);

      // 5. filter weak matches (important)
      const topChunks = scored
        .filter((c) => c.score > 0.6) // threshold tweakable
        .slice(0, 5);

      if (!topChunks.length) {
        res.json({
          answer: "I don't know based on the available articles.",
        });
        return;
      }

      const context = topChunks
        .map((c) => c.content)
        .join("\n")
        .slice(0, 4000); // prevent token overflow

      const answer = await generateAnswer(question, context);

      res.json({ answer });
      return;

    } catch (error: any) {
      console.error("❌ AI Error:", error);

      res.status(500).json({
        error: error?.message || "AI processing failed",
      });
      return;
    }
  }
}

export default new AIChatController();