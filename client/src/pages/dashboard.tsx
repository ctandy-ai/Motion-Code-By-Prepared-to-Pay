import { StatCard } from "@/components/stat-card";
import { Users, Dumbbell, TrendingUp, Trophy, Zap, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Athlete, Exercise, Program } from "@shared/schema";
import { XPBar } from "@/components/xp-bar";
import { StreakCounter } from "@/components/streak-counter";
import { AchievementBadge } from "@/components/achievement-badge";
import { DailyChallengeCard } from "@/components/daily-challenge-card";

const mockAthleteStats = {
  xp: 2750,
  level: 8,
  currentStreak: 12,
  longestStreak: 28,
};

const mockAchievements = [
  {
    id: "1",
    name: "Century Club",
    description: "Complete 100 total workouts",
    category: "Consistency",
    rarity: "Epic",
    iconUrl: "",
    xpReward: 500,
    requirement: "100 workouts",
  },
  {
    id: "2",
    name: "First PR",
    description: "Set your first personal record",
    category: "Strength",
    rarity: "Common",
    iconUrl: "",
    xpReward: 100,
    requirement: "1 PR",
  },
  {
    id: "3",
    name: "Streak Master",
    description: "Maintain a 30-day workout streak",
    category: "Consistency",
    rarity: "Legendary",
    iconUrl: "",
    xpReward: 1000,
    requirement: "30-day streak",
  },
];

const mockUnlockedAchievements = ["1", "2"];

const mockDailyChallenge = {
  id: "daily-1",
  date: new Date(),
  title: "Volume King",
  description: "Complete 50 total sets today",
  xpReward: 250,
  targetValue: 50,
  challengeType: "sets",
};

export default function Dashboard() {
  const { data: athletes, isLoading: loadingAthletes } = useQuery<Athlete[]>({
    queryKey: ["/api/athletes"],
  });

  const { data: exercises, isLoading: loadingExercises } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });

  const { data: programs, isLoading: loadingPrograms } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });

  const isLoading = loadingAthletes || loadingExercises || loadingPrograms;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of your training platform
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Last Updated</p>
          <p className="text-sm font-medium text-foreground">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Athletes"
          value={isLoading ? "-" : athletes?.length || 0}
          description="Training with you"
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Exercise Library"
          value={isLoading ? "-" : exercises?.length || 0}
          description="Movements available"
          icon={Dumbbell}
        />
        <StatCard
          title="Active Programs"
          value={isLoading ? "-" : programs?.length || 0}
          description="Training plans"
          icon={Target}
        />
        <StatCard
          title="Total XP Earned"
          value={mockAthleteStats.xp.toLocaleString()}
          description="Experience points"
          icon={Zap}
          trend={{ value: 15, isPositive: true }}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Activity Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-md bg-muted/30 border">
                  <span className="text-sm font-medium text-muted-foreground">Workouts This Week</span>
                  <span className="text-xl font-semibold text-foreground">6</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md bg-muted/30 border">
                  <span className="text-sm font-medium text-muted-foreground">New PRs</span>
                  <span className="text-xl font-semibold text-success">4</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-md bg-muted/30 border">
                  <span className="text-sm font-medium text-muted-foreground">Total Volume (lbs)</span>
                  <span className="text-xl font-semibold text-foreground">45,200</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Performance Level</CardTitle>
              <div className="text-xs text-muted-foreground">Level {mockAthleteStats.level}</div>
            </CardHeader>
            <CardContent>
              <XPBar 
                currentXP={mockAthleteStats.xp} 
                level={mockAthleteStats.level} 
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Current Streak</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <div className="text-4xl font-bold text-primary mb-2">{mockAthleteStats.currentStreak}</div>
                <p className="text-sm text-muted-foreground">Days active</p>
                <p className="text-xs text-muted-foreground mt-3">Best: {mockAthleteStats.longestStreak} days</p>
              </div>
            </CardContent>
          </Card>

          {athletes && athletes.length > 0 && (
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {athletes.slice(0, 3).map((athlete, index) => (
                    <div 
                      key={athlete.id} 
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                      data-testid={`top-athlete-${athlete.id}`}
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{athlete.name}</p>
                        <p className="text-xs text-muted-foreground">{athlete.team}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
