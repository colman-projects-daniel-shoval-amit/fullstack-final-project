import React, { useState, useRef, useEffect } from "react";
import { aiChatService } from '@/services/aiChatService';
import ReactMarkdown from "react-markdown";

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
  
    // add loading message
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
      {/* Floating Button */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          width: 60,
          height: 60,
          borderRadius: "50%",
          backgroundColor: "#007bff",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          fontSize: 24,
          zIndex: 1000,
        }}
      >
        💬
      </div>

      {/* Chat Window */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 90,
            right: 20,
            width: 320,
            height: 400,
            backgroundColor: "white",
            borderRadius: 10,
            boxShadow: "0 0 10px rgba(0,0,0,0.2)",
            display: "flex",
            flexDirection: "column",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              padding: 10,
              backgroundColor: "#007bff",
              color: "white",
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
              fontWeight: "bold",
            }}
          >
            Ask Me Anything
          </div>

          <div
            style={{
              flex: 1,
              padding: 10,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  alignSelf:
                    msg.role === "user" ? "flex-end" : "flex-start",
                  backgroundColor:
                    msg.role === "user" ? "#007bff" : "#eee",
                  color: msg.role === "user" ? "white" : "black",
                  padding: "6px 10px",
                  borderRadius: 8,
                  maxWidth: "80%",
                }}
              >
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          <div
            style={{
              display: "flex",
              borderTop: "1px solid #ddd",
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask something..."
              style={{
                flex: 1,
                border: "none",
                padding: 10,
                outline: "none",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />
            <button
              onClick={sendMessage}
              style={{
                padding: "0 15px",
                border: "none",
                backgroundColor: "#007bff",
                color: "white",
                cursor: "pointer",
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatWidget;