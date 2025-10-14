import { useState, useRef, useEffect } from "react";
import { Send, Menu, Plus, MessageSquare, Sparkles } from "lucide-react";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    // Add empty assistant message that will be updated with streaming content
    const assistantMessageIndex = messages.length + 1;
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      console.log('Starting stream request...');
      const res = await fetch("http://localhost:9009/gemini-mcp/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: currentInput }),
        signal: abortControllerRef.current.signal,
      });

      console.log('Response status:', res.status);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('Stream complete');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            
            if (!data) continue;
            
            try {
              const parsed = JSON.parse(data);
              console.log('Parsed chunk:', parsed);
              
              if (parsed.chunk) {
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[assistantMessageIndex] = {
                    role: "assistant",
                    content: newMessages[assistantMessageIndex].content + parsed.chunk
                  };
                  return newMessages;
                });
              } else if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', data, e);
            }
          }
        }
      }
    } catch (err) {
      console.error('Stream error:', err);
      if (err.name !== 'AbortError') {
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[assistantMessageIndex] = {
            role: "assistant",
            content: "Error contacting backend. Please try again."
          };
          return newMessages;
        });
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const newChat = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages([]);
    setInput("");
    setIsLoading(false);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-gray-950 border-r border-gray-800 flex flex-col overflow-hidden`}>
        <div className="p-4 border-b border-gray-800">
          <button 
            onClick={newChat}
            className="w-full flex items-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Plus size={18} />
            <span>New chat</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          <div className="text-xs text-gray-500 px-3 py-2 font-semibold">Recent</div>
          {messages.length > 0 && (
            <div className="px-2 py-2 hover:bg-gray-800 rounded-lg cursor-pointer flex items-center gap-2">
              <MessageSquare size={16} />
              <span className="text-sm truncate">Current conversation</span>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <div className="text-sm">
              <div className="font-medium">MCP + Gemini</div>
              <div className="text-xs text-gray-500">AI Assistant</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-800 p-4 flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-semibold">MCP + Gemini Chat</h1>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6">
                <Sparkles size={32} />
              </div>
              <h2 className="text-3xl font-semibold mb-3">How can I help you today?</h2>
              <p className="text-gray-400 text-center max-w-md">
                Ask me anything. I'm powered by MCP and Gemini to assist you with various tasks.
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-8">
              {messages.map((msg, idx) => (
                <div key={idx} className={`mb-8 flex gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Sparkles size={16} />
                    </div>
                  )}
                  <div className={`flex-1 ${msg.role === 'user' ? 'max-w-xl' : ''}`}>
                    <div className={`${msg.role === 'user' ? 'bg-blue-600 text-white ml-auto px-4 py-3 rounded-2xl max-w-fit' : 'text-gray-100'}`}>
                      <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                    </div>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold">You</span>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="mb-8 flex gap-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles size={16} />
                  </div>
                  <div className="flex gap-1 items-center">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-800 p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-center bg-gray-800 rounded-3xl shadow-lg">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Message MCP + Gemini..."
                disabled={isLoading}
                className="flex-1 bg-transparent px-6 py-4 pr-12 focus:outline-none placeholder-gray-500 disabled:opacity-50"
              />
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-2 bg-white text-gray-900 rounded-full hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              MCP + Gemini can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;