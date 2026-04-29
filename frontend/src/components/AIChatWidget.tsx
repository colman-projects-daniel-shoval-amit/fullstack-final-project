import React, { useState, useRef, useEffect } from "react";
import { aiChatService } from '@/services/aiChatService';
import ReactMarkdown from "react-markdown";
import { MessageSquare, X, Send } from "lucide-react";

const AIChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<
    { role: "user" | "bot"; text: string }[]
  >([]);
  const [input, setInput] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
  
    const userMessage = { role: "user" as const, text: input };
  
    setMessages((prev) => [...prev, userMessage]);
  
    const question = input;
    setInput("");
  
    setMessages((prev) => [
      ...prev,
      { role: "bot", text: "Thinking..." },
    ]);
  
    try {
      const answer = await aiChatService.ask(question);
  
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "bot",
          text: answer || "No answer found.",
        };
        return updated;
      });
  
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "bot",
          text: "Something went wrong.",
        };
        return updated;
      });
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center transition-colors"
      >
        {open ? <X size={22} /> : <MessageSquare size={22} />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-80 h-[420px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white">
            <span className="font-semibold text-sm">Ask Me Anything</span>
            <button onClick={() => setOpen(false)} className="hover:opacity-75 transition-opacity">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2 bg-gray-50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "self-end bg-blue-600 text-white rounded-br-sm"
                    : "self-start bg-white text-gray-800 border border-gray-200 rounded-bl-sm"
                }`}
              >
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex items-center border-t border-gray-200 bg-white px-2 py-2 gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask something..."
              className="flex-1 text-sm px-3 py-2 rounded-full border border-gray-200 outline-none focus:border-blue-400 transition-colors"
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />
            <button
              onClick={sendMessage}
              className="w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors shrink-0"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatWidget;