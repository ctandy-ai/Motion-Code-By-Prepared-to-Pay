import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/page-header";
import {
  MessageSquare,
  Send,
  Users,
  Search,
  Megaphone,
  Check,
  CheckCheck,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Message, Athlete } from "@shared/schema";
import { format } from "date-fns";

interface MessageThread {
  athleteId: string;
  athleteName: string;
  team: string | null;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  messages: Message[];
}

export default function CoachMessages() {
  const { toast } = useToast();
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [selectedForBroadcast, setSelectedForBroadcast] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: athletes } = useQuery<Athlete[]>({
    queryKey: ["/api/athletes"],
  });

  const { data: allMessages, isLoading: loadingMessages } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    refetchInterval: 10000,
  });

  const sendMutation = useMutation({
    mutationFn: async ({ athleteId, content }: { athleteId: string; content: string }) => {
      return apiRequest("POST", `/api/messages/athlete/${athleteId}`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setNewMessage("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send message.", variant: "destructive" });
    },
  });

  const broadcastMutation = useMutation({
    mutationFn: async ({ athleteIds, content }: { athleteIds: string[]; content: string }) => {
      return apiRequest("POST", "/api/messages/broadcast", { athleteIds, content });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setBroadcastMessage("");
      setSelectedForBroadcast([]);
      setBroadcastOpen(false);
      toast({
        title: "Broadcast Sent",
        description: `Message sent to ${data.sent} athletes.`,
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to broadcast message.", variant: "destructive" });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedThread, allMessages]);

  const threads: MessageThread[] = athletes
    ?.map((athlete) => {
      const athleteMessages = allMessages?.filter((m) => m.athleteId === athlete.id) || [];
      const sortedMessages = [...athleteMessages].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      const lastMsg = sortedMessages[0];
      const unreadCount = athleteMessages.filter(
        (m) => m.senderType === "athlete" && m.isRead === 0
      ).length;

      return {
        athleteId: athlete.id,
        athleteName: athlete.name,
        team: athlete.team,
        lastMessage: lastMsg?.content || "No messages yet",
        lastMessageTime: lastMsg?.createdAt ? new Date(lastMsg.createdAt) : new Date(0),
        unreadCount,
        messages: athleteMessages.sort(
          (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        ),
      };
    })
    .filter((t) => {
      if (!searchQuery) return true;
      return t.athleteName.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime()) || [];

  const selectedThreadData = threads.find((t) => t.athleteId === selectedThread);

  const handleSend = () => {
    if (newMessage.trim() && selectedThread) {
      sendMutation.mutate({ athleteId: selectedThread, content: newMessage.trim() });
    }
  };

  const handleBroadcast = () => {
    if (broadcastMessage.trim() && selectedForBroadcast.length > 0) {
      broadcastMutation.mutate({
        athleteIds: selectedForBroadcast,
        content: broadcastMessage.trim(),
      });
    }
  };

  const toggleBroadcastSelection = (athleteId: string) => {
    setSelectedForBroadcast((prev) =>
      prev.includes(athleteId) ? prev.filter((id) => id !== athleteId) : [...prev, athleteId]
    );
  };

  const selectAllForBroadcast = () => {
    if (selectedForBroadcast.length === athletes?.length) {
      setSelectedForBroadcast([]);
    } else {
      setSelectedForBroadcast(athletes?.map((a) => a.id) || []);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messaging Center"
        icon={MessageSquare}
        description="Communicate with your athletes"
        actions={
          <Button onClick={() => setBroadcastOpen(true)} data-testid="button-broadcast">
            <Megaphone className="h-4 w-4 mr-2" />
            Broadcast Message
          </Button>
        }
      />

      <Dialog open={broadcastOpen} onOpenChange={setBroadcastOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Broadcast Message</DialogTitle>
            <DialogDescription>
              Send a message to multiple athletes at once
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">
                {selectedForBroadcast.length} of {athletes?.length || 0} selected
              </span>
              <Button variant="outline" size="sm" onClick={selectAllForBroadcast}>
                {selectedForBroadcast.length === athletes?.length ? "Deselect All" : "Select All"}
              </Button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-3">
              {athletes?.map((athlete) => (
                <label
                  key={athlete.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover-elevate cursor-pointer"
                >
                  <Checkbox
                    checked={selectedForBroadcast.includes(athlete.id)}
                    onCheckedChange={() => toggleBroadcastSelection(athlete.id)}
                  />
                  <span className="text-sm">{athlete.name}</span>
                  {athlete.team && (
                    <Badge variant="outline" className="text-xs">
                      {athlete.team}
                    </Badge>
                  )}
                </label>
              ))}
            </div>
            <Textarea
              placeholder="Type your broadcast message..."
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              rows={4}
              data-testid="input-broadcast-message"
            />
            <Button
              className="w-full"
              onClick={handleBroadcast}
              disabled={
                !broadcastMessage.trim() ||
                selectedForBroadcast.length === 0 ||
                broadcastMutation.isPending
              }
              data-testid="button-send-broadcast"
            >
              <Send className="h-4 w-4 mr-2" />
              Send to {selectedForBroadcast.length} Athletes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 lg:grid-cols-3 h-[calc(100vh-16rem)]">
        <Card className="border-0 lg:col-span-1 flex flex-col">
          <CardHeader className="pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search athletes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-threads"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {loadingMessages ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-slate-700/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : threads.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-slate-600 mb-3" />
                <p className="text-sm text-slate-400">No conversations yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {threads.map((thread) => (
                  <div
                    key={thread.athleteId}
                    className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all hover-elevate ${
                      selectedThread === thread.athleteId
                        ? "bg-brand-600/20 border border-brand-500/30"
                        : "ringify"
                    }`}
                    onClick={() => setSelectedThread(thread.athleteId)}
                    data-testid={`thread-${thread.athleteId}`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-brand-600 text-white">
                        {thread.athleteName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-slate-100 truncate">
                          {thread.athleteName}
                        </span>
                        {thread.unreadCount > 0 && (
                          <Badge className="bg-blue-600 text-[10px] px-1.5 py-0">
                            {thread.unreadCount}
                          </Badge>
                        )}
                      </div>
                      {thread.team && (
                        <span className="text-xs text-slate-500">{thread.team}</span>
                      )}
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {thread.lastMessage}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 lg:col-span-2 flex flex-col">
          {selectedThreadData ? (
            <>
              <CardHeader className="pb-2 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-brand-600 text-white">
                      {selectedThreadData.athleteName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-100">
                      {selectedThreadData.athleteName}
                    </CardTitle>
                    {selectedThreadData.team && (
                      <p className="text-xs text-slate-400">{selectedThreadData.team}</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                {selectedThreadData.messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 mx-auto text-slate-600 mb-3" />
                    <p className="text-sm text-slate-400">No messages yet</p>
                    <p className="text-xs text-slate-500">Start the conversation</p>
                  </div>
                ) : (
                  selectedThreadData.messages.map((message) => {
                    const isCoach = message.senderType === "coach";
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isCoach ? "justify-end" : "justify-start"}`}
                        data-testid={`message-${message.id}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                            isCoach
                              ? "bg-brand-600 text-white rounded-br-sm"
                              : "bg-slate-700 rounded-bl-sm"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div
                            className={`flex items-center gap-1 mt-1 ${
                              isCoach ? "justify-end" : ""
                            }`}
                          >
                            <span
                              className={`text-[10px] ${
                                isCoach ? "text-white/70" : "text-slate-500"
                              }`}
                            >
                              {message.createdAt
                                ? format(new Date(message.createdAt), "h:mm a")
                                : ""}
                            </span>
                            {isCoach && (
                              <span className="text-white/70">
                                {message.isRead ? (
                                  <CheckCheck className="h-3 w-3" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </CardContent>
              <div className="p-4 border-t border-slate-700/50">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    className="flex-1"
                    data-testid="input-message"
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!newMessage.trim() || sendMutation.isPending}
                    data-testid="button-send"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto text-slate-600 mb-4" />
                <h3 className="text-lg font-medium text-slate-300 mb-2">
                  Select a conversation
                </h3>
                <p className="text-sm text-slate-500">
                  Choose an athlete from the list to start messaging
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
