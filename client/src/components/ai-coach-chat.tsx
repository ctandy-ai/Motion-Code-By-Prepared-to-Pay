import { useState } from "react";
import { Bot, Send, X, Minimize2, Maximize2, AlertCircle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

interface PendingAction {
  id: string;
  type: string;
  description: string;
  details: Record<string, unknown>;
  athleteId?: string;
  programId?: string;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  pendingActions?: PendingAction[];
}

export function AICoachChat({ athleteId }: { athleteId?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi! I\'m your AI coaching assistant. I have full access to your athlete roster, programs, and wellness data. I can help you:\n\n• Analyze athlete performance and wellness trends\n• Add exercises to programs\n• Adjust training volume based on readiness\n• Apply your coaching rules automatically\n\nWhat can I help you with today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const { toast } = useToast();

  const chatMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const res = await apiRequest('POST', '/api/ai/chat', { 
        messages: [...messages, { role: 'user', content: userMessage }], 
        athleteId 
      });
      return await res.json();
    },
    onSuccess: (data: { message: string; pendingActions?: PendingAction[] }) => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.message,
        pendingActions: data.pendingActions 
      }]);
      if (data.pendingActions && data.pendingActions.length > 0) {
        setPendingActions(data.pendingActions);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive"
      });
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (actionId: string) => {
      const res = await apiRequest('POST', `/api/ai/pending-actions/${actionId}/approve`);
      return await res.json();
    },
    onSuccess: (data: { success: boolean; message: string }, actionId: string) => {
      setPendingActions(prev => 
        prev.map(a => a.id === actionId ? { ...a, status: 'approved' as const } : a)
      );
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.success 
          ? `Action executed successfully: ${data.message}`
          : `Action could not be completed: ${data.message}`
      }]);
      toast({ 
        title: data.success ? "Action executed" : "Action failed",
        description: data.message,
        variant: data.success ? "default" : "destructive"
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to execute action", variant: "destructive" });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (actionId: string) => {
      const res = await apiRequest('POST', `/api/ai/pending-actions/${actionId}/reject`);
      return await res.json();
    },
    onSuccess: (_data, actionId: string) => {
      setPendingActions(prev => 
        prev.map(a => a.id === actionId ? { ...a, status: 'rejected' as const } : a)
      );
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `No problem! I've cancelled that action. Let me know if you'd like to try something different.`
      }]);
    }
  });

  const handleApproveAction = (actionId: string) => {
    approveMutation.mutate(actionId);
  };

  const handleRejectAction = (actionId: string) => {
    rejectMutation.mutate(actionId);
  };

  const handleApproveAll = async () => {
    for (const action of activePendingActions) {
      await approveMutation.mutateAsync(action.id);
    }
    toast({ title: "All actions processed", description: `${activePendingActions.length} actions executed` });
  };

  const handleRejectAll = async () => {
    for (const action of activePendingActions) {
      await rejectMutation.mutateAsync(action.id);
    }
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `All actions cancelled. What would you like to do instead?`
    }]);
  };

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setPendingActions([]);
    chatMutation.mutate(userMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const activePendingActions = pendingActions.filter(a => a.status === 'pending');

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
      <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-md">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-100">MotionCode AI Coach</h3>
            <div className="chip text-[10px] px-2 py-0.5">Full Context Enabled</div>
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
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ height: 'calc(600px - 140px)' }}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                data-testid={`message-${message.role}-${index}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-brand-600 text-white'
                      : 'ringify bg-white/5'
                  }`}
                >
                  <p className={`text-sm whitespace-pre-wrap ${message.role === 'assistant' ? 'text-slate-200' : ''}`}>
                    {message.content}
                  </p>
                </div>
              </div>
            ))}
            
            {activePendingActions.length > 0 && (
              <div className="space-y-3 p-3 rounded-xl ringify bg-amber-900/20 border border-amber-500/30">
                <p className="text-xs font-medium text-amber-400">Pending Actions - Your Approval Required:</p>
                {activePendingActions.map((action) => (
                  <div 
                    key={action.id} 
                    className="p-3 rounded-lg bg-white/5 space-y-2"
                    data-testid={`pending-action-${action.id}`}
                  >
                    <p className="text-sm text-slate-200">{action.description}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveAction(action.id)}
                        className="gap-1 bg-emerald-600 hover:bg-emerald-500"
                        data-testid={`button-approve-${action.id}`}
                      >
                        <CheckCircle className="h-3 w-3" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectAction(action.id)}
                        className="gap-1"
                        data-testid={`button-reject-${action.id}`}
                      >
                        <XCircle className="h-3 w-3" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
                {activePendingActions.length > 1 && (
                  <div className="flex gap-2 pt-2 border-t border-white/10">
                    <Button
                      size="sm"
                      onClick={handleApproveAll}
                      className="gap-1 bg-emerald-600 hover:bg-emerald-500"
                      data-testid="button-approve-all"
                    >
                      <CheckCircle className="h-3 w-3" />
                      Approve All ({activePendingActions.length})
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRejectAll}
                      className="gap-1"
                      data-testid="button-reject-all"
                    >
                      <XCircle className="h-3 w-3" />
                      Reject All
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="ringify bg-white/5 rounded-2xl px-4 py-2 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
                  <span className="text-xs text-slate-400">Analyzing context...</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-white/10 shrink-0">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Try: 'Add mobility work to John's program daily'"
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
