import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Award, Target, Zap } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import type { WorkoutLog, PersonalRecord, Athlete, Exercise } from "@shared/schema";
import { format, parseISO, startOfWeek, differenceInWeeks, subWeeks } from "date-fns";

export default function Progress() {
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("6");

  const { data: athletes = [] } = useQuery<Athlete[]>({
    queryKey: ['/api/athletes'],
  });

  const { data: allWorkoutLogs = [] } = useQuery<WorkoutLog[]>({
    queryKey: ['/api/workout-logs'],
  });

  const { data: allPersonalRecords = [] } = useQuery<PersonalRecord[]>({
    queryKey: ['/api/personal-records'],
  });

  const { data: exercises = [] } = useQuery<Exercise[]>({
    queryKey: ['/api/exercises'],
  });

  const filteredLogs = selectedAthleteId === "all"
    ? allWorkoutLogs
    : allWorkoutLogs.filter(log => log.athleteId === selectedAthleteId);

  const filteredPRs = selectedAthleteId === "all"
    ? allPersonalRecords
    : allPersonalRecords.filter(pr => pr.athleteId === selectedAthleteId);

  const strengthData = useMemo(() => {
    const weeks = parseInt(timeRange);
    const now = new Date();
    const weeklyData: Record<string, Record<string, number>> = {};

    filteredLogs.forEach(log => {
      if (!log.completedAt) return;
      const logDate = parseISO(log.completedAt.toString());
      const weeksDiff = differenceInWeeks(now, logDate);
      
      if (weeksDiff >= weeks) return;

      const weekKey = `Week ${weeks - weeksDiff}`;
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {};
      }

      const exercise = exercises.find(e => e.id === log.exerciseId);
      if (!exercise) return;

      const weights = log.weightPerSet.split(',').map(w => parseFloat(w)).filter(w => !isNaN(w));
      const maxWeight = Math.max(...weights, 0);

      if (!weeklyData[weekKey][exercise.name] || weeklyData[weekKey][exercise.name] < maxWeight) {
        weeklyData[weekKey][exercise.name] = maxWeight;
      }
    });

    return Array.from({ length: weeks }, (_, i) => {
      const weekKey = `Week ${i + 1}`;
      return { week: weekKey, ...(weeklyData[weekKey] || {}) };
    });
  }, [filteredLogs, exercises, timeRange]);

  const volumeData = useMemo(() => {
    const weeks = parseInt(timeRange);
    const now = new Date();
    const weeklyVolume: Record<string, number> = {};

    filteredLogs.forEach(log => {
      if (!log.completedAt) return;
      const logDate = parseISO(log.completedAt.toString());
      const weeksDiff = differenceInWeeks(now, logDate);
      
      if (weeksDiff >= weeks) return;

      const weekKey = `Week ${weeks - weeksDiff}`;
      
      const weights = log.weightPerSet.split(',').map(w => parseFloat(w)).filter(w => !isNaN(w));
      const reps = log.repsPerSet.split(',').map(r => parseInt(r)).filter(r => !isNaN(r));
      
      let logVolume = 0;
      for (let i = 0; i < Math.min(weights.length, reps.length); i++) {
        logVolume += weights[i] * reps[i];
      }

      weeklyVolume[weekKey] = (weeklyVolume[weekKey] || 0) + logVolume;
    });

    return Array.from({ length: weeks }, (_, i) => {
      const weekKey = `Week ${i + 1}`;
      return { week: weekKey, volume: weeklyVolume[weekKey] || 0 };
    });
  }, [filteredLogs, timeRange]);

  const totalPRs = filteredPRs.length;
  const totalVolume = volumeData.reduce((sum, week) => sum + week.volume, 0);
  const recentPRs = filteredPRs
    .sort((a, b) => {
      const dateA = a.achievedAt ? parseISO(a.achievedAt.toString()) : new Date(0);
      const dateB = b.achievedAt ? parseISO(b.achievedAt.toString()) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 4);
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-4xl font-bold text-slate-100">Progress Tracking</h1>
          <p className="text-slate-400 mt-2">
            Monitor performance metrics and personal records over time.
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]" data-testid="select-time-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4">4 Weeks</SelectItem>
              <SelectItem value="6">6 Weeks</SelectItem>
              <SelectItem value="8">8 Weeks</SelectItem>
              <SelectItem value="12">12 Weeks</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
            <SelectTrigger className="w-[180px]" data-testid="select-athlete-filter">
              <SelectValue placeholder="Filter by athlete" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Athletes</SelectItem>
              {athletes.map((athlete) => (
                <SelectItem key={athlete.id} value={athlete.id}>
                  {athlete.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Total PRs
            </CardTitle>
            <Award className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-100" data-testid="text-total-prs">{totalPRs}</div>
            <p className="text-xs text-slate-400 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="border-0">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Total Workouts
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-100" data-testid="text-total-workouts">{filteredLogs.length}</div>
            <p className="text-xs text-slate-400 mt-1">Completed</p>
          </CardContent>
        </Card>

        <Card className="border-0">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Total Volume
            </CardTitle>
            <Zap className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-100" data-testid="text-total-volume">
              {Math.round(totalVolume).toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-1">lbs total</p>
          </CardContent>
        </Card>

        <Card className="border-0">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">
              Avg Sets/Workout
            </CardTitle>
            <Target className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-100">
              {filteredLogs.length > 0 
                ? Math.round(filteredLogs.reduce((sum, log) => sum + log.sets, 0) / filteredLogs.length)
                : 0}
            </div>
            <p className="text-xs text-slate-400 mt-1">Average</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0">
        <CardHeader>
          <CardTitle className="font-heading text-xl text-slate-100">Strength Progression</CardTitle>
          <CardDescription className="text-slate-400">
            Track max weight lifted per exercise over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {strengthData.every(week => Object.keys(week).length === 1) ? (
            <div className="h-[400px] flex items-center justify-center text-slate-400">
              No workout data available for the selected time range
            </div>
          ) : (
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={strengthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="week" 
                    className="text-xs" 
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    label={{ value: 'Weight (lbs)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  {Object.keys(strengthData[0] || {})
                    .filter(key => key !== 'week')
                    .map((exerciseName, index) => (
                      <Line 
                        key={exerciseName}
                        type="monotone" 
                        dataKey={exerciseName}
                        stroke={`hsl(var(--chart-${(index % 5) + 1}))`}
                        strokeWidth={2}
                        name={exerciseName}
                        connectNulls
                      />
                    ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0">
          <CardHeader>
            <CardTitle className="font-heading text-xl text-slate-100">Training Volume</CardTitle>
            <CardDescription className="text-slate-400">
              Total weight lifted per week (lbs)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="week" 
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0">
          <CardHeader>
            <CardTitle className="font-heading text-xl text-slate-100">Recent Personal Records</CardTitle>
            <CardDescription className="text-slate-400">
              Latest achievements from your athletes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPRs.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">
                  No personal records yet
                </p>
              ) : (
                recentPRs.map((pr) => {
                  const athlete = athletes.find(a => a.id === pr.athleteId);
                  const exercise = exercises.find(e => e.id === pr.exerciseId);
                  return (
                    <div 
                      key={pr.id}
                      className="flex items-center gap-4 p-3 rounded-lg border hover-elevate"
                      data-testid={`pr-${pr.id}`}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Award className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-100 truncate">
                          {athlete?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {exercise?.name || 'Unknown Exercise'}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="font-semibold">
                          {pr.maxWeight} lbs
                        </Badge>
                        <p className="text-xs text-slate-400 mt-1">
                          {pr.achievedAt ? format(parseISO(pr.achievedAt.toString()), 'MMM d') : 'Unknown'}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
