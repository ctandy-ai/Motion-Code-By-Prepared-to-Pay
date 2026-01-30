import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Target, Dumbbell, TrendingUp, Calendar, Crown, Award, ChevronRight, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface LeaderboardEntry {
  rank: number;
  athleteId: string;
  athleteName: string;
  team: string | null;
  position: string | null;
  totalPRs: number;
  topPRWeight: number;
  topPRExerciseId: string | null;
  totalWorkouts: number;
  totalSets: number;
  totalVolume: number;
  complianceRate: number;
  lastWorkout: string | null;
}

interface LeaderboardResponse {
  category: string;
  leaderboard: LeaderboardEntry[];
}

const categoryConfig = {
  prs: { 
    label: "Most PRs", 
    icon: Trophy, 
    color: "text-amber-500",
    metric: (e: LeaderboardEntry) => e.totalPRs,
    format: (v: number) => `${v} PRs`
  },
  strongest: { 
    label: "Strongest Lift", 
    icon: Crown, 
    color: "text-red-500",
    metric: (e: LeaderboardEntry) => e.topPRWeight,
    format: (v: number) => `${v} kg`
  },
  volume: { 
    label: "Total Volume", 
    icon: Dumbbell, 
    color: "text-blue-500",
    metric: (e: LeaderboardEntry) => e.totalVolume,
    format: (v: number) => `${v.toLocaleString()} kg`
  },
  workouts: { 
    label: "Most Workouts", 
    icon: Calendar, 
    color: "text-green-500",
    metric: (e: LeaderboardEntry) => e.totalWorkouts,
    format: (v: number) => `${v} workouts`
  },
  compliance: { 
    label: "Best Compliance", 
    icon: Target, 
    color: "text-purple-500",
    metric: (e: LeaderboardEntry) => e.complianceRate,
    format: (v: number) => `${v}%`
  },
};

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold text-lg shadow-lg">
        <Crown className="w-5 h-5" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 text-white font-bold text-lg shadow-md">
        <Medal className="w-5 h-5" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold text-lg shadow-md">
        <Award className="w-5 h-5" />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-muted-foreground font-bold text-lg">
      {rank}
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-lg border bg-card/50">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

export default function Leaderboards() {
  const [activeCategory, setActiveCategory] = useState<string>("prs");
  const [, setLocation] = useLocation();

  const { data, isLoading, error } = useQuery<LeaderboardResponse>({
    queryKey: [`/api/leaderboards?category=${activeCategory}`],
  });

  const config = categoryConfig[activeCategory as keyof typeof categoryConfig];

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-8 h-8 text-amber-500" />
          <h1 className="text-3xl font-bold tracking-tight">Leaderboards</h1>
        </div>
        <p className="text-muted-foreground">
          Track and celebrate your team's top performers across different metrics.
        </p>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full" data-testid="leaderboard-tabs">
          {Object.entries(categoryConfig).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <TabsTrigger 
                key={key} 
                value={key}
                className="flex items-center gap-2"
                data-testid={`tab-${key}`}
              >
                <Icon className={`w-4 h-4 ${activeCategory === key ? cfg.color : ''}`} />
                <span className="hidden md:inline">{cfg.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.keys(categoryConfig).map((key) => (
          <TabsContent key={key} value={key} className="space-y-4">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = categoryConfig[key as keyof typeof categoryConfig].icon;
                    return <Icon className={`w-5 h-5 ${categoryConfig[key as keyof typeof categoryConfig].color}`} />;
                  })()}
                  <CardTitle>{categoryConfig[key as keyof typeof categoryConfig].label}</CardTitle>
                </div>
                <CardDescription>
                  {key === "prs" && "Athletes ranked by total number of personal records achieved."}
                  {key === "strongest" && "Athletes ranked by their heaviest single lift PR."}
                  {key === "volume" && "Athletes ranked by total training volume (weight × reps)."}
                  {key === "workouts" && "Athletes ranked by number of completed workouts."}
                  {key === "compliance" && "Athletes ranked by program adherence percentage."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>Failed to load leaderboard data. Please try again later.</AlertDescription>
                  </Alert>
                ) : isLoading ? (
                  <LeaderboardSkeleton />
                ) : data?.leaderboard.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground" data-testid="empty-leaderboard">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No data yet</p>
                    <p className="text-sm">Athletes will appear here as they log workouts and achieve PRs.</p>
                  </div>
                ) : (
                  <div className="space-y-3" data-testid="leaderboard-list">
                    {data?.leaderboard.map((entry) => {
                      const cfg = categoryConfig[activeCategory as keyof typeof categoryConfig];
                      const metricValue = cfg.metric(entry);
                      const formattedValue = cfg.format(metricValue);
                      
                      return (
                        <Button
                          key={entry.athleteId}
                          variant="ghost"
                          className={`w-full h-auto flex items-center gap-4 p-4 rounded-lg border justify-start ${
                            entry.rank <= 3 ? 'bg-card border-amber-500/20' : 'bg-card/50'
                          }`}
                          onClick={() => setLocation(`/athletes/${entry.athleteId}`)}
                          data-testid={`leaderboard-entry-${entry.athleteId}`}
                        >
                          <RankBadge rank={entry.rank} />
                          
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={undefined} alt={entry.athleteName} />
                            <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                              {entry.athleteName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold truncate" data-testid={`athlete-name-${entry.athleteId}`}>{entry.athleteName}</span>
                              {entry.rank === 1 && (
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
                                  Leader
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {entry.team && <span data-testid={`athlete-team-${entry.athleteId}`}>{entry.team}</span>}
                              {entry.team && entry.position && <span>•</span>}
                              {entry.position && <span data-testid={`athlete-position-${entry.athleteId}`}>{entry.position}</span>}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className={`text-lg font-bold ${entry.rank <= 3 ? cfg.color : ''}`} data-testid={`athlete-metric-${entry.athleteId}`}>
                              {formattedValue}
                            </div>
                            <div className="text-xs text-muted-foreground" data-testid={`athlete-workouts-${entry.athleteId}`}>
                              {entry.totalWorkouts} workouts
                            </div>
                          </div>
                          
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </Button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="quick-stats">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-foreground" data-testid="stat-total-athletes">{data?.leaderboard.length || 0}</div>
              <div className="text-sm text-muted-foreground">Total Athletes</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-amber-500" data-testid="stat-total-prs">
                {data?.leaderboard.reduce((sum, e) => sum + e.totalPRs, 0) || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total PRs</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-green-500" data-testid="stat-total-workouts">
                {data?.leaderboard.reduce((sum, e) => sum + e.totalWorkouts, 0) || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Workouts</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-blue-500" data-testid="stat-total-volume">
                {((data?.leaderboard.reduce((sum, e) => sum + e.totalVolume, 0) || 0) / 1000).toFixed(1)}k
              </div>
              <div className="text-sm text-muted-foreground">Total Volume (kg)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
