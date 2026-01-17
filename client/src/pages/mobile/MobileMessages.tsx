import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Message } from "@shared/schema";

export default function MobileMessages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ["/api/mobile/athlete/messages"],
    enabled: !!user,
    refetchInterval: 10000,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", "/api/mobile/athlete/messages", { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mobile/athlete/messages"] });
      setNewMessage("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send message.", variant: "destructive" });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (newMessage.trim()) {
      sendMutation.mutate(newMessage.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </MobileLayout>
    );
  }

  const messageList = messages || [];

  return (
    <MobileLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <header className="sticky top-0 z-40 bg-ink-1/95 backdrop-blur-lg border-b border-ink-3 p-4">
          <div className="flex items-center gap-3">
            <Link href="/m">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/20 text-primary">C</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-semibold">Coach</h1>
              <p className="text-xs text-slate-400">Strength & Conditioning</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messageList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 rounded-full bg-ink-3 flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-slate-500" />
              </div>
              <h2 className="font-semibold mb-1">No messages yet</h2>
              <p className="text-sm text-slate-400">Start a conversation with your coach</p>
            </div>
          ) : (
            messageList.map((message) => {
              const isAthlete = message.senderType === "athlete";
              return (
                <div
                  key={message.id}
                  className={`flex ${isAthlete ? "justify-end" : "justify-start"}`}
                  data-testid={`message-${message.id}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      isAthlete
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-ink-3 rounded-bl-sm"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-[10px] mt-1 ${isAthlete ? "text-primary-foreground/70" : "text-slate-500"}`}>
                      {message.createdAt ? formatTime(new Date(message.createdAt)) : ""}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="sticky bottom-16 bg-ink-1/95 backdrop-blur-lg border-t border-ink-3 p-4 safe-area-pb">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 bg-ink-2 border-0"
              data-testid="input-message"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!newMessage.trim() || sendMutation.isPending}
              data-testid="button-send"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
