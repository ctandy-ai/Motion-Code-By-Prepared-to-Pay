import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Award, Target, Zap } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";

const strengthData = [
  { week: "Week 1", bench: 185, squat: 225, deadlift: 275 },
  { week: "Week 2", bench: 190, squat: 235, deadlift: 285 },
  { week: "Week 3", bench: 195, squat: 245, deadlift: 295 },
  { week: "Week 4", bench: 200, squat: 255, deadlift: 305 },
  { week: "Week 5", bench: 205, squat: 265, deadlift: 315 },
  { week: "Week 6", bench: 210, squat: 275, deadlift: 325 },
];

const volumeData = [
  { week: "Week 1", volume: 42500 },
  { week: "Week 2", volume: 45200 },
  { week: "Week 3", volume: 48100 },
  { week: "Week 4", volume: 46800 },
  { week: "Week 5", volume: 51200 },
  { week: "Week 6", volume: 53400 },
];

export default function Progress() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-4xl font-bold text-foreground">Progress Tracking</h1>
        <p className="text-muted-foreground mt-2">
          Monitor performance metrics and personal records over time.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total PRs
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">127</div>
            <p className="text-xs text-green-600 mt-1">+8 this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Strength Gain
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">+12%</div>
            <p className="text-xs text-muted-foreground mt-1">Past 6 weeks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Volume
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">287K</div>
            <p className="text-xs text-muted-foreground mt-1">lbs this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Goal Progress
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">73%</div>
            <p className="text-xs text-muted-foreground mt-1">On track</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl">Strength Progression</CardTitle>
          <CardDescription>
            Track your progress across major lifts over the past 6 weeks
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                <Line 
                  type="monotone" 
                  dataKey="bench" 
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={2}
                  name="Bench Press"
                />
                <Line 
                  type="monotone" 
                  dataKey="squat" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  name="Squat"
                />
                <Line 
                  type="monotone" 
                  dataKey="deadlift" 
                  stroke="hsl(var(--chart-3))" 
                  strokeWidth={2}
                  name="Deadlift"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-xl">Training Volume</CardTitle>
            <CardDescription>
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

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-xl">Recent Personal Records</CardTitle>
            <CardDescription>
              Latest achievements from your athletes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { athlete: "John Smith", exercise: "Bench Press", weight: 225, date: "2 days ago" },
                { athlete: "Sarah Johnson", exercise: "Squat", weight: 185, date: "3 days ago" },
                { athlete: "Mike Williams", exercise: "Deadlift", weight: 405, date: "5 days ago" },
                { athlete: "Emily Davis", exercise: "Power Clean", weight: 135, date: "1 week ago" },
              ].map((pr, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-4 p-3 rounded-lg border hover-elevate"
                  data-testid={`pr-${index}`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Award className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {pr.athlete}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pr.exercise}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="font-semibold">
                      {pr.weight} lbs
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {pr.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
