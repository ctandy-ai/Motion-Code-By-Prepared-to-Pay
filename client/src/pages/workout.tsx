import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dumbbell, Plus, Trash2, CheckCircle2, Clock, TrendingUp, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Athlete } from "@shared/schema";

interface TodayWorkoutItem {
  programExercise: {
    id: string;
    sets: number;
    reps: number;
    restSeconds: number | null;
    notes: string | null;
  };
  exercise: {
    id: string;
    name: string;
    category: string;
    muscleGroup: string;
    difficulty: string;
  };
  program: {
    id: string;
    name: string;
  };
  athleteProgramId: string;
}

interface SetLog {
  reps: number;
  weight: number;
}

export default function Workout() {
  const { toast } = useToast();
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("");
  const [workoutSets, setWorkoutSets] = useState<Record<string, SetLog[]>>({});
  const [workoutNotes, setWorkoutNotes] = useState<Record<string, string>>({});

  const { data: athletes = [], isLoading: loadingAthletes } = useQuery<Athlete[]>({
    queryKey: ["/api/athletes"],
  });

  const { data: todayWorkout = [], isLoading } = useQuery<TodayWorkoutItem[]>({
    queryKey: ["/api/athletes", selectedAthleteId, "today-workout"],
    enabled: !!selectedAthleteId,
  });

  // Clear workout state when athlete changes to prevent data leakage
  useEffect(() => {
    setWorkoutSets({});
    setWorkoutNotes({});
  }, [selectedAthleteId]);

  const { data: recentLogs = [] } = useQuery<any[]>({
    queryKey: ["/api/workout-logs"],
  });

  const logWorkoutMutation = useMutation({
    mutationFn: async (exerciseData: {
      programExerciseId: string;
      exerciseId: string;
      sets: SetLog[];
      notes: string;
    }) => {
      const { programExerciseId, exerciseId, sets, notes } = exerciseData;
      
      const payload = {
        athleteId: selectedAthleteId,
        programExerciseId,
        exerciseId,
        sets: sets.length,
        repsPerSet: sets.map(s => s.reps).join(","),
        weightPerSet: sets.map(s => s.weight).join(","),
        notes: notes || undefined,
      };
      
      return apiRequest("POST", "/api/workout-logs", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workout-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/athletes", selectedAthleteId, "today-workout"] });
      
      // Clear the logged exercise's sets and notes
      setWorkoutSets({});
      setWorkoutNotes({});
      
      toast({
        title: "Workout logged!",
        description: "Great work! Keep pushing forward.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to log workout",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const initializeSets = (exerciseId: string, numSets: number) => {
    if (!workoutSets[exerciseId]) {
      setWorkoutSets(prev => ({
        ...prev,
        [exerciseId]: Array(numSets).fill(null).map(() => ({ reps: 0, weight: 0 })),
      }));
    }
  };

  const updateSet = (exerciseId: string, setIndex: number, field: "reps" | "weight", value: number) => {
    setWorkoutSets(prev => ({
      ...prev,
      [exerciseId]: prev[exerciseId]?.map((s, i) => 
        i === setIndex ? { ...s, [field]: value } : s
      ) || [],
    }));
  };

  const addSet = (exerciseId: string) => {
    setWorkoutSets(prev => ({
      ...prev,
      [exerciseId]: [...(prev[exerciseId] || []), { reps: 0, weight: 0 }],
    }));
  };

  const removeSet = (exerciseId: string, setIndex: number) => {
    setWorkoutSets(prev => ({
      ...prev,
      [exerciseId]: prev[exerciseId]?.filter((_, i) => i !== setIndex) || [],
    }));
  };

  const handleLogExercise = (item: TodayWorkoutItem) => {
    const sets = workoutSets[item.programExercise.id] || [];
    
    if (sets.length === 0 || sets.every(s => s.reps === 0 && s.weight === 0)) {
      toast({
        title: "No sets logged",
        description: "Please log at least one set with reps and weight.",
        variant: "destructive",
      });
      return;
    }

    logWorkoutMutation.mutate({
      programExerciseId: item.programExercise.id,
      exerciseId: item.exercise.id,
      sets,
      notes: workoutNotes[item.programExercise.id] || "",
    });
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3" data-testid="text-page-title">
            <Dumbbell className="h-8 w-8 text-primary" />
            Today's Workout
          </h1>
          <p className="text-slate-400 mt-2">
            Log your sets, reps, and weights to track your progress
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Select Athlete
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAthletes ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={selectedAthleteId}
                onValueChange={setSelectedAthleteId}
                data-testid="select-athlete"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an athlete to view their workout" />
                </SelectTrigger>
                <SelectContent>
                  {athletes.map((athlete) => (
                    <SelectItem 
                      key={athlete.id} 
                      value={athlete.id}
                      data-testid={`option-athlete-${athlete.id}`}
                    >
                      {athlete.name} {athlete.team && `- ${athlete.team}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {!selectedAthleteId ? (
          <Card>
            <CardContent className="p-12 text-center">
              <User className="h-16 w-16 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select an athlete to begin</h3>
              <p className="text-sm text-slate-400">
                Choose an athlete from the dropdown above to view their workout
              </p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-96 w-full" />
          </div>
        ) : null}

        {selectedAthleteId && !isLoading && todayWorkout.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Clock className="h-16 w-16 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No workout scheduled for today</h3>
              <p className="text-sm text-slate-400">
                Rest day or check program assignments
              </p>
            </CardContent>
          </Card>
        )}

        {selectedAthleteId && !isLoading && todayWorkout.length > 0 && (
          <div className="space-y-6">
            {todayWorkout.map((item) => {
              const exerciseId = item.programExercise.id;
              if (!workoutSets[exerciseId]) {
                initializeSets(exerciseId, item.programExercise.sets);
              }
              const sets = workoutSets[exerciseId] || [];

              return (
                <Card key={exerciseId} data-testid={`card-exercise-${exerciseId}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-2xl" data-testid={`text-exercise-name-${exerciseId}`}>
                          {item.exercise.name}
                        </CardTitle>
                        <CardDescription className="mt-2 flex items-center gap-2 flex-wrap">
                          <Badge variant="outline">{item.exercise.category}</Badge>
                          <Badge variant="outline">{item.exercise.muscleGroup}</Badge>
                          <Badge variant="outline">{item.program.name}</Badge>
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-400">Prescribed</div>
                        <div className="text-lg font-semibold">
                          {item.programExercise.sets} × {item.programExercise.reps}
                        </div>
                        {item.programExercise.restSeconds && (
                          <div className="text-xs text-slate-400 mt-1">
                            Rest: {item.programExercise.restSeconds}s
                          </div>
                        )}
                      </div>
                    </div>
                    {item.programExercise.notes && (
                      <div className="mt-3 p-3 bg-muted rounded-md text-sm">
                        <strong>Coach Notes:</strong> {item.programExercise.notes}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Log Your Sets</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addSet(exerciseId)}
                          data-testid={`button-add-set-${exerciseId}`}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Set
                        </Button>
                      </div>

                      {sets.map((set, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3"
                          data-testid={`set-row-${exerciseId}-${index}`}
                        >
                          <div className="w-12 text-sm font-medium text-slate-400">
                            Set {index + 1}
                          </div>
                          <div className="flex-1 flex items-center gap-3">
                            <div className="flex-1">
                              <Label htmlFor={`reps-${exerciseId}-${index}`} className="sr-only">
                                Reps
                              </Label>
                              <Input
                                id={`reps-${exerciseId}-${index}`}
                                type="number"
                                placeholder="Reps"
                                value={set.reps || ""}
                                onChange={(e) => updateSet(exerciseId, index, "reps", parseInt(e.target.value) || 0)}
                                data-testid={`input-reps-${exerciseId}-${index}`}
                              />
                            </div>
                            <div className="flex-1">
                              <Label htmlFor={`weight-${exerciseId}-${index}`} className="sr-only">
                                Weight (lbs)
                              </Label>
                              <Input
                                id={`weight-${exerciseId}-${index}`}
                                type="number"
                                placeholder="Weight (lbs)"
                                value={set.weight || ""}
                                onChange={(e) => updateSet(exerciseId, index, "weight", parseFloat(e.target.value) || 0)}
                                data-testid={`input-weight-${exerciseId}-${index}`}
                              />
                            </div>
                          </div>
                          {sets.length > 1 && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeSet(exerciseId, index)}
                              data-testid={`button-remove-set-${exerciseId}-${index}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div>
                      <Label htmlFor={`notes-${exerciseId}`} className="text-sm">
                        Notes (Optional)
                      </Label>
                      <Textarea
                        id={`notes-${exerciseId}`}
                        placeholder="How did it feel? Any observations?"
                        value={workoutNotes[exerciseId] || ""}
                        onChange={(e) => setWorkoutNotes(prev => ({
                          ...prev,
                          [exerciseId]: e.target.value,
                        }))}
                        className="mt-2"
                        rows={2}
                        data-testid={`textarea-notes-${exerciseId}`}
                      />
                    </div>

                    <Button
                      onClick={() => handleLogExercise(item)}
                      disabled={logWorkoutMutation.isPending}
                      className="w-full"
                      data-testid={`button-log-exercise-${exerciseId}`}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {logWorkoutMutation.isPending ? "Logging..." : "Log Exercise"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {recentLogs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Workouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400">
                {recentLogs.length} workouts logged
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
