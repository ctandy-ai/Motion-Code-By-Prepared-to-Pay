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
      <div>
        <h1 className="font-heading text-4xl font-bold text-foreground">
          Level Up Your Training
        </h1>
        <p className="text-muted-foreground mt-2">
          Track progress, earn achievements, and compete with your best self.
        </p>
      </div>

      <XPBar 
        currentXP={mockAthleteStats.xp} 
        level={mockAthleteStats.level} 
      />

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
          <Card className="border-2 border-warning/30 bg-gradient-to-br from-warning/5 to-transparent">
            <CardHeader>
              <CardTitle className="font-heading text-xl flex items-center gap-2">
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

          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-xl flex items-center gap-2">
                <Trophy className="h-5 w-5 text-gold" />
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
          <Card className="border-2 border-success/30 bg-gradient-to-br from-success/5 to-transparent">
            <CardHeader>
              <CardTitle className="font-heading text-xl">Your Streak</CardTitle>
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

          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-xl">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-xp/10 to-transparent border border-xp/20">
                  <span className="text-sm font-medium">Workouts This Week</span>
                  <span className="text-2xl font-display font-bold text-xp">6</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-success/10 to-transparent border border-success/20">
                  <span className="text-sm font-medium">New PRs</span>
                  <span className="text-2xl font-display font-bold text-success">4</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-info/10 to-transparent border border-info/20">
                  <span className="text-sm font-medium">Total Volume</span>
                  <span className="text-2xl font-display font-bold text-info">45.2K</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {athletes && athletes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-xl">Top Athletes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {athletes.slice(0, 3).map((athlete, index) => (
                    <div 
                      key={athlete.id} 
                      className="flex items-center gap-3 p-2 rounded-lg hover-elevate"
                      data-testid={`top-athlete-${athlete.id}`}
                    >
                      <div className={`
                        flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm
                        ${index === 0 ? 'bg-gold/20 text-gold border-2 border-gold/30' : ''}
                        ${index === 1 ? 'bg-silver/20 text-silver border-2 border-silver/30' : ''}
                        ${index === 2 ? 'bg-bronze/20 text-bronze border-2 border-bronze/30' : ''}
                      `}>
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{athlete.name}</p>
                        <p className="text-xs text-muted-foreground">{athlete.team}</p>
                      </div>
                      <div className="text-sm font-display font-bold text-xp">
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
