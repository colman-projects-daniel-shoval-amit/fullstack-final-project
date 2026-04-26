import { Request, Response } from 'express';
import { geminiModel as model } from '../lib/gemini';

class AiController {
    async assist(req: Request, res: Response) {
        const { title, content, instruction } = req.body as {
            title: string;
            content: string;
            instruction: 'improve' | 'continue' | 'outline';
        };

        const prompts: Record<string, string> = {
            improve: `You are editing a blog post written in Markdown. Rewrite the content to be clearer and more engaging. Preserve and improve the existing Markdown formatting — use headings (##, ###), **bold**, *italic*, bullet lists, and code blocks where appropriate. Return only the improved Markdown content, no preamble:\n\n${content}`,
            continue: `You are continuing a blog post written in Markdown. Write 1-2 natural follow-up paragraphs that flow from the existing content. Use Markdown formatting — headings, **bold**, *italic*, lists — where it fits the style of the post. Return only the new continuation text in Markdown, no preamble:\n\nTitle: ${title}\n\n${content}`,
            outline: `Generate a detailed structured outline for a blog post with this title: "${title}". Use Markdown formatting: ## for main sections, ### for subsections, and bullet points for key ideas under each section. Return only the Markdown outline, no preamble.`,
        };

        const prompt = prompts[instruction];
        if (!prompt) return res.status(400).json({ error: 'Invalid instruction' });

        try {
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            res.json({ result: text });
        } catch {
            res.status(500).json({ error: 'AI request failed' });
        }
    }

    async summarize(req: Request, res: Response) {
        const { title, content } = req.body as { title: string; content: string };

        const prompt = `Summarize this blog post in 2-3 sentences. Be concise and informative. Return only the summary:\n\nTitle: ${title}\n\n${content}`;

        try {
            const result = await model.generateContent(prompt);
            const summary = result.response.text();
            res.json({ summary });
        } catch {
            res.status(500).json({ error: 'AI request failed' });
        }
    }

    async suggestTopics(req: Request, res: Response) {
        const { title, content, topics } = req.body as {
            title: string;
            content: string;
            topics: { _id: string; name: string }[];
        };

        const topicNames = topics.map(t => t.name);
        const prompt = `Given this blog post, select the most relevant topics from the provided list. Return ONLY a JSON array of the matching topic names, nothing else.\n\nPost title: ${title}\n\nPost content: ${content.slice(0, 2000)}\n\nAvailable topics: ${topicNames.join(', ')}`;

        try {
            const result = await model.generateContent(prompt);
            const raw = result.response.text().trim();
            const jsonMatch = raw.match(/\[[\s\S]*\]/);
            if (!jsonMatch) return res.json({ topicIds: [] });

            const suggestedNames: string[] = JSON.parse(jsonMatch[0]);
            const lowerNames = suggestedNames.map(n => n.toLowerCase());
            const topicIds = topics
                .filter(t => lowerNames.includes(t.name.toLowerCase()))
                .map(t => t._id);

            res.json({ topicIds });
        } catch {
            res.status(500).json({ error: 'AI request failed' });
        }
    }
}

export default new AiController();
