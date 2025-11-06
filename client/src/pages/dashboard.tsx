import { StatCard } from "@/components/stat-card";
import { Users, Dumbbell, TrendingUp, Trophy, Zap, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Athlete, Exercise, Program } from "@shared/schema";
import { XPBar } from "@/components/xp-bar";
import { StreakCounter } from "@/components/streak-counter";
import { AchievementBadge } from "@/components/achievement-badge";
import { DailyChallengeCard } from "@/components/daily-challenge-card";

interface DashboardStats {
  totalWorkouts: number;
  totalSets: number;
  totalXP: number;
  totalPRs: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  topAthletes: (Athlete & { workoutCount: number; xp: number })[];
  recentPRs: any[];
}

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

  const { data: dashboardStats, isLoading: loadingStats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard-stats"],
  });

  const isLoading = loadingAthletes || loadingExercises || loadingPrograms || loadingStats;

  return (
    <div className="space-y-6">
      <div className="bglass rounded-2xl shadow-glass p-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">
            Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Overview of your training platform
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Last Updated</p>
          <p className="text-sm font-medium text-slate-200">{new Date().toLocaleDateString()}</p>
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
          title="Total Workouts"
          value={isLoading ? "-" : dashboardStats?.totalWorkouts || 0}
          description="Logged sessions"
          icon={Zap}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card className="bglass shadow-glass border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-100">Activity Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl ringify">
                  <span className="text-sm font-medium text-slate-400">Total Workouts</span>
                  <span className="text-xl font-semibold text-slate-100">{dashboardStats?.totalWorkouts || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl ringify">
                  <span className="text-sm font-medium text-slate-400">Total Sets</span>
                  <span className="text-xl font-semibold text-slate-100">{dashboardStats?.totalSets || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl ringify">
                  <span className="text-sm font-medium text-slate-400">Personal Records</span>
                  <span className="text-xl font-semibold text-emerald-400">{dashboardStats?.totalPRs || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bglass shadow-glass border-0">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-100">Performance Level</CardTitle>
              <div className="text-xs text-slate-400">Level {dashboardStats?.level || 1}</div>
            </CardHeader>
            <CardContent>
              <XPBar 
                currentXP={dashboardStats?.totalXP || 0} 
                level={dashboardStats?.level || 1} 
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="bglass shadow-glass border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-100">Current Streak</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <div className="text-4xl font-bold text-brand-400 mb-2">{dashboardStats?.currentStreak || 0}</div>
                <p className="text-sm text-slate-400">Days active</p>
                <p className="text-xs text-slate-500 mt-3">Best: {dashboardStats?.longestStreak || 0} days</p>
              </div>
            </CardContent>
          </Card>

          {dashboardStats && dashboardStats.topAthletes.length > 0 && (
            <Card className="bglass shadow-glass border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-100">Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboardStats.topAthletes.map((athlete, index) => (
                    <div 
                      key={athlete.id} 
                      className="flex items-center gap-3 p-2 rounded-xl ringify hover-elevate transition-colors"
                      data-testid={`top-athlete-${athlete.id}`}
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-medium text-white">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">{athlete.name}</p>
                        <p className="text-xs text-slate-400">{athlete.team} • {athlete.xp.toLocaleString()} XP</p>
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
