import { useState, useEffect, useMemo, useCallback } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dumbbell, Plus, Trash2, CheckCircle2, Clock, TrendingUp, User, Trophy, Calculator, History, Zap, Play, Pause, SkipForward, Timer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Athlete } from "@shared/schema";

function InlineRestTimer({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || remaining <= 0) {
      if (remaining <= 0) onDone();
      return;
    }
    const t = setInterval(() => setRemaining(r => r - 1), 1000);
    return () => clearInterval(t);
  }, [remaining, paused, onDone]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct = (remaining / seconds) * 100;

  return (
    <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-md" data-testid="inline-rest-timer">
      <Timer className="h-4 w-4 text-primary shrink-0" />
      <div className="flex-1">
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className="text-sm font-mono font-semibold tabular-nums text-slate-200 w-12 text-right">
        {mins}:{secs.toString().padStart(2, "0")}
      </span>
      <Button size="icon" variant="ghost" onClick={() => setPaused(!paused)} data-testid="button-pause-rest">
        {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
      </Button>
      <Button size="icon" variant="ghost" onClick={onDone} data-testid="button-skip-rest">
        <SkipForward className="h-3 w-3" />
      </Button>
    </div>
  );
}

interface TodayWorkoutItem {
  programExercise: {
    id: string;
    sets: number;
    reps: number;
    restSeconds: number | null;
    notes: string | null;
    intensityPercent?: number | null;
    tempo?: string | null;
    rpeTarget?: number | null;
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

interface ExerciseHistoryEntry {
  id: string;
  date: string;
  sets: number;
  repsPerSet: string;
  weightPerSet: string;
  bestWeight: number;
  bestReps: number;
  totalVolume: number;
  estimated1RM: number;
  notes?: string;
}

interface LogResult {
  isPR: boolean;
  newPR: { maxWeight: number; reps: number } | null;
  estimated1RM: number;
  totalVolume: number;
}

function ExerciseHistoryPanel({ athleteId, exerciseId, exerciseName }: {
  athleteId: string;
  exerciseId: string;
  exerciseName: string;
}) {
  const { data: history = [], isLoading } = useQuery<ExerciseHistoryEntry[]>({
    queryKey: ["/api/workout-logs", athleteId, "exercise-history", exerciseId],
    enabled: !!athleteId && !!exerciseId,
  });

  if (isLoading) return <Skeleton className="h-24 w-full" />;
  if (history.length === 0) return null;

  const lastSession = history[0];
  const prevSession = history.length > 1 ? history[1] : null;
  const volumeTrend = prevSession ? lastSession.totalVolume - prevSession.totalVolume : 0;

  return (
    <div className="mt-3 p-3 bg-slate-800/40 rounded-md space-y-2" data-testid={`history-panel-${exerciseId}`}>
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
        <History className="h-3 w-3" />
        Last Session
      </div>
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span>{new Date(lastSession.date).toLocaleDateString()}</span>
        <span>Best: {lastSession.bestWeight}lbs x {lastSession.bestReps}</span>
        <span className="flex items-center gap-1">
          <Calculator className="h-3 w-3" />
          Est 1RM: {lastSession.estimated1RM}lbs
        </span>
        <span>Vol: {lastSession.totalVolume.toLocaleString()}lbs</span>
        {volumeTrend !== 0 && (
          <Badge variant="outline" className={volumeTrend > 0 ? "text-emerald-400 border-emerald-400/30" : "text-red-400 border-red-400/30"}>
            {volumeTrend > 0 ? "+" : ""}{volumeTrend.toLocaleString()}lbs
          </Badge>
        )}
      </div>
      {history.length > 1 && (
        <div className="text-xs text-slate-500">
          {history.length} previous sessions recorded
        </div>
      )}
    </div>
  );
}

export default function Workout() {
  const { toast } = useToast();
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("");
  const [workoutSets, setWorkoutSets] = useState<Record<string, SetLog[]>>({});
  const [workoutNotes, setWorkoutNotes] = useState<Record<string, string>>({});
  const [prCelebration, setPrCelebration] = useState<{ exerciseName: string; weight: number; reps: number } | null>(null);
  const [lastLogResult, setLastLogResult] = useState<Record<string, LogResult>>({});
  const [activeRestTimer, setActiveRestTimer] = useState<string | null>(null);
  const [restTimerSeconds, setRestTimerSeconds] = useState<Record<string, number>>({});

  const { data: athletes = [], isLoading: loadingAthletes } = useQuery<Athlete[]>({
    queryKey: ["/api/athletes"],
  });

  const { data: todayWorkout = [], isLoading } = useQuery<TodayWorkoutItem[]>({
    queryKey: ["/api/athletes", selectedAthleteId, "today-workout"],
    enabled: !!selectedAthleteId,
  });

  useEffect(() => {
    setWorkoutSets({});
    setWorkoutNotes({});
    setLastLogResult({});
  }, [selectedAthleteId]);

  const sessionStats = useMemo(() => {
    const results = Object.values(lastLogResult);
    if (results.length === 0) return null;
    const totalVolume = results.reduce((s, r) => s + r.totalVolume, 0);
    const prCount = results.filter(r => r.isPR).length;
    return { totalVolume, prCount, exercisesLogged: results.length };
  }, [lastLogResult]);

  const logWorkoutMutation = useMutation({
    mutationFn: async (exerciseData: {
      programExerciseId: string;
      exerciseId: string;
      exerciseName: string;
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

      const response = await apiRequest("POST", "/api/workout-logs", payload);
      return response.json();
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/workout-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/athletes", selectedAthleteId, "today-workout"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workout-logs", selectedAthleteId, "exercise-history", variables.exerciseId] });

      setLastLogResult(prev => ({
        ...prev,
        [variables.programExerciseId]: {
          isPR: result.isPR,
          newPR: result.newPR,
          estimated1RM: result.estimated1RM,
          totalVolume: result.totalVolume,
        },
      }));

      setActiveRestTimer(variables.programExerciseId);

      if (result.isPR && result.newPR) {
        setPrCelebration({
          exerciseName: variables.exerciseName,
          weight: result.newPR.maxWeight,
          reps: result.newPR.reps,
        });
        setTimeout(() => setPrCelebration(null), 4000);
      }

      toast({
        title: result.isPR ? "NEW PR! Workout logged!" : "Workout logged!",
        description: result.estimated1RM > 0
          ? `Est. 1RM: ${result.estimated1RM}lbs | Volume: ${result.totalVolume.toLocaleString()}lbs`
          : "Great work! Keep pushing forward.",
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
      exerciseName: item.exercise.name,
      sets,
      notes: workoutNotes[item.programExercise.id] || "",
    });
  };

  const liveEstimate1RM = (sets: SetLog[]) => {
    let best = 0;
    sets.forEach(s => {
      if (s.weight > 0 && s.reps > 0) {
        const est = Math.round(s.weight * (1 + s.reps / 30));
        if (est > best) best = est;
      }
    });
    return best;
  };

  const liveVolume = (sets: SetLog[]) => {
    return sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {prCelebration && (
          <div className="fixed inset-x-0 top-4 z-50 flex justify-center" data-testid="pr-celebration">
            <div className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black px-6 py-3 rounded-md shadow-lg flex items-center gap-3 animate-bounce">
              <Trophy className="h-6 w-6" />
              <div>
                <div className="font-bold text-lg">NEW PERSONAL RECORD!</div>
                <div className="text-sm">{prCelebration.exerciseName}: {prCelebration.weight}lbs x {prCelebration.reps}</div>
              </div>
              <Trophy className="h-6 w-6" />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3" data-testid="text-page-title">
              <Dumbbell className="h-8 w-8 text-primary" />
              Today's Workout
            </h1>
            <p className="text-slate-400 mt-2">
              Log your sets, reps, and weights to track your progress
            </p>
          </div>

          {sessionStats && sessionStats.exercisesLogged > 0 && (
            <div className="flex items-center gap-4 text-sm" data-testid="session-summary">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Zap className="h-4 w-4 text-amber-400" />
                <span>{sessionStats.exercisesLogged} logged</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span>{sessionStats.totalVolume.toLocaleString()}lbs total</span>
              </div>
              {sessionStats.prCount > 0 && (
                <Badge variant="outline" className="text-amber-400 border-amber-400/30">
                  {sessionStats.prCount} PR{sessionStats.prCount !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          )}
        </div>

        <Card className="bglass shadow-glass border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-100">
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
                <SelectTrigger data-testid="trigger-select-athlete">
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
          <Card className="bglass shadow-glass border-0">
            <CardContent className="p-12 text-center">
              <User className="h-16 w-16 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-slate-100">Select an athlete to begin</h3>
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
          <Card className="bglass shadow-glass border-0">
            <CardContent className="p-12 text-center">
              <Clock className="h-16 w-16 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-slate-100">No workout scheduled for today</h3>
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
              const logResult = lastLogResult[exerciseId];
              const liveEst = liveEstimate1RM(sets);
              const liveVol = liveVolume(sets);

              return (
                <Card key={exerciseId} data-testid={`card-exercise-${exerciseId}`} className="bglass shadow-glass border-0">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-2xl text-slate-100" data-testid={`text-exercise-name-${exerciseId}`}>
                          {item.exercise.name}
                          {logResult?.isPR && (
                            <Badge variant="outline" className="ml-3 text-amber-400 border-amber-400/30">
                              <Trophy className="h-3 w-3 mr-1" />
                              PR
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-2 flex items-center gap-2 flex-wrap text-slate-400">
                          <Badge variant="outline">{item.exercise.category}</Badge>
                          <Badge variant="outline">{item.exercise.muscleGroup}</Badge>
                          <Badge variant="outline">{item.program.name}</Badge>
                        </CardDescription>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-sm text-slate-400">Prescribed</div>
                        <div className="text-lg font-semibold text-slate-100">
                          {item.programExercise.sets} x {item.programExercise.reps}
                        </div>
                        {item.programExercise.intensityPercent && (
                          <div className="text-xs text-amber-400">{item.programExercise.intensityPercent}% 1RM</div>
                        )}
                        {item.programExercise.tempo && (
                          <div className="text-xs text-slate-400">Tempo: {item.programExercise.tempo}</div>
                        )}
                        {item.programExercise.rpeTarget && (
                          <div className="text-xs text-slate-400">RPE: {item.programExercise.rpeTarget}</div>
                        )}
                        {item.programExercise.restSeconds && (
                          <div className="text-xs text-slate-400">
                            Rest: {item.programExercise.restSeconds}s
                          </div>
                        )}
                      </div>
                    </div>
                    {item.programExercise.notes && (
                      <div className="mt-3 p-3 bg-slate-800/30 rounded-md text-sm text-slate-200">
                        <strong className="text-slate-100">Coach Notes:</strong> {item.programExercise.notes}
                      </div>
                    )}

                    <ExerciseHistoryPanel
                      athleteId={selectedAthleteId}
                      exerciseId={item.exercise.id}
                      exerciseName={item.exercise.name}
                    />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-slate-100">Log Your Sets</Label>
                        <div className="flex items-center gap-3">
                          {liveEst > 0 && (
                            <div className="flex items-center gap-1 text-xs text-slate-400" data-testid={`live-1rm-${exerciseId}`}>
                              <Calculator className="h-3 w-3" />
                              Est 1RM: <span className="text-slate-200 font-medium">{liveEst}lbs</span>
                            </div>
                          )}
                          {liveVol > 0 && (
                            <div className="text-xs text-slate-400" data-testid={`live-volume-${exerciseId}`}>
                              Vol: <span className="text-slate-200 font-medium">{liveVol.toLocaleString()}lbs</span>
                            </div>
                          )}
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

                    {activeRestTimer === exerciseId && (
                      <InlineRestTimer
                        seconds={item.programExercise.restSeconds || 90}
                        onDone={() => setActiveRestTimer(null)}
                      />
                    )}

                    {logResult && (
                      <div className="flex items-center gap-4 p-3 bg-slate-800/30 rounded-md text-xs" data-testid={`log-result-${exerciseId}`}>
                        {logResult.estimated1RM > 0 && (
                          <span className="text-slate-300">
                            <Calculator className="h-3 w-3 inline mr-1" />
                            Est 1RM: {logResult.estimated1RM}lbs
                          </span>
                        )}
                        <span className="text-slate-300">
                          <TrendingUp className="h-3 w-3 inline mr-1" />
                          Volume: {logResult.totalVolume.toLocaleString()}lbs
                        </span>
                        {logResult.isPR && (
                          <Badge variant="outline" className="text-amber-400 border-amber-400/30">
                            <Trophy className="h-3 w-3 mr-1" />
                            Personal Record!
                          </Badge>
                        )}
                      </div>
                    )}

                    <div>
                      <Label htmlFor={`notes-${exerciseId}`} className="text-sm text-slate-100">
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
      </div>
    </div>
  );
}
