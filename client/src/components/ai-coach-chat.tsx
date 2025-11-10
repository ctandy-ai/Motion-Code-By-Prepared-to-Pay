import { useState } from "react";
import { Bot, Send, X, Minimize2, Maximize2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AICoachChat({ athleteId }: { athleteId?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi! I\'m your AI coaching assistant. I can help with program design, exercise progressions, and performance analysis. What can I help you with today?'
    }
  ]);
  const [input, setInput] = useState('');
  const { toast } = useToast();

  const chatMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const res = await apiRequest('POST', '/api/ai/chat', { 
        messages: [...messages, { role: 'user', content: userMessage }], 
        athleteId 
      });
      return await res.json();
    },
    onSuccess: (data: any) => {
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    chatMutation.mutate(userMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-glow bg-brand-600 hover:bg-brand-500 hover:scale-110 transition-all z-50 flex items-center justify-center"
        data-testid="button-open-ai-chat"
      >
        <Bot className="h-8 w-8 text-white" />
      </button>
    );
  }

  return (
    <div 
      className={`fixed bottom-6 right-6 w-96 bglass shadow-glass rounded-2xl transition-all duration-300 z-50 flex flex-col ${
        isMinimized ? 'h-16' : 'h-[600px]'
      }`}
      data-testid="card-ai-chat"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-md">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-100">MotionCode AI Coach</h3>
            <div className="chip text-[10px] px-2 py-0.5">Powered by GPT-4.1</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
            data-testid="button-minimize-chat"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
            data-testid="button-close-chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: 'calc(600px - 140px)' }}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                data-testid={`message-${message.role}-${index}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-brand-600 text-white'
                      : 'ringify bg-white/5'
                  }`}
                >
                  <p className={`text-sm whitespace-pre-wrap ${message.role === 'assistant' ? 'text-slate-200' : ''}`}>{message.content}</p>
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="ringify bg-white/5 rounded-2xl px-4 py-2">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" />
                    <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="h-2 w-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/10 shrink-0">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                disabled={chatMutation.isPending}
                data-testid="input-chat-message"
                className="flex-1"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || chatMutation.isPending}
                className="btn btn-pri h-9 w-9 flex items-center justify-center disabled:opacity-50"
                data-testid="button-send-message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-start gap-2 mt-2 text-xs text-slate-500">
              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <p>For medical concerns, consult a healthcare professional</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
