import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const WEBHOOK_URL = "https://maryamfaiz.app.n8n.cloud/webhook/Mychatapp";

const TypingIndicator = () => (
  <div className="flex items-center gap-1 px-4 py-3">
    <div className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
    <div className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
    <div className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
  </div>
);

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          timestamp: new Date().toISOString(),
        }),
      });

      let assistantContent = "I received your message. How else can I assist you?";
      
      if (response.ok) {
        const data = await response.text();
        if (data) {
          try {
            const jsonData = JSON.parse(data);
            assistantContent = jsonData.response || jsonData.message || jsonData.output || data;
          } catch {
            assistantContent = data;
          }
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: assistantContent,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I'm having trouble connecting right now. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto chat-scrollbar">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4">
            <h1 className="mb-8 text-center text-3xl font-medium text-foreground md:text-4xl">
              How can I help you today?
              <br />
              <span className="text-muted-foreground">
                I am a Start Genius Assistant.
              </span>
            </h1>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl px-4 py-8">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-6 animate-fade-in-up ${
                  message.role === "user" ? "flex justify-end" : ""
                }`}
              >
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-secondary text-foreground max-w-[85%]"
                      : "text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="mb-6 animate-fade-in-up">
                <TypingIndicator />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-background px-4 py-4">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-3xl items-end gap-3"
        >
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                adjustTextareaHeight();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything"
              rows={1}
              className="w-full resize-none rounded-2xl bg-input px-4 py-3 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute bottom-2 right-2 rounded-full bg-primary p-2 text-primary-foreground transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Start Genius can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
