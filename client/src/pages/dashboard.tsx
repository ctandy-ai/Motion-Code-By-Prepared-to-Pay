import { StatCard } from "@/components/stat-card";
import { Users, Dumbbell, TrendingUp, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Athlete, Exercise, Program } from "@shared/schema";

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
      <div>
        <h1 className="font-heading text-4xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here's what's happening with your training programs.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Athletes"
          value={isLoading ? "-" : athletes?.length || 0}
          description="Active in programs"
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Exercise Library"
          value={isLoading ? "-" : exercises?.length || 0}
          description="Unique movements"
          icon={Dumbbell}
        />
        <StatCard
          title="Active Programs"
          value={isLoading ? "-" : programs?.length || 0}
          description="Training plans"
          icon={Calendar}
        />
        <StatCard
          title="Avg. Compliance"
          value="87%"
          description="Workout completion rate"
          icon={TrendingUp}
          trend={{ value: 5, isPositive: true }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-xl">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center text-sm text-muted-foreground py-8">
                  Loading activity...
                </div>
              ) : (
                <>
                  {athletes && athletes.length > 0 ? (
                    athletes.slice(0, 5).map((athlete) => (
                      <div 
                        key={athlete.id} 
                        className="flex items-center gap-4 p-3 rounded-lg hover-elevate"
                        data-testid={`activity-${athlete.id}`}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                          {athlete.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {athlete.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {athlete.team || "No team assigned"}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      No athletes yet. Add your first athlete to get started!
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-xl">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <span className="text-sm font-medium text-foreground">Workouts This Week</span>
                <span className="text-2xl font-bold text-foreground">142</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <span className="text-sm font-medium text-foreground">Total Volume (lbs)</span>
                <span className="text-2xl font-bold text-foreground">45.2K</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                <span className="text-sm font-medium text-foreground">New PRs</span>
                <span className="text-2xl font-bold text-foreground">23</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
