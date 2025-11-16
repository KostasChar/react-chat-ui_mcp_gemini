import { useState, useRef, useEffect } from "react";
import { Send, Menu, Plus, Sparkles, MessageSquare } from "lucide-react";

// Simple hash function for query normalization
const hashQuery = (query) => {
  let hash = 0;
  for (let i = 0; i < query.length; i++) {
    hash = (hash << 5) - hash + query.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
};

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // NEW — Provider selection
  const [provider, setProvider] = useState("gemini");

  const messagesEndRef = useRef(null);
  const evtRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const activeQueriesRef = useRef({});

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const cleanupStream = (key, messageId, errorMsg = null) => {
    evtRef.current?.close();
    evtRef.current = null;
    isSubmittingRef.current = false;
    delete activeQueriesRef.current[key];
    setIsLoading(false);

    if (errorMsg) {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, content: errorMsg } : msg
        )
      );
    }
  };

  // NEW – Provider → endpoint mapping
  const PROVIDER_ENDPOINTS = {
    gemini: "http://localhost:9013/gemini-mcp/stream?query=",
    groq: "http://localhost:9013/groq-mcp/stream?query=",
    openai: "http://localhost:9013/openai-mcp/stream?query=",
    anthropic: "http://localhost:9013/anthropic-mcp/stream?query="
  };

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || isSubmittingRef.current) return;

    const key = hashQuery(trimmed);
    if (activeQueriesRef.current[key]) return;

    evtRef.current?.close();
    isSubmittingRef.current = true;
    activeQueriesRef.current[key] = true;

    const messageId = `msg-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      { role: "user", content: trimmed, id: `${messageId}-user` },
      { role: "assistant", content: "", id: messageId }
    ]);

    setInput("");
    setIsLoading(true);

    // NEW — Dynamic provider-based URL
    const endpoint = PROVIDER_ENDPOINTS[provider] || PROVIDER_ENDPOINTS["gemini"];
    const url = `${endpoint}${encodeURIComponent(trimmed)}`;

    const evtSource = new EventSource(url);
    evtRef.current = evtSource;

    evtSource.addEventListener("message", (e) => {
      try {
        const { chunk } = JSON.parse(e.data);
        if (!chunk) return;
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId ? { ...msg, content: msg.content + chunk } : msg
          )
        );
      } catch {
        console.warn("Bad SSE message:", e.data);
      }
    });

    evtSource.addEventListener("ping", () => {
      console.debug("🔄 heartbeat");
    });

    evtSource.addEventListener("complete", () => {
      cleanupStream(key, messageId);
    });

    evtSource.addEventListener("error", (e) => {
      console.error("❌ SSE error", e);
      cleanupStream(key, messageId, "⚠️ Connection dropped — try again.");
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const newChat = () => {
    evtRef.current?.close();
    evtRef.current = null;
    setMessages([]);
    setInput("");
    activeQueriesRef.current = {};
    isSubmittingRef.current = false;
    setIsLoading(false);
  };

  return (
    <div className="flex h-screen bg-white text-gray-900">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden`}>
        <div className="p-4 border-b border-gray-200">
          <button onClick={newChat} className="w-full flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <Plus size={18} />
            <span>New chat</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <div className="text-xs text-gray-500 px-3 py-2 font-semibold">Recent</div>
          {messages.length > 0 && (
            <div className="px-2 py-2 hover:bg-gray-100 rounded-lg cursor-pointer flex items-center gap-2">
              <MessageSquare size={16} />
              <span className="text-sm truncate">Current conversation</span>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-200 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <Sparkles size={16} className="text-white"/>
          </div>
          <div className="text-sm">
            <div className="font-medium">MCP Chat</div>
            <div className="text-gray-500 text-xs">AI Assistant</div>
          </div>
        </div>
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-200 p-4 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-semibold">MCP Chat</h1>

          {/* NEW — LLM Provider Selector */}
          <div className="flex items-center gap-2 ml-auto">
            <label className="text-sm text-gray-600">Provider:</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none"
            >
              <option value="gemini">Gemini</option>
              <option value="groq">Groq</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </select>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-8 max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-6">
                <Sparkles size={32} className="text-white"/>
              </div>
              <h2 className="text-3xl font-semibold mb-3">How can I help you today?</h2>
              <p className="text-gray-500 text-center max-w-md">Ask me anything.</p>
            </div>
          ) : (
            <>
              {messages.map(msg => (
                <div key={msg.id} className={`mb-8 flex gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <Sparkles size={16} className="text-gray-600"/>
                    </div>
                  )}
                  <div className={`flex-1 ${msg.role === 'user' ? 'max-w-xl' : ''}`}>
                    <div className={`${msg.role === 'user' ? 'bg-blue-100 text-blue-900 ml-auto px-4 py-3 rounded-2xl max-w-fit' : 'bg-gray-100 text-gray-900 px-4 py-3 rounded-2xl whitespace-pre-wrap'}`}>
                      {msg.content}
                    </div>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-semibold">You</span>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="mb-8 flex gap-4">
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse flex items-center justify-center flex-shrink-0">
                    <Sparkles size={16} className="text-gray-600"/>
                  </div>
                  <div className="text-gray-400 animate-pulse">...</div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-4">
          <div className="max-w-3xl mx-auto relative flex items-center bg-gray-100 rounded-3xl shadow-sm">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${provider}...`}
              disabled={isLoading}
              className="flex-1 bg-transparent px-6 py-4 pr-12 focus:outline-none placeholder-gray-500 disabled:opacity-50 text-gray-900"
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim()}
              className="absolute right-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">May make mistakes — verify important info.</p>
        </div>
      </div>
    </div>
  );
}
