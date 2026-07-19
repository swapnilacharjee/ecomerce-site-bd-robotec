import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, X, Bot, ShieldAlert, Cpu, Sun, Moon } from "lucide-react";
import { ChatMessage } from "../types";

function getAutoTheme(): "dark" | "light" {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? "light" : "dark";
}

export default function WhatsAppSupportChat() {
  const [theme, setTheme] = useState<"dark" | "light">(getAutoTheme);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-msg",
      sender: "bot",
      text: "Welcome to BD Robotec Support. 🛠️ How can we help you with component datasheets, technical inquiries, order statuses, or wholesale and bulk supply today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Auto scroll to bottom on message update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      // Reconstruct simple history format
      const history = messages
        .filter((m) => m.id !== "init-msg")
        .map((m) => ({
          role: m.sender === "user" ? "user" : "model",
          content: m.text,
        }));

      // Post message to Express API endpoint
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend, history }),
      });

      const data = await response.json();
      
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: data.text || "I apologize, something went wrong. How else can I assist with your robotic schematics?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Failed to query BD Robotec API:", error);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: "bot",
        text: "System communication link interrupted. Please verify server status or contact sales support.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickReply = (text: string) => {
    handleSendMessage(text);
  };

  const quickReplies = [
    "Lidar Sensor Pinout?",
    "Servo Motor stall current?",
    "Bulk discounts?",
    "ESP32 Arduino setup?",
  ];

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 max-w-[calc(100vw-32px)] flex flex-col items-end gap-3">

      {/* Theme Toggle Button */}
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer border"
        style={{
          backgroundColor: theme === "dark" ? "#1f2a3c" : "#f4f4f5",
          borderColor: theme === "dark" ? "#3f3f46" : "#d4d4d8",
          color: theme === "dark" ? "#ffffff" : "#09090b",
        }}
        title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      >
        {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
      
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="whatsapp-pulse w-12 h-12 md:w-14 md:h-14 bg-[#00dbe7] text-[#081425] rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-2xl cursor-pointer"
          title="Open BD Robotec Support Chat"
        >
          {/* Custom high fidelity WhatsApp svg icon or Message icon */}
          <MessageSquare className="w-5.5 h-5.5 md:w-6 md:h-6 fill-current" />
        </button>
      )}

      {/* Floating Chat window */}
      {isOpen && (
        <div className="w-[288px] xs:w-[320px] sm:w-[360px] h-[420px] md:h-[520px] max-w-[calc(100vw-32px)] bg-[#111c2d] border border-[#00dbe7]/35 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="bg-[#1f2a3c] border-b border-[#00dbe7]/20 p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-[#081425] border border-[#00dbe7]/20 rounded-full flex items-center justify-center">
                <Cpu className="w-5 h-5 text-[#00dbe7] animate-pulse" />
              </div>
              <div>
                <p className="text-xs text-white font-bold tracking-wide">
                  BD ROBOTEC SUPPORT
                </p>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 bg-[#c3f400] rounded-full animate-ping" />
                  <span className="text-[10px] text-[#d8e3fb]/60 font-mono">
                    Online // Technical Support
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#d8e3fb]/60 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages Body */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#081425]/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[85%] ${
                  msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                }`}
              >
                {/* Message Bubble */}
                <div
                  className={`p-3 rounded-lg text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.sender === "user"
                      ? "bg-[#0266ff] text-white rounded-br-none"
                      : "bg-[#1f2a3c] text-[#d8e3fb] border border-white/5 rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>
                
                {/* Time badge */}
                <span className="text-[9px] text-[#d8e3fb]/40 font-mono mt-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {/* Simulated AI Typing Indicator */}
            {isTyping && (
              <div className="flex flex-col items-start mr-auto max-w-[80%]">
                <div className="bg-[#1f2a3c] border border-white/5 p-3 rounded-lg rounded-bl-none flex gap-1 items-center">
                  <span className="h-1.5 w-1.5 bg-[#00dbe7] rounded-full animate-bounce delay-75" />
                  <span className="h-1.5 w-1.5 bg-[#00dbe7] rounded-full animate-bounce delay-150" />
                  <span className="h-1.5 w-1.5 bg-[#00dbe7] rounded-full animate-bounce delay-225" />
                </div>
              </div>
            )}
          </div>

          {/* Quick Reply prompts */}
          <div className="p-2 border-t border-white/5 bg-[#081425]/70 flex flex-wrap gap-1.5 shrink-0">
            {quickReplies.map((qr) => (
              <button
                key={qr}
                onClick={() => handleQuickReply(qr)}
                className="px-2 py-1 bg-[#1f2a3c] hover:bg-[#0266ff]/20 hover:border-[#0266ff]/45 text-[10px] text-[#d8e3fb]/70 hover:text-[#00dbe7] border border-white/10 rounded-full transition-all cursor-pointer truncate max-w-[170px]"
              >
                {qr}
              </button>
            ))}
          </div>

          {/* User Input controls */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }}
            className="p-3 bg-[#111c2d] border-t border-white/10 flex gap-2 items-center shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask BD Robotec support..."
              className="flex-1 bg-[#081425] border border-white/10 rounded px-3 py-2 text-xs text-white outline-none focus:border-[#00dbe7] transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2 bg-[#0266ff] disabled:opacity-40 text-white rounded hover:bg-[#0266ff]/85 transition-colors cursor-pointer shrink-0"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </form>

        </div>
      )}

    </div>
  );
}
