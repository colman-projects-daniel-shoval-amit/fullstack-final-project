import { Request, Response } from "express";
import PostChunkModel from "../models/postChunkModel";
import { getEmbedding,generateAnswer } from "../services/embeddingService";
import PostModel from "../models/postModel";

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
  
    // if no question or is not string
    if (!question || typeof question !== "string") {
      res.status(400).json({ error: "Question is required" });
      return;
    }
  
    try {
      // turn the question into numbers (embedding), so mongo can compare it with the chunks
      const queryEmbedding = await getEmbedding(question);
  
      // go to mongo and find the chunks that most similar to question
      // shoval say do it inside mongo is better but am not sure the version will match so thats the next best thing
      const chunks = await PostChunkModel.aggregate([
        {

          // for every chunk in database, calculate how similar it is to our question
          $addFields: {
            score: {
              // run this function inside mongo itself not in TS
              $function: {
                body: `function(a, b) {
                  // these three variable hold the math we need for cosine similarity
                  let dot = 0, magA = 0, magB = 0;
                  // go through every number in the embedding arrays
                  for (let i = 0; i < a.length; i++) {
                    dot += a[i] * b[i];   // multiply matching numbers together
                    magA += a[i] * a[i];  // square each number from chunk
                    magB += b[i] * b[i];  // square each number from question
                  }
                  // this give us number between 0 and 1, closer to 1 mean more similar
                  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
                }`,

                // pass the chunk embedding and question embedding into the function
                args: ["$embedding", queryEmbedding],
                lang: "js"
              }
            }
          }
        },

        { $match: { score: { $gt: 0.55 } } },
        { $sort: { score: -1 } },

        // group by post, take the highest scoring chunk as the representative score for that post
        // since want 5 posts not 5 chunks, one post can have many chunks
        {
          $group: {
            _id: "$postId",
            bestScore: { $max: "$score" }, // take the best chunk score to represent the whole post score
          }
        },
        { $sort: { bestScore: -1 } },
        { $limit: 5 },
        {
          // now go fetch the actual post data for each post we found
          $lookup: {
            from: "posts",  
            localField: "_id",
            foreignField: "_id", 
            as: "post"         
          }
        },

        // lookup give us array but we want object so this flatten it
        { $unwind: "$post" }
      ]);
  
      if (!chunks.length) {
        res.json({ answer: "I don't know based on the available articles." });
        return;
      }
  
      // take the post title and text from each result and glue them together
      // slice at 4000 so we dont send too much to the AI
      const context = chunks
        .map((c) => `Title: ${c.post.title}\n${c.post.text}`)
        .join("\n\n---\n\n")
        .slice(0, 4000);
  
      // send the question and the context to AI and get back the answer
      const answer = await generateAnswer(question, context);
      res.json({ answer });
  
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "AI processing failed" });
    }
  }
}

export default new AIChatController();