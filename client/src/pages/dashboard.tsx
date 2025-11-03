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
    <div className="space-y-8">
      <div className="reveal-up bg-gradient-to-r from-primary/10 via-accent/10 to-transparent p-8 rounded-xl border-l-4 border-primary">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-heading text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Performance Dashboard
            </h1>
            <p className="text-muted-foreground mt-3 text-lg">
              Monitor athlete performance, track progress, and optimize training programs.
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Last Updated</p>
            <p className="text-lg font-semibold text-foreground">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <div className="reveal-up" style={{ animationDelay: '0.1s' }}>
        <XPBar 
          currentXP={mockAthleteStats.xp} 
          level={mockAthleteStats.level} 
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="hover-elevate border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-5 w-5 text-warning" />
                Daily Challenge
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DailyChallengeCard
                challenge={mockDailyChallenge}
                progress={32}
                completed={false}
              />
            </CardContent>
          </Card>

          <Card className="hover-elevate border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Trophy className="h-5 w-5 text-accent" />
                Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {mockAchievements.slice(0, 4).map((achievement) => (
                  <AchievementBadge
                    key={achievement.id}
                    achievement={achievement}
                    unlocked={mockUnlockedAchievements.includes(achievement.id)}
                    unlockedAt={mockUnlockedAchievements.includes(achievement.id) ? new Date() : null}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="hover-elevate border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Training Streak</CardTitle>
            </CardHeader>
            <CardContent>
              <StreakCounter
                currentStreak={mockAthleteStats.currentStreak}
                longestStreak={mockAthleteStats.longestStreak}
              />
              <p className="text-sm text-muted-foreground mt-4">
                Keep the fire burning! Complete a workout today to maintain your streak.
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Quick Stats</CardTitle>
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
                  <span className="text-sm font-medium text-muted-foreground">Total Volume</span>
                  <span className="text-xl font-semibold text-foreground">45.2K</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {athletes && athletes.length > 0 && (
            <Card className="hover-elevate border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-accent" />
                  Top Athletes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {athletes.slice(0, 3).map((athlete, index) => (
                    <div 
                      key={athlete.id} 
                      className="flex items-center gap-3 p-3 rounded-md bg-muted/30 border hover-elevate"
                      data-testid={`top-athlete-${athlete.id}`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-semibold text-xs text-primary">
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{athlete.name}</p>
                        <p className="text-xs text-muted-foreground">{athlete.team}</p>
                      </div>
                      <div className="text-sm font-semibold text-accent">
                        L{Math.floor(Math.random() * 10) + 5}
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
