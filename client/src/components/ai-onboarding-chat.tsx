import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageSquare, 
  Send, 
  Loader2, 
  UserPlus, 
  Sparkles, 
  Check, 
  ChevronRight,
  Brain,
  User,
  FileText
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ParsedAthleteData {
  name?: string;
  email?: string;
  phone?: string;
  team?: string;
  position?: string;
  sport?: string;
  dateOfBirth?: string;
  trainingAgeYears?: number;
  movementQualityScore?: number;
  recurrentHamstring?: boolean;
  recurrentCalf?: boolean;
  recurrentGroin?: boolean;
  notes?: string;
  goals?: string[];
  coachingAssessment?: string;
}

interface OnboardingResponse {
  message: string;
  extractedData?: ParsedAthleteData;
  isComplete: boolean;
  suggestedPrograms?: Array<{
    id: string;
    name: string;
    description?: string;
    matchReason: string;
  }>;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  extractedData?: ParsedAthleteData;
  isComplete?: boolean;
}

interface SuggestedProgram {
  id: string;
  name: string;
  description?: string | null;
  matchReason: string;
}

interface AIOnboardingChatProps {
  onAthleteCreated?: (athleteId: string) => void;
  onClose?: () => void;
}

export function AIOnboardingChat({ onAthleteCreated, onClose }: AIOnboardingChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hi! I'm your AI coaching assistant. Tell me about the athlete you'd like to add - you can describe them naturally. For example: 'New midfielder for the U21s, name is Jake Smith. He's been training for about 3 years, pretty solid movement quality, but had a hamstring issue last season. Main goal is to get him ready for preseason.'",
    },
  ]);
  const [input, setInput] = useState("");
  const [extractedData, setExtractedData] = useState<ParsedAthleteData | null>(null);
  const [suggestedPrograms, setSuggestedPrograms] = useState<SuggestedProgram[]>([]);
  const [isReadyToCreate, setIsReadyToCreate] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await apiRequest("POST", "/api/ai/onboarding/chat", {
        message,
        conversationHistory,
      });
      return response.json() as Promise<OnboardingResponse>;
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message,
          extractedData: data.extractedData,
          isComplete: data.isComplete,
        },
      ]);

      if (data.extractedData) {
        setExtractedData((prev) => ({ ...prev, ...data.extractedData }));
      }

      if (data.isComplete) {
        setIsReadyToCreate(true);
      }

      if (data.suggestedPrograms) {
        setSuggestedPrograms(data.suggestedPrograms);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process your message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createAthleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ai/onboarding/create-athlete", {
        athleteData: extractedData,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.athleteId) {
        toast({
          title: "Athlete Created",
          description: `${extractedData?.name} has been added to your roster.`,
        });

        if (data.suggestedPrograms?.length > 0) {
          setSuggestedPrograms(data.suggestedPrograms);
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `I've created ${extractedData?.name}'s profile. ${data.suggestedPrograms?.length > 0 ? "Based on their profile, here are some program recommendations:" : "You can now assign them to a training program."}`,
          },
        ]);

        queryClient.invalidateQueries({ queryKey: ["/api/athletes"] });
        onAthleteCreated?.(data.athleteId);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create athlete. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    chatMutation.mutate(userMessage);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const getBeltFromData = (data: ParsedAthleteData | null): string => {
    if (!data) return "WHITE";
    const trainingAge = data.trainingAgeYears || 0;
    const movementQuality = data.movementQualityScore || 3;
    const hasInjury = data.recurrentHamstring || data.recurrentCalf || data.recurrentGroin;

    if (trainingAge >= 4 && movementQuality >= 4 && !hasInjury) return "BLACK";
    if (trainingAge >= 2 && movementQuality >= 3) return "BLUE";
    return "WHITE";
  };

  const beltColors: Record<string, string> = {
    WHITE: "bg-slate-200 text-slate-800",
    BLUE: "bg-blue-500 text-white",
    BLACK: "bg-slate-900 text-white border border-slate-600",
  };

  return (
    <Card className="flex flex-col h-[600px] bg-slate-900/90 border-slate-700">
      <CardHeader className="pb-2 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-brand-500/20">
              <Brain className="h-5 w-5 text-brand-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-200">AI Athlete Onboarding</CardTitle>
              <p className="text-xs text-slate-400">Describe your athlete naturally</p>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="shrink-0 w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-brand-400" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === "user"
                        ? "bg-brand-600/30 text-slate-200"
                        : "bg-slate-800/50 text-slate-300"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {msg.extractedData && (
                      <div className="mt-2 pt-2 border-t border-slate-600/50">
                        <p className="text-xs text-slate-400 mb-1">Captured:</p>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(msg.extractedData).map(([key, value]) => {
                            if (!value || (Array.isArray(value) && value.length === 0)) return null;
                            return (
                              <Badge
                                key={key}
                                variant="outline"
                                className="text-[10px] bg-slate-700/50"
                              >
                                {key}: {Array.isArray(value) ? value.join(", ") : String(value)}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="shrink-0 w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                  )}
                </div>
              ))}

              {chatMutation.isPending && (
                <div className="flex gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-brand-400" />
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {extractedData && (
            <div className="w-64 border-l border-slate-700/50 p-3 overflow-auto">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <h4 className="text-sm font-medium text-slate-300">Athlete Profile</h4>
                </div>

                <div className="space-y-2 text-xs">
                  {extractedData.name && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Name</span>
                      <span className="text-slate-300 font-medium">{extractedData.name}</span>
                    </div>
                  )}
                  {extractedData.team && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Team</span>
                      <span className="text-slate-300">{extractedData.team}</span>
                    </div>
                  )}
                  {extractedData.position && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Position</span>
                      <span className="text-slate-300">{extractedData.position}</span>
                    </div>
                  )}
                  {extractedData.trainingAgeYears !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Training Age</span>
                      <span className="text-slate-300">{extractedData.trainingAgeYears} yrs</span>
                    </div>
                  )}
                  {extractedData.movementQualityScore !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Movement Quality</span>
                      <span className="text-slate-300">{extractedData.movementQualityScore}/5</span>
                    </div>
                  )}

                  {(extractedData.recurrentHamstring ||
                    extractedData.recurrentCalf ||
                    extractedData.recurrentGroin) && (
                    <div className="pt-1">
                      <span className="text-slate-500">Injury Flags</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {extractedData.recurrentHamstring && (
                          <Badge variant="destructive" className="text-[10px]">
                            Hamstring
                          </Badge>
                        )}
                        {extractedData.recurrentCalf && (
                          <Badge variant="destructive" className="text-[10px]">
                            Calf
                          </Badge>
                        )}
                        {extractedData.recurrentGroin && (
                          <Badge variant="destructive" className="text-[10px]">
                            Groin
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {extractedData.goals && extractedData.goals.length > 0 && (
                    <div className="pt-1">
                      <span className="text-slate-500">Goals</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {extractedData.goals.map((goal, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">
                            {goal}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500">Predicted Belt</span>
                    <Badge className={beltColors[getBeltFromData(extractedData)]}>
                      {getBeltFromData(extractedData)}
                    </Badge>
                  </div>
                </div>

                {isReadyToCreate && (
                  <Button
                    className="w-full"
                    onClick={() => createAthleteMutation.mutate()}
                    disabled={createAthleteMutation.isPending}
                    data-testid="button-create-athlete"
                  >
                    {createAthleteMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    Create Athlete
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {suggestedPrograms.length > 0 && (
          <div className="border-t border-slate-700/50 p-3">
            <p className="text-xs text-slate-400 mb-2">Recommended Programs</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {suggestedPrograms.map((program) => (
                <Card
                  key={program.id}
                  className="shrink-0 w-48 bg-slate-800/50 border-slate-700/50 cursor-pointer hover:border-brand-500/50 transition-colors"
                >
                  <CardContent className="p-3">
                    <p className="text-sm font-medium text-slate-200 truncate">{program.name}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{program.matchReason}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="p-3 border-t border-slate-700/50">
          <div className="flex gap-2">
            <Textarea
              placeholder="Describe the athlete..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[60px] bg-slate-800/50 border-slate-600 resize-none"
              data-testid="input-onboarding-message"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || chatMutation.isPending}
              size="icon"
              className="h-[60px] w-12"
              data-testid="button-send-message"
            >
              {chatMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
