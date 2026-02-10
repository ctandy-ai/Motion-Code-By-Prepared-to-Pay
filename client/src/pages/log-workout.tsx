import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Athlete, Exercise, AthleteProgram, Program, WorkoutLog, PersonalRecord, InsertWorkoutLog } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Dumbbell, 
  Plus, 
  Minus, 
  Trophy, 
  Check, 
  Zap,
  Target,
  Trash2,
  ChevronRight,
  Flame
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface SetData {
  reps: number;
  weight: number;
}

interface ExerciseLogEntry {
  exerciseId: string;
  exerciseName: string;
  sets: SetData[];
  notes: string;
}

export default function LogWorkout() {
  const { athleteId } = useParams<{ athleteId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");
  const [currentSets, setCurrentSets] = useState<SetData[]>([{ reps: 10, weight: 45 }]);
  const [exerciseNotes, setExerciseNotes] = useState("");
  const [loggedExercises, setLoggedExercises] = useState<ExerciseLogEntry[]>([]);
  const [prAlert, setPrAlert] = useState<{ exerciseName: string; weight: number } | null>(null);

  const { data: athlete, isLoading: loadingAthlete } = useQuery<Athlete>({
    queryKey: ["/api/athletes", athleteId],
    queryFn: async () => {
      const response = await fetch(`/api/athletes/${athleteId}`);
      if (!response.ok) throw new Error("Failed to fetch athlete");
      return response.json();
    },
    enabled: !!athleteId,
  });

  const { data: exercises = [] } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });

  const { data: athletePrograms = [] } = useQuery<AthleteProgram[]>({
    queryKey: ["/api/athletes", athleteId, "programs"],
    queryFn: async () => {
      const response = await fetch(`/api/athletes/${athleteId}/programs`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!athleteId,
  });

  const { data: personalRecords = [] } = useQuery<PersonalRecord[]>({
    queryKey: ["/api/personal-records", athleteId],
    queryFn: async () => {
      const response = await fetch(`/api/personal-records?athleteId=${athleteId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!athleteId,
  });

  const submitWorkoutMutation = useMutation({
    mutationFn: async (logs: InsertWorkoutLog[]) => {
      const results = [];
      for (const log of logs) {
        try {
          const response = await apiRequest("POST", "/api/workout-logs", log);
          results.push(response);
        } catch (err) {
          console.error("Failed to submit workout log:", err);
          throw err;
        }
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workout-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workout-logs", athleteId] });
      queryClient.invalidateQueries({ queryKey: ["/api/athletes", athleteId, "stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/personal-records", athleteId] });
      queryClient.invalidateQueries({ queryKey: ["/api/personal-records"] });
      toast({
        title: "Workout Logged!",
        description: `${loggedExercises.length} exercises recorded successfully.`,
      });
      setLocation(`/athlete/${athleteId}/portal`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save workout. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createPRMutation = useMutation({
    mutationFn: async (prData: { athleteId: string; exerciseId: string; maxWeight: number; reps: number }) => {
      return apiRequest("POST", "/api/personal-records", prData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-records", athleteId] });
    },
  });

  const selectedExercise = useMemo(() => {
    return exercises.find(e => e.id === selectedExerciseId);
  }, [exercises, selectedExerciseId]);

  const currentPR = useMemo(() => {
    if (!selectedExerciseId) return null;
    return personalRecords.find(pr => pr.exerciseId === selectedExerciseId);
  }, [personalRecords, selectedExerciseId]);

  const addSet = () => {
    const lastSet = currentSets[currentSets.length - 1] || { reps: 10, weight: 45 };
    setCurrentSets([...currentSets, { ...lastSet }]);
  };

  const removeSet = (index: number) => {
    if (currentSets.length > 1) {
      setCurrentSets(currentSets.filter((_, i) => i !== index));
    }
  };

  const updateSet = (index: number, field: 'reps' | 'weight', value: number) => {
    const updated = [...currentSets];
    updated[index] = { ...updated[index], [field]: Math.max(0, value) };
    setCurrentSets(updated);
  };

  const quickAdjust = (index: number, field: 'reps' | 'weight', delta: number) => {
    updateSet(index, field, currentSets[index][field] + delta);
  };

  const checkForPR = (exerciseId: string, exerciseName: string, sets: SetData[]): boolean => {
    const maxWeight = Math.max(...sets.map(s => s.weight));
    const existingPR = personalRecords.find(pr => pr.exerciseId === exerciseId);
    
    if (!existingPR || maxWeight > existingPR.maxWeight) {
      const bestSet = sets.reduce((best, current) => 
        current.weight > best.weight ? current : best
      , sets[0]);
      
      createPRMutation.mutate({
        athleteId: athleteId!,
        exerciseId,
        maxWeight: bestSet.weight,
        reps: bestSet.reps,
      });
      
      setPrAlert({ exerciseName, weight: maxWeight });
      setTimeout(() => setPrAlert(null), 3000);
      return true;
    }
    return false;
  };

  const addExerciseToLog = () => {
    if (!selectedExerciseId || !selectedExercise) return;
    
    const entry: ExerciseLogEntry = {
      exerciseId: selectedExerciseId,
      exerciseName: selectedExercise.name,
      sets: [...currentSets],
      notes: exerciseNotes,
    };
    
    checkForPR(selectedExerciseId, selectedExercise.name, currentSets);
    
    setLoggedExercises([...loggedExercises, entry]);
    setSelectedExerciseId("");
    setCurrentSets([{ reps: 10, weight: 45 }]);
    setExerciseNotes("");
  };

  const removeFromLog = (index: number) => {
    setLoggedExercises(loggedExercises.filter((_, i) => i !== index));
  };

  const submitWorkout = () => {
    if (loggedExercises.length === 0) {
      toast({
        title: "No Exercises",
        description: "Add at least one exercise to your workout log.",
        variant: "destructive",
      });
      return;
    }

    const logs: InsertWorkoutLog[] = loggedExercises.map(entry => ({
      athleteId: athleteId!,
      programExerciseId: "manual-entry",
      exerciseId: entry.exerciseId,
      sets: entry.sets.length,
      repsPerSet: entry.sets.map(s => s.reps).join(","),
      weightPerSet: entry.sets.map(s => s.weight).join(","),
      notes: entry.notes || undefined,
    }));

    submitWorkoutMutation.mutate(logs);
  };

  if (loadingAthlete) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/30 rounded-full animate-spin border-t-primary" />
          <Zap className="absolute inset-0 m-auto w-6 h-6 text-primary animate-pulse" />
        </div>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
        <Target className="w-16 h-16 text-slate-600" />
        <h2 className="text-xl font-semibold text-slate-300">Athlete not found</h2>
        <Button onClick={() => setLocation("/athletes")} data-testid="button-back-to-athletes">
          Back to Athletes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 max-w-4xl mx-auto">
      {prAlert && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5 duration-300">
          <Card className="bg-gradient-to-r from-amber-500 to-amber-600 border-0 shadow-2xl">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-lg">New Personal Record!</p>
                <p className="text-amber-100">{prAlert.exerciseName}: {prAlert.weight} kg</p>
              </div>
              <Flame className="w-8 h-8 text-white animate-pulse" />
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation(`/athlete/${athleteId}/portal`)}
          data-testid="button-back"
          className="hover-elevate"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100">Log Workout</h1>
          <p className="text-sm text-slate-500">{athlete.name}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="border-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Dumbbell className="w-5 h-5 text-primary" />
                Add Exercise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Select Exercise</Label>
                <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
                  <SelectTrigger data-testid="select-exercise">
                    <SelectValue placeholder="Choose an exercise..." />
                  </SelectTrigger>
                  <SelectContent>
                    {exercises.map(exercise => (
                      <SelectItem key={exercise.id} value={exercise.id}>
                        {exercise.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedExercise && (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary">{selectedExercise.category}</Badge>
                    <Badge variant="outline">{selectedExercise.muscleGroup}</Badge>
                    {currentPR && (
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                        <Trophy className="w-3 h-3 mr-1" />
                        PR: {currentPR.maxWeight}kg
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Sets</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={addSet}
                        data-testid="button-add-set"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Set
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {currentSets.map((set, index) => (
                        <div 
                          key={index} 
                          className="flex items-center gap-2 p-3 rounded-lg bg-ink-3/50"
                          data-testid={`set-row-${index}`}
                        >
                          <span className="text-sm text-slate-500 w-8">#{index + 1}</span>
                          
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => quickAdjust(index, 'reps', -1)}
                              data-testid={`button-reps-minus-${index}`}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <Input
                              type="number"
                              value={set.reps}
                              onChange={(e) => updateSet(index, 'reps', parseInt(e.target.value) || 0)}
                              className="w-16 text-center h-8"
                              data-testid={`input-reps-${index}`}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => quickAdjust(index, 'reps', 1)}
                              data-testid={`button-reps-plus-${index}`}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <span className="text-xs text-slate-500 w-8">reps</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => quickAdjust(index, 'weight', -5)}
                              data-testid={`button-weight-minus-${index}`}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <Input
                              type="number"
                              value={set.weight}
                              onChange={(e) => updateSet(index, 'weight', parseFloat(e.target.value) || 0)}
                              className="w-20 text-center h-8"
                              data-testid={`input-weight-${index}`}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => quickAdjust(index, 'weight', 5)}
                              data-testid={`button-weight-plus-${index}`}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <span className="text-xs text-slate-500 w-6">kg</span>
                          </div>

                          {currentSets.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-400 hover:text-red-300"
                              onClick={() => removeSet(index)}
                              data-testid={`button-remove-set-${index}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notes (optional)</Label>
                    <Textarea
                      value={exerciseNotes}
                      onChange={(e) => setExerciseNotes(e.target.value)}
                      placeholder="How did this feel? Any adjustments needed?"
                      className="resize-none"
                      rows={2}
                      data-testid="input-notes"
                    />
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={addExerciseToLog}
                    data-testid="button-add-to-log"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Add to Workout
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="w-5 h-5 text-accent" />
                Today's Log
                {loggedExercises.length > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {loggedExercises.length} exercises
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loggedExercises.length === 0 ? (
                <div className="text-center py-8">
                  <Dumbbell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500">No exercises logged yet</p>
                  <p className="text-xs text-slate-600 mt-1">Select an exercise and add sets to begin</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {loggedExercises.map((entry, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg bg-ink-3/30 hover:bg-ink-3/50 transition-colors"
                      data-testid={`logged-exercise-${index}`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <Dumbbell className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-200 truncate">{entry.exerciseName}</p>
                        <p className="text-xs text-slate-500">
                          {entry.sets.length} sets • Max: {Math.max(...entry.sets.map(s => s.weight))}kg
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => removeFromLog(index)}
                        data-testid={`button-remove-logged-${index}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            {loggedExercises.length > 0 && (
              <CardFooter className="pt-0">
                <Button 
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  onClick={submitWorkout}
                  disabled={submitWorkoutMutation.isPending}
                  data-testid="button-submit-workout"
                >
                  {submitWorkoutMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <ChevronRight className="w-4 h-4 mr-2" />
                      Complete Workout
                    </>
                  )}
                </Button>
              </CardFooter>
            )}
          </Card>

          <Card className="border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-slate-200">XP Preview</p>
                  <p className="text-xs text-slate-500">
                    +{(loggedExercises.length * 50) + loggedExercises.reduce((sum, e) => sum + (e.sets.length * 10), 0)} XP base
                  </p>
                  <p className="text-xs text-amber-400/80">
                    +100 XP bonus for each new PR
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
