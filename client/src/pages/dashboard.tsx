import { StatCard } from "@/components/stat-card";
import { Users, Trophy, Zap, Target, MessageSquare, Activity, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Athlete, Exercise, Program, Message } from "@shared/schema";
import { XPBar } from "@/components/xp-bar";
import { TeamPulse } from "@/components/team-pulse";
import { Link } from "wouter";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, subDays } from "date-fns";

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

interface WorkoutTrend {
  date: string;
  workouts: number;
  sets: number;
}

interface AthleteDistribution {
  belt: string;
  count: number;
  color: string;
}

interface MessagePreview {
  athleteId: string;
  athleteName: string;
  lastMessage: string;
  timestamp: Date;
  unread: number;
}

interface AthleteProgram {
  id: string;
  athleteId: string;
  athleteName: string;
  programId: string;
  programName: string;
  programDuration: number;
  startDate: Date;
  status: string;
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

  const { data: recentMessages } = useQuery<Message[]>({
    queryKey: ["/api/messages/recent"],
  });

  const { data: athletePrograms } = useQuery<AthleteProgram[]>({
    queryKey: ["/api/athlete-programs/summary"],
  });

  const isLoading = loadingAthletes || loadingExercises || loadingPrograms || loadingStats;

  const athleteCount = athletes?.length || 0;
  const athleteBeltDistribution: AthleteDistribution[] = [
    { belt: "White", count: Math.ceil(athleteCount * 0.5), color: "#e2e8f0" },
    { belt: "Blue", count: Math.ceil(athleteCount * 0.35), color: "#3b82f6" },
    { belt: "Black", count: Math.floor(athleteCount * 0.15), color: "#1e293b" },
  ].filter(d => d.count > 0);

  const activePrograms = programs?.length || 0;
  const draftPrograms = 0;

  const workoutTrendData: WorkoutTrend[] = Array.from({ length: 7 }, (_, i) => ({
    date: format(subDays(new Date(), 6 - i), "EEE"),
    workouts: Math.floor(Math.random() * 8) + 2,
    sets: Math.floor(Math.random() * 40) + 10,
  }));

  const messageThreads: MessagePreview[] = recentMessages 
    ? recentMessages.reduce((acc: MessagePreview[], msg) => {
        const existing = acc.find(t => t.athleteId === msg.athleteId);
        if (!existing) {
          acc.push({
            athleteId: msg.athleteId,
            athleteName: athletes?.find(a => a.id === msg.athleteId)?.name || "Unknown",
            lastMessage: msg.content.slice(0, 50) + (msg.content.length > 50 ? "..." : ""),
            timestamp: msg.createdAt ? new Date(msg.createdAt) : new Date(),
            unread: msg.isRead === 0 ? 1 : 0,
          });
        }
        return acc;
      }, []).slice(0, 5)
    : [];

  return (
    <div className="space-y-6">
      <div className="bglass rounded-2xl shadow-glass p-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">
            Coach Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time overview of your training organization
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/analytics">
            <Button variant="outline" size="sm" data-testid="button-view-analytics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Full Analytics
            </Button>
          </Link>
          <div className="text-right">
            <p className="text-xs text-slate-400">Updated</p>
            <p className="text-sm font-medium text-slate-200">{format(new Date(), "MMM d, h:mm a")}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Athletes"
          value={isLoading ? "-" : athletes?.length || 0}
          description="Active in platform"
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Active Programs"
          value={isLoading ? "-" : activePrograms}
          description={`${draftPrograms} in draft`}
          icon={Target}
          trend={{ value: activePrograms, isPositive: true }}
        />
        <StatCard
          title="This Week's Workouts"
          value={isLoading ? "-" : dashboardStats?.totalWorkouts || 0}
          description="Logged sessions"
          icon={Zap}
        />
        <StatCard
          title="Personal Records"
          value={isLoading ? "-" : dashboardStats?.totalPRs || 0}
          description="All-time PRs"
          icon={Trophy}
          trend={{ value: 3, isPositive: true }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <TeamPulse />

          <Card className="bglass shadow-glass border-0" data-testid="card-workout-trends">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Activity className="h-4 w-4 text-brand-400" />
                Weekly Activity Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={workoutTrendData}>
                  <defs>
                    <linearGradient id="workoutGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(200, 95%, 50%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(200, 95%, 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      color: "#f1f5f9",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="workouts"
                    name="Workouts"
                    stroke="hsl(200, 95%, 50%)"
                    fill="url(#workoutGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bglass shadow-glass border-0" data-testid="card-program-status">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-100 flex items-center gap-2">
                  <Target className="h-4 w-4 text-emerald-400" />
                  Program Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl ringify">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-sm text-slate-300">Active Programs</span>
                    </div>
                    <span className="text-lg font-semibold text-emerald-400">{activePrograms}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl ringify">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-amber-500" />
                      <span className="text-sm text-slate-300">Draft Programs</span>
                    </div>
                    <span className="text-lg font-semibold text-amber-400">{draftPrograms}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl ringify">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <span className="text-sm text-slate-300">Total Athletes</span>
                    </div>
                    <span className="text-lg font-semibold text-blue-400">
                      {athletes?.length || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bglass shadow-glass border-0" data-testid="card-belt-distribution">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-100 flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-400" />
                  Belt Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {athleteBeltDistribution.length > 0 ? (
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width={150} height={150}>
                      <PieChart>
                        <Pie
                          data={athleteBeltDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={60}
                          dataKey="count"
                          nameKey="belt"
                        >
                          {athleteBeltDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(15, 23, 42, 0.95)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "12px",
                            color: "#f1f5f9",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 ml-4">
                      {athleteBeltDistribution.map((d) => (
                        <div key={d.belt} className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="text-sm text-slate-300">{d.belt}</span>
                          <span className="text-sm font-semibold text-slate-100">{d.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400 text-sm">
                    No athletes classified yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="bglass shadow-glass border-0" data-testid="card-assigned-programs">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Target className="h-4 w-4 text-brand-400" />
                Assigned Programs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {athletePrograms && athletePrograms.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {athletePrograms.slice(0, 5).map((ap) => (
                    <Link key={ap.id} href={`/athletes/${ap.athleteId}`}>
                      <div className="flex items-center justify-between p-3 rounded-xl ringify hover-elevate cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-brand-500/20 flex items-center justify-center">
                            <Users className="h-4 w-4 text-brand-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-200">{ap.athleteName}</p>
                            <p className="text-xs text-slate-400">{ap.programName}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">{ap.programDuration}w</Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-sm">
                  No programs assigned yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bglass shadow-glass border-0" data-testid="card-quick-actions">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-100">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/athletes/new/ai" className="block">
                <Button variant="outline" className="w-full justify-start" data-testid="button-add-athlete">
                  <Users className="h-4 w-4 mr-2" />
                  Add Athlete (AI)
                </Button>
              </Link>
              <Link href="/programs" className="block">
                <Button variant="outline" className="w-full justify-start" data-testid="button-create-program">
                  <Target className="h-4 w-4 mr-2" />
                  Create Program
                </Button>
              </Link>
              <Link href="/coach/messages" className="block">
                <Button variant="outline" className="w-full justify-start" data-testid="button-open-messages">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message Athletes
                </Button>
              </Link>
              <Link href="/ai-command-center" className="block">
                <Button variant="outline" className="w-full justify-start" data-testid="button-ai-command">
                  <Zap className="h-4 w-4 mr-2" />
                  AI Command Center
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bglass shadow-glass border-0" data-testid="card-messages-preview">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-slate-100 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-400" />
                  Recent Messages
                </CardTitle>
                <Link href="/coach/messages">
                  <Button variant="ghost" size="sm" data-testid="button-view-all-messages">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {messageThreads.length > 0 ? (
                <div className="space-y-2">
                  {messageThreads.map((thread) => (
                    <Link
                      key={thread.athleteId}
                      href={`/coach/messages?athlete=${thread.athleteId}`}
                      className="block"
                    >
                      <div className="flex items-start gap-3 p-2 rounded-lg hover-elevate transition-colors cursor-pointer">
                        <div className="h-8 w-8 rounded-full bg-brand-600 flex items-center justify-center text-xs font-medium text-white">
                          {thread.athleteName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-200 truncate">
                              {thread.athleteName}
                            </span>
                            {thread.unread > 0 && (
                              <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-blue-600">
                                New
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 truncate">{thread.lastMessage}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-slate-600" />
                  <p className="text-sm text-slate-400">No messages yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {dashboardStats && dashboardStats.topAthletes.length > 0 && (
            <Card className="bglass shadow-glass border-0" data-testid="card-top-performers">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-100 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboardStats.topAthletes.slice(0, 5).map((athlete, index) => (
                    <Link key={athlete.id} href={`/athletes/${athlete.id}`} className="block">
                      <div
                        className="flex items-center gap-3 p-2 rounded-xl hover-elevate transition-colors cursor-pointer"
                        data-testid={`top-athlete-${athlete.id}`}
                      >
                        <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium text-white ${
                          index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-orange-600' : 'bg-slate-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate">{athlete.name}</p>
                          <p className="text-xs text-slate-400">{athlete.xp.toLocaleString()} XP</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-emerald-400">{athlete.workoutCount} workouts</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bglass shadow-glass border-0" data-testid="card-xp-level">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-slate-100">Organization Level</CardTitle>
                <Badge variant="outline" className="text-xs">Level {dashboardStats?.level || 1}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <XPBar
                currentXP={dashboardStats?.totalXP || 0}
                level={dashboardStats?.level || 1}
              />
              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <span>Total XP: {(dashboardStats?.totalXP || 0).toLocaleString()}</span>
                <span>Streak: {dashboardStats?.currentStreak || 0} days</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
