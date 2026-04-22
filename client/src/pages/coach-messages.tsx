import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { TrialBanner } from "@/components/trial-banner";
import { LockedContent } from "@/components/locked-content";
import { useAuth } from "@/hooks/useAuth";
import { useTier } from "@/hooks/useTier";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Send, Users, Search, ChevronRight, Check, CheckCheck, Broadcast } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CoachMessage {
  id: number;
  senderId: string;
  recipientId: string | null;
  subject: string;
  body: string;
  messageType: string;
  isRead: boolean;
  createdAt: string;
  sender?: { firstName: string; lastName: string; email: string };
  recipient?: { firstName: string; lastName: string; email: string };
}

interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

function ComposePane({ onSent }: { onSent: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [recipientId, setRecipientId] = useState("broadcast");

  const { data: athletes = [] } = useQuery<Athlete[]>({
    queryKey: ["/api/athletes"],
    enabled: !!user && user.role === "coach",
  });

  const sendMutation = useMutation({
    mutationFn: (data: any) => {
      if (data.messageType === "broadcast") {
        return apiRequest("POST", "/api/messages/broadcast", { subject: data.subject, body: data.body });
      }
      return apiRequest("POST", `/api/messages/athlete/${data.recipientId}`, { subject: data.subject, body: data.body });
    },
    onSuccess: () => {
      toast({ title: "Message sent", description: recipientId === "broadcast" ? "Broadcast sent to all athletes" : "Message delivered" });
      setSubject(""); setBody(""); setRecipientId("broadcast");
      onSent();
    },
    onError: (err: any) => toast({ title: "Failed to send", description: err.message, variant: "destructive" }),
  });

  function handleSend() {
    if (!body.trim()) return;
    sendMutation.mutate({
      subject: subject || "(No subject)",
      body,
      messageType: recipientId === "broadcast" ? "broadcast" : "direct",
      recipientId: recipientId === "broadcast" ? null : recipientId,
    });
  }

  return (
    <Card className="bg-[#132130] border-[#1A2D3F]">
      <CardHeader className="pb-3">
        <CardTitle className="text-[#EEF2F6] text-base flex items-center gap-2">
          <Send className="w-4 h-4 text-[#FF6432]" />
          New Message
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-[#6A8499] text-xs font-semibold uppercase tracking-wide mb-1 block">To</label>
          <Select value={recipientId} onValueChange={setRecipientId}>
            <SelectTrigger className="bg-[#0A0C12] border-[#1A2D3F] text-[#EEF2F6]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0A0C12] border-[#1A2D3F]">
              <SelectItem value="broadcast">
                <div className="flex items-center gap-2">
                  <Users className="w-3 h-3 text-[#FF6432]" />
                  <span>All Athletes (Broadcast)</span>
                </div>
              </SelectItem>
              {athletes.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.firstName} {a.lastName} — {a.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-[#6A8499] text-xs font-semibold uppercase tracking-wide mb-1 block">Subject</label>
          <Input
            placeholder="e.g. Week 4 load notes"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="bg-[#0A0C12] border-[#1A2D3F] text-[#EEF2F6] placeholder:text-[#6A8499]"
          />
        </div>

        <div>
          <label className="text-[#6A8499] text-xs font-semibold uppercase tracking-wide mb-1 block">Message</label>
          <Textarea
            placeholder="Write your message..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            className="bg-[#0A0C12] border-[#1A2D3F] text-[#EEF2F6] placeholder:text-[#6A8499] resize-none"
          />
        </div>

        <Button
          className="w-full bg-[#FF6432] hover:bg-[#FF7A52] text-white font-bold uppercase tracking-wide"
          onClick={handleSend}
          disabled={!body.trim() || sendMutation.isPending}
        >
          {sendMutation.isPending ? "Sending..." : (
            <>
              <Send className="w-4 h-4 mr-2" />
              {recipientId === "broadcast" ? "Broadcast to All" : "Send Message"}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function MessageThread({ message, onSelect, selected }: { message: CoachMessage; onSelect: () => void; selected: boolean }) {
  const isCoachSide = message.messageType === "broadcast" || message.sender?.email;
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 rounded-lg border transition-all ${selected ? "border-[#FF6432]/50 bg-[#FF6432]/5" : "border-[#1A2D3F] bg-[#132130] hover:border-[#FF6432]/20"}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[#1A2D3F] flex items-center justify-center shrink-0 text-xs font-bold text-[#6A8499]">
          {message.messageType === "broadcast" ? "📢" : (message.recipient?.firstName?.[0] || message.sender?.firstName?.[0] || "?")}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className="text-[#EEF2F6] text-sm font-semibold truncate">
              {message.messageType === "broadcast" ? "Broadcast — All Athletes" : (
                message.recipient ? `${message.recipient.firstName} ${message.recipient.lastName}` : "Unknown"
              )}
            </span>
            <span className="text-[#6A8499] text-xs shrink-0">
              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-[#6A8499] text-xs truncate">{message.subject}</p>
          <p className="text-[#EEF2F6]/60 text-xs truncate mt-0.5">{message.body}</p>
        </div>
        {!message.isRead && (
          <div className="w-2 h-2 rounded-full bg-[#FF6432] shrink-0 mt-1" />
        )}
      </div>
    </button>
  );
}

export default function CoachMessagesPage() {
  const { user } = useAuth();
  const { isPro } = useTier();
  const [selected, setSelected] = useState<CoachMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: sentMessages = [], refetch } = useQuery<CoachMessage[]>({
    queryKey: ["/api/messages"],
    enabled: !!user,
  });

  const { data: inbox = [] } = useQuery<CoachMessage[]>({
    queryKey: ["/api/messages"],
    enabled: !!user && user.role !== "coach",
  });

  const isCoach = user?.role === "coach";
  const messages = isCoach ? sentMessages : inbox;
  const filtered = messages.filter(m =>
    m.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.body?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const content = (
    <div className="flex h-full gap-4">
      {/* Left: list */}
      <div className="w-80 flex flex-col gap-3 shrink-0">
        {isCoach && <ComposePane onSent={() => { refetch(); setSelected(null); }} />}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6A8499]" />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-[#132130] border-[#1A2D3F] text-[#EEF2F6] placeholder:text-[#6A8499]"
          />
        </div>
        <div className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-320px)]">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-[#6A8499] text-sm">
              {isCoach ? "No messages sent yet" : "No messages in your inbox"}
            </div>
          ) : (
            filtered.map(m => (
              <MessageThread
                key={m.id}
                message={m}
                selected={selected?.id === m.id}
                onSelect={() => setSelected(m)}
              />
            ))
          )}
        </div>
      </div>

      {/* Right: thread view */}
      <div className="flex-1">
        {selected ? (
          <Card className="bg-[#132130] border-[#1A2D3F] h-full">
            <CardHeader className="pb-3 border-b border-[#1A2D3F]">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-[#EEF2F6] text-base">{selected.subject}</CardTitle>
                  <p className="text-[#6A8499] text-xs mt-1">
                    {selected.messageType === "broadcast" ? (
                      <><Users className="w-3 h-3 inline mr-1" />Broadcast to all athletes</>
                    ) : (
                      <>To: {selected.recipient?.firstName} {selected.recipient?.lastName} · {selected.recipient?.email}</>
                    )}
                  </p>
                </div>
                <Badge className={selected.messageType === "broadcast" ? "bg-amber-600/20 text-amber-400 border-amber-400/30" : "bg-[#1A2D3F] text-[#6A8499]"}>
                  {selected.messageType === "broadcast" ? "Broadcast" : "Direct"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-[#EEF2F6] leading-relaxed whitespace-pre-wrap">{selected.body}</p>
              <p className="text-[#6A8499] text-xs mt-4">
                Sent {formatDistanceToNow(new Date(selected.createdAt), { addSuffix: true })}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="w-12 h-12 text-[#1A2D3F] mb-3" />
            <p className="text-[#6A8499]">Select a message to read</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#0A0C12]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TrialBanner />
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <MessageSquare className="w-6 h-6 text-[#FF6432]" />
              <h1 className="text-2xl font-extrabold uppercase tracking-tight text-[#EEF2F6]">
                {isCoach ? "Coach Messages" : "Messages"}
              </h1>
              {isCoach && (
                <Badge className="bg-[#FF6432]/10 text-[#FF6432] border-[#FF6432]/30 text-xs">Pro Feature</Badge>
              )}
            </div>

            {isCoach ? (
              <LockedContent requiredTier="pro" label="Coach Messaging — Pro Feature">
                {content}
              </LockedContent>
            ) : content}
          </div>
        </div>
      </div>
    </div>
  );
}
