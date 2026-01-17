import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Dumbbell, 
  Play,
  Pause,
  SkipForward,
  Trophy,
  Clock
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface ExerciseSet {
  setNumber: number;
  targetReps: number;
  targetWeight?: number;
  actualReps?: number;
  actualWeight?: number;
  completed: boolean;
}

interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  sets: ExerciseSet[];
  notes?: string;
  completed: boolean;
}

export default function MobileWorkout() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [setData, setSetData] = useState<Record<string, Record<number, { reps: number; weight: number }>>>({});
  const [completedSets, setCompletedSets] = useState<Record<string, Set<number>>>({});
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);

  const { data: todayWorkout, isLoading } = useQuery<{ exercises?: WorkoutExercise[] }>({
    queryKey: ["/api/mobile/athlete/today-workout"],
    enabled: !!user,
  });

  const logSetMutation = useMutation({
    mutationFn: async (data: { exerciseId: string; setNumber: number; reps: number; weight: number }) => {
      return apiRequest("POST", "/api/mobile/athlete/log-set", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mobile/athlete/today-workout"] });
    },
  });

  const completeWorkoutMutation = useMutation({
    mutationFn: async (data: { duration: number }) => {
      return apiRequest("POST", "/api/mobile/athlete/complete-workout", data);
    },
    onSuccess: () => {
      toast({ title: "Workout Complete!", description: "Great job on finishing your session!" });
      setLocation("/m/workout/rpe");
    },
  });

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </MobileLayout>
    );
  }

  const exercises: WorkoutExercise[] = todayWorkout?.exercises || [
    { id: "1", exerciseId: "ex1", exerciseName: "Barbell Back Squat", sets: [
      { setNumber: 1, targetReps: 8, targetWeight: 135, completed: false },
      { setNumber: 2, targetReps: 8, targetWeight: 155, completed: false },
      { setNumber: 3, targetReps: 6, targetWeight: 175, completed: false },
    ], completed: false },
    { id: "2", exerciseId: "ex2", exerciseName: "Romanian Deadlift", sets: [
      { setNumber: 1, targetReps: 10, targetWeight: 95, completed: false },
      { setNumber: 2, targetReps: 10, targetWeight: 115, completed: false },
      { setNumber: 3, targetReps: 10, targetWeight: 115, completed: false },
    ], completed: false },
    { id: "3", exerciseId: "ex3", exerciseName: "Walking Lunges", sets: [
      { setNumber: 1, targetReps: 12, completed: false },
      { setNumber: 2, targetReps: 12, completed: false },
      { setNumber: 3, targetReps: 12, completed: false },
    ], completed: false },
  ];

  const handleStartWorkout = () => {
    setWorkoutStarted(true);
    setWorkoutStartTime(new Date());
  };

  const handleCompleteSet = (exerciseId: string, setNumber: number) => {
    const exerciseData = setData[exerciseId] || {};
    const currentSet = exerciseData[setNumber] || { reps: 0, weight: 0 };
    
    setCompletedSets(prev => {
      const exerciseSets = new Set(prev[exerciseId] || []);
      exerciseSets.add(setNumber);
      return { ...prev, [exerciseId]: exerciseSets };
    });

    logSetMutation.mutate({
      exerciseId,
      setNumber,
      reps: currentSet.reps,
      weight: currentSet.weight,
    });

    toast({ title: "Set Logged", description: `Set ${setNumber} completed` });
  };

  const handleUpdateSet = (exerciseId: string, setNumber: number, field: "reps" | "weight", value: number) => {
    setSetData(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [setNumber]: {
          ...prev[exerciseId]?.[setNumber],
          [field]: value,
        },
      },
    }));
  };

  const handleCompleteWorkout = () => {
    if (workoutStartTime) {
      const duration = Math.round((new Date().getTime() - workoutStartTime.getTime()) / 60000);
      completeWorkoutMutation.mutate({ duration });
    }
  };

  const isSetCompleted = (exerciseId: string, setNumber: number) => {
    return completedSets[exerciseId]?.has(setNumber) || false;
  };

  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedSetCount = Object.values(completedSets).reduce((acc, sets) => acc + sets.size, 0);
  const progress = totalSets > 0 ? (completedSetCount / totalSets) * 100 : 0;

  if (!workoutStarted) {
    return (
      <MobileLayout>
        <div className="p-4 space-y-6">
          <header className="flex items-center gap-3">
            <Link href="/m">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Today's Workout</h1>
          </header>

          <Card className="bg-gradient-to-br from-primary/20 to-teal-500/20 border-0">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-primary/30 flex items-center justify-center mx-auto">
                <Dumbbell className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{exercises.length} Exercises</h2>
                <p className="text-sm text-slate-400">{totalSets} Total Sets</p>
              </div>
              <Button size="lg" className="w-full" onClick={handleStartWorkout} data-testid="button-start-workout">
                <Play className="w-5 h-5 mr-2" />
                Start Workout
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-400">Exercise Preview</h3>
            {exercises.map((exercise, idx) => (
              <Card key={exercise.id} className="bglass border-0">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-ink-3 flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{exercise.exerciseName}</p>
                    <p className="text-xs text-slate-400">{exercise.sets.length} sets</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout hideNav>
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-40 bg-ink-1/95 backdrop-blur-lg border-b border-ink-3 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">
                {workoutStartTime ? formatDuration(workoutStartTime) : "0:00"}
              </span>
            </div>
            <Badge variant="secondary">{completedSetCount}/{totalSets} Sets</Badge>
          </div>
          <div className="h-2 bg-ink-3 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-teal-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </header>

        <div className="flex-1 p-4 space-y-4 pb-24">
          {exercises.map((exercise, idx) => {
            const isExpanded = expandedExercise === exercise.id || idx === currentExerciseIndex;
            const exerciseCompletedSets = completedSets[exercise.id]?.size || 0;
            const allSetsCompleted = exerciseCompletedSets === exercise.sets.length;

            return (
              <Card 
                key={exercise.id} 
                className={`bglass border-0 overflow-hidden transition-all ${allSetsCompleted ? 'opacity-60' : ''}`}
                data-testid={`exercise-card-${exercise.id}`}
              >
                <CardHeader 
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedExercise(isExpanded ? null : exercise.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        allSetsCompleted ? 'bg-green-500/30 text-green-400' : 'bg-ink-3'
                      }`}>
                        {allSetsCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold">{exercise.exerciseName}</CardTitle>
                        <p className="text-xs text-slate-400">{exerciseCompletedSets}/{exercise.sets.length} sets done</p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </CardHeader>
                
                {isExpanded && (
                  <CardContent className="p-4 pt-0 space-y-3">
                    {exercise.sets.map((set) => {
                      const completed = isSetCompleted(exercise.id, set.setNumber);
                      const currentData = setData[exercise.id]?.[set.setNumber] || { 
                        reps: set.targetReps, 
                        weight: set.targetWeight || 0 
                      };

                      return (
                        <div 
                          key={set.setNumber}
                          className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                            completed ? 'bg-green-500/10 border border-green-500/30' : 'bg-ink-3/50'
                          }`}
                          data-testid={`set-${exercise.id}-${set.setNumber}`}
                        >
                          <div className="w-8 h-8 rounded-full bg-ink-2 flex items-center justify-center text-sm font-bold">
                            {set.setNumber}
                          </div>
                          
                          <div className="flex-1 flex items-center gap-2">
                            <div className="flex-1">
                              <label className="text-[10px] text-slate-500 uppercase">Weight</label>
                              <Input
                                type="number"
                                value={currentData.weight}
                                onChange={(e) => handleUpdateSet(exercise.id, set.setNumber, "weight", parseInt(e.target.value) || 0)}
                                className="h-10 text-center text-lg font-bold bg-ink-2 border-0"
                                disabled={completed}
                                data-testid={`input-weight-${set.setNumber}`}
                              />
                            </div>
                            <div className="flex-1">
                              <label className="text-[10px] text-slate-500 uppercase">Reps</label>
                              <Input
                                type="number"
                                value={currentData.reps}
                                onChange={(e) => handleUpdateSet(exercise.id, set.setNumber, "reps", parseInt(e.target.value) || 0)}
                                className="h-10 text-center text-lg font-bold bg-ink-2 border-0"
                                disabled={completed}
                                data-testid={`input-reps-${set.setNumber}`}
                              />
                            </div>
                          </div>

                          <Button
                            size="icon"
                            variant={completed ? "default" : "outline"}
                            className={completed ? "bg-green-500 hover:bg-green-600" : ""}
                            onClick={() => !completed && handleCompleteSet(exercise.id, set.setNumber)}
                            disabled={completed}
                            data-testid={`button-complete-set-${set.setNumber}`}
                          >
                            <Check className="w-5 h-5" />
                          </Button>
                        </div>
                      );
                    })}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-ink-1/95 backdrop-blur-lg border-t border-ink-3 safe-area-pb">
          <Button 
            size="lg" 
            className="w-full"
            onClick={handleCompleteWorkout}
            disabled={completedSetCount === 0}
            data-testid="button-finish-workout"
          >
            <Trophy className="w-5 h-5 mr-2" />
            Finish Workout
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
}

function formatDuration(startTime: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
  const minutes = Math.floor(diff / 60);
  const seconds = diff % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
