import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Brain,
  User,
  Dumbbell,
  Users,
  BarChart3,
  Target,
  Send,
  Loader2,
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  FileText,
  ChevronRight,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Athlete, Program } from "@shared/schema";

type AILevel = "athlete" | "program" | "exercise" | "team" | "analytics" | "coaching";

interface AIResponse {
  message: string;
  suggestions?: Array<{
    type: string;
    title: string;
    description: string;
    action?: string;
    data?: Record<string, unknown>;
  }>;
  insights?: Array<{
    category: string;
    insight: string;
    severity?: "info" | "warning" | "critical";
  }>;
  predictions?: Array<{
    metric: string;
    prediction: string;
    confidence: number;
  }>;
}

const levelConfig: Record<AILevel, { icon: typeof Brain; label: string; description: string; color: string }> = {
  athlete: { icon: User, label: "Athlete", description: "Individual insights & updates", color: "text-blue-400" },
  program: { icon: FileText, label: "Program", description: "Program optimization", color: "text-purple-400" },
  exercise: { icon: Dumbbell, label: "Exercise", description: "Exercise recommendations", color: "text-green-400" },
  team: { icon: Users, label: "Team", description: "Roster-wide analysis", color: "text-orange-400" },
  analytics: { icon: BarChart3, label: "Analytics", description: "Data queries", color: "text-cyan-400" },
  coaching: { icon: Target, label: "Coaching", description: "Decision support", color: "text-yellow-400" },
};

const exampleQueries: Record<AILevel, string[]> = {
  athlete: [
    "What's Jake's injury risk based on recent training?",
    "How has Sarah's performance changed this month?",
    "Which athletes need belt reassessment?",
  ],
  program: [
    "How can I optimize this 12-week program?",
    "Where should I add deload weeks?",
    "Is the volume progression appropriate?",
  ],
  exercise: [
    "Recommend exercises for hamstring rehab",
    "What can replace back squats for an athlete with knee issues?",
    "Best exercises for explosive power",
  ],
  team: [
    "Which athletes are at injury risk?",
    "How is team readiness trending?",
    "Who hasn't trained in the last week?",
  ],
  analytics: [
    "How many PRs did we hit this month?",
    "What's the average team readiness?",
    "Which exercises produce the most PRs?",
  ],
  coaching: [
    "Should I reduce volume for athletes with high soreness?",
    "How do I prepare the team for competition next week?",
    "Which athletes are ready for progression?",
  ],
};

export function AICommandCenter() {
  const [selectedLevel, setSelectedLevel] = useState<AILevel>("team");
  const [query, setQuery] = useState("");
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const [response, setResponse] = useState<AIResponse | null>(null);

  const { data: athletes } = useQuery<Athlete[]>({ queryKey: ["/api/athletes"] });
  const { data: programs } = useQuery<Program[]>({ queryKey: ["/api/programs"] });

  const queryMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/query", {
        query,
        level: selectedLevel,
        entityId: selectedEntityId || undefined,
      });
      return res.json() as Promise<AIResponse>;
    },
    onSuccess: (data) => {
      setResponse(data);
    },
  });

  const handleSubmit = () => {
    if (!query.trim()) return;
    queryMutation.mutate();
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "critical": return "bg-red-500/20 text-red-400 border-red-500/50";
      case "warning": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      default: return "bg-blue-500/20 text-blue-400 border-blue-500/50";
    }
  };

  const LevelIcon = levelConfig[selectedLevel].icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-brand-500/20">
          <Brain className="h-8 w-8 text-brand-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">AI Command Center</h1>
          <p className="text-slate-400">Intelligent insights across all levels of your program</p>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {(Object.keys(levelConfig) as AILevel[]).map((level) => {
          const config = levelConfig[level];
          const Icon = config.icon;
          return (
            <Button
              key={level}
              variant={selectedLevel === level ? "default" : "outline"}
              className={`flex flex-col items-center gap-1 h-auto py-3 ${
                selectedLevel === level ? "" : "bg-slate-800/50 border-slate-700"
              }`}
              onClick={() => {
                setSelectedLevel(level);
                setSelectedEntityId("");
                setResponse(null);
              }}
              data-testid={`button-level-${level}`}
            >
              <Icon className={`h-5 w-5 ${selectedLevel === level ? "" : config.color}`} />
              <span className="text-xs">{config.label}</span>
            </Button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <Card className="bg-slate-900/80 border-slate-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LevelIcon className={`h-5 w-5 ${levelConfig[selectedLevel].color}`} />
                  <CardTitle className="text-lg">{levelConfig[selectedLevel].label} Intelligence</CardTitle>
                </div>
                
                {(selectedLevel === "athlete" || selectedLevel === "program") && (
                  <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
                    <SelectTrigger className="w-48 bg-slate-800/50" data-testid="select-entity">
                      <SelectValue placeholder={`Select ${selectedLevel}...`} />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedLevel === "athlete" && athletes?.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                      {selectedLevel === "program" && programs?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <p className="text-sm text-slate-400">{levelConfig[selectedLevel].description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder={`Ask about ${levelConfig[selectedLevel].label.toLowerCase()}...`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="min-h-[80px] bg-slate-800/50 border-slate-600 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  data-testid="input-ai-query"
                />
                <Button
                  onClick={handleSubmit}
                  disabled={!query.trim() || queryMutation.isPending}
                  className="h-auto"
                  data-testid="button-submit-query"
                >
                  {queryMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {exampleQueries[selectedLevel].map((example, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="cursor-pointer hover:bg-slate-700/50 transition-colors"
                    onClick={() => handleExampleClick(example)}
                  >
                    {example}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {response && (
            <Card className="bg-slate-900/80 border-slate-700">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-brand-400" />
                  <CardTitle className="text-lg">AI Response</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-slate-800/50">
                  <p className="text-slate-200 whitespace-pre-wrap">{response.message}</p>
                </div>

                {response.insights && response.insights.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Insights
                    </h4>
                    <div className="space-y-2">
                      {response.insights.map((insight, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg border ${getSeverityColor(insight.severity)}`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-[10px]">
                              {insight.category}
                            </Badge>
                            {insight.severity === "critical" && (
                              <AlertTriangle className="h-3 w-3 text-red-400" />
                            )}
                          </div>
                          <p className="text-sm">{insight.insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {response.suggestions && response.suggestions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Suggestions
                    </h4>
                    <div className="grid gap-2">
                      {response.suggestions.map((suggestion, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-brand-500/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-slate-200">{suggestion.title}</p>
                              <p className="text-xs text-slate-400">{suggestion.description}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-500" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {response.predictions && response.predictions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Predictions
                    </h4>
                    <div className="grid gap-2">
                      {response.predictions.map((prediction, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-slate-200">{prediction.metric}</p>
                            <Badge variant="outline" className="text-[10px]">
                              {Math.round(prediction.confidence * 100)}% confidence
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-400">{prediction.prediction}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="bg-slate-900/80 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start bg-slate-800/50"
                onClick={() => {
                  setSelectedLevel("team");
                  setQuery("Provide a comprehensive team health check");
                  handleSubmit();
                }}
                data-testid="button-quick-team-health"
              >
                <Users className="h-4 w-4 mr-2 text-orange-400" />
                Team Health Check
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-slate-800/50"
                onClick={() => {
                  setSelectedLevel("team");
                  setQuery("Which athletes are at highest injury risk?");
                  handleSubmit();
                }}
                data-testid="button-quick-injury-risk"
              >
                <AlertTriangle className="h-4 w-4 mr-2 text-red-400" />
                Injury Risk Analysis
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start bg-slate-800/50"
                onClick={() => {
                  setSelectedLevel("analytics");
                  setQuery("Summarize this month's training performance");
                  handleSubmit();
                }}
                data-testid="button-quick-monthly-summary"
              >
                <BarChart3 className="h-4 w-4 mr-2 text-cyan-400" />
                Monthly Summary
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">AI Capabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3 text-xs">
                  <div>
                    <p className="font-medium text-blue-400">Athlete Level</p>
                    <ul className="text-slate-400 mt-1 space-y-1">
                      <li>- Profile updates via natural language</li>
                      <li>- Injury risk predictions</li>
                      <li>- Belt progression recommendations</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-purple-400">Program Level</p>
                    <ul className="text-slate-400 mt-1 space-y-1">
                      <li>- Periodization optimization</li>
                      <li>- Volume/intensity balancing</li>
                      <li>- Recovery week placement</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-green-400">Exercise Level</p>
                    <ul className="text-slate-400 mt-1 space-y-1">
                      <li>- Context-aware recommendations</li>
                      <li>- Injury-safe substitutions</li>
                      <li>- Progression pathways</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-orange-400">Team Level</p>
                    <ul className="text-slate-400 mt-1 space-y-1">
                      <li>- Workload distribution</li>
                      <li>- Readiness trends</li>
                      <li>- Compliance monitoring</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-cyan-400">Analytics Level</p>
                    <ul className="text-slate-400 mt-1 space-y-1">
                      <li>- Natural language queries</li>
                      <li>- Trend interpretation</li>
                      <li>- Performance summaries</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-yellow-400">Coaching Level</p>
                    <ul className="text-slate-400 mt-1 space-y-1">
                      <li>- Decision support</li>
                      <li>- What-if scenarios</li>
                      <li>- Competition prep</li>
                    </ul>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
