import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { BarChart3, TrendingUp, Activity, Users, Trophy, Heart } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { format } from "date-fns";
import { PageHeader } from "@/components/page-header";

interface AnalyticsData {
  strengthData: Array<{
    date: string;
    exerciseId: string;
    exerciseName: string;
    maxWeight: number;
    athleteName: string;
  }>;
  prTimeline: Array<{
    id: string;
    athleteName: string;
    exerciseName: string;
    weight: number;
    reps: number;
    date: string;
  }>;
  wellnessData: Array<{
    date: string;
    readinessScore: number;
    sleepQuality: number;
    energyLevel: number;
    athleteName: string;
  }>;
  volumeData: Array<{
    week: string;
    sets: number;
    reps: number;
    workouts: number;
  }>;
  topExercises: Array<{
    exerciseId: string;
    exerciseName: string;
    prCount: number;
  }>;
  summary: {
    totalAthletes: number;
    totalWorkouts: number;
    totalPRs: number;
    totalSurveys: number;
    avgReadiness: number;
  };
}

export default function Analytics() {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics/overview"],
  });

  const aggregateWellnessByDate = (data: AnalyticsData["wellnessData"]) => {
    const byDate: Record<string, { scores: number[]; sleep: number[]; energy: number[] }> = {};
    data.forEach((d) => {
      if (!byDate[d.date]) {
        byDate[d.date] = { scores: [], sleep: [], energy: [] };
      }
      byDate[d.date].scores.push(d.readinessScore);
      byDate[d.date].sleep.push(d.sleepQuality);
      byDate[d.date].energy.push(d.energyLevel);
    });

    return Object.entries(byDate)
      .map(([date, values]) => ({
        date,
        readiness: Math.round(values.scores.reduce((a, b) => a + b, 0) / values.scores.length),
        sleep: Math.round(values.sleep.reduce((a, b) => a + b, 0) / values.sleep.length),
        energy: Math.round(values.energy.reduce((a, b) => a + b, 0) / values.energy.length),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const formatWeekLabel = (week: string) => {
    try {
      return format(new Date(week), "MMM d");
    } catch {
      return week;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Analytics Dashboard"
          icon={BarChart3}
          description="Loading performance data..."
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const wellnessTrend = analytics?.wellnessData ? aggregateWellnessByDate(analytics.wellnessData) : [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics Dashboard"
        icon={BarChart3}
        description="Performance insights across all athletes"
        actions={
          <Link href="/progress">
            <Button variant="outline" size="sm" data-testid="button-individual-progress">
              <TrendingUp className="h-4 w-4 mr-2" />
              Athlete Progress
            </Button>
          </Link>
        }
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card data-testid="stat-athletes">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-brand-600/20">
                <Users className="h-6 w-6 text-brand-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Athletes</p>
                <p className="text-2xl font-bold text-foreground">
                  {analytics?.summary.totalAthletes || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-workouts">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-600/20">
                <Activity className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Workouts</p>
                <p className="text-2xl font-bold text-foreground">
                  {analytics?.summary.totalWorkouts || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-prs">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-600/20">
                <Trophy className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Personal Records</p>
                <p className="text-2xl font-bold text-foreground">
                  {analytics?.summary.totalPRs || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-surveys">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-600/20">
                <Heart className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Wellness Surveys</p>
                <p className="text-2xl font-bold text-foreground">
                  {analytics?.summary.totalSurveys || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="stat-readiness">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-cyan-600/20">
                <TrendingUp className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Readiness</p>
                <p className="text-2xl font-bold text-foreground">
                  {analytics?.summary.avgReadiness || 0}
                  <span className="text-sm text-muted-foreground font-normal">/10</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card data-testid="chart-volume">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-brand-400" />
              Weekly Training Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.volumeData && analytics.volumeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={analytics.volumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis
                    dataKey="week"
                    tickFormatter={formatWeekLabel}
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
                    labelFormatter={formatWeekLabel}
                  />
                  <Legend />
                  <Bar
                    dataKey="sets"
                    name="Total Sets"
                    fill="hsl(200, 95%, 50%)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="workouts"
                    name="Workouts"
                    fill="hsl(175, 70%, 50%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                <p>No volume data available yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="chart-wellness">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Heart className="h-4 w-4 text-purple-400" />
              Team Wellness Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            {wellnessTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={wellnessTrend}>
                  <defs>
                    <linearGradient id="readinessGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(175, 70%, 50%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(175, 70%, 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => format(new Date(d), "MMM d")}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  />
                  <YAxis
                    domain={[0, 10]}
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
                    labelFormatter={(d) => format(new Date(d), "MMMM d, yyyy")}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="readiness"
                    name="Readiness Score"
                    stroke="hsl(175, 70%, 50%)"
                    fill="url(#readinessGradient)"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="sleep"
                    name="Sleep Quality"
                    stroke="hsl(200, 95%, 60%)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="energy"
                    name="Energy Level"
                    stroke="hsl(45, 85%, 55%)"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                <p>No wellness data available yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" data-testid="chart-prs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400" />
              Recent Personal Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.prTimeline && analytics.prTimeline.length > 0 ? (
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
                {analytics.prTimeline.map((pr) => (
                  <div
                    key={pr.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover-elevate transition-all"
                    data-testid={`pr-item-${pr.id}`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-600/20">
                      <Trophy className="h-5 w-5 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {pr.exerciseName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pr.athleteName} • {pr.weight}kg x {pr.reps} reps
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {pr.date ? format(new Date(pr.date), "MMM d") : "N/A"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[360px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No personal records logged yet</p>
                  <p className="text-xs mt-1">PRs will appear here as athletes log workouts</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="chart-top-exercises">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              Top Exercises by PRs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.topExercises && analytics.topExercises.length > 0 ? (
              <div className="space-y-3">
                {analytics.topExercises.map((exercise, index) => (
                  <div
                    key={exercise.exerciseId}
                    className="flex items-center gap-3"
                    data-testid={`top-exercise-${index}`}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold text-sm ${
                        index === 0
                          ? "bg-amber-600/30 text-amber-300"
                          : index === 1
                          ? "bg-muted text-muted-foreground"
                          : index === 2
                          ? "bg-orange-700/30 text-orange-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {exercise.exerciseName}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-emerald-400">
                        {exercise.prCount}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">PRs</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                <p>No exercise data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card data-testid="chart-strength">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-brand-400" />
            Strength Progression (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics?.strengthData && analytics.strengthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={analytics.strengthData.reduce((acc: any[], curr) => {
                  const existing = acc.find((d) => d.date === curr.date);
                  if (existing) {
                    if (!existing[curr.exerciseName] || existing[curr.exerciseName] < curr.maxWeight) {
                      existing[curr.exerciseName] = curr.maxWeight;
                    }
                  } else {
                    acc.push({ date: curr.date, [curr.exerciseName]: curr.maxWeight });
                  }
                  return acc;
                }, []).sort((a, b) => a.date.localeCompare(b.date))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => format(new Date(d), "MMM d")}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  label={{
                    value: "Weight (kg)",
                    angle: -90,
                    position: "insideLeft",
                    fill: "#94a3b8",
                    fontSize: 12,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#f1f5f9",
                  }}
                  labelFormatter={(d) => format(new Date(d), "MMMM d, yyyy")}
                />
                <Legend />
                {analytics.strengthData
                  .reduce((exercises: string[], curr) => {
                    if (!exercises.includes(curr.exerciseName)) {
                      exercises.push(curr.exerciseName);
                    }
                    return exercises;
                  }, [])
                  .slice(0, 5)
                  .map((exerciseName, index) => {
                    const colors = [
                      "hsl(200, 95%, 50%)",
                      "hsl(175, 70%, 50%)",
                      "hsl(15, 85%, 60%)",
                      "hsl(45, 85%, 55%)",
                      "hsl(150, 60%, 45%)",
                    ];
                    return (
                      <Line
                        key={exerciseName}
                        type="monotone"
                        dataKey={exerciseName}
                        name={exerciseName}
                        stroke={colors[index % colors.length]}
                        strokeWidth={2}
                        dot={{ fill: colors[index % colors.length], r: 4 }}
                        connectNulls
                      />
                    );
                  })}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No strength data available yet</p>
                <p className="text-xs mt-1">Log workouts to see progression trends</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
