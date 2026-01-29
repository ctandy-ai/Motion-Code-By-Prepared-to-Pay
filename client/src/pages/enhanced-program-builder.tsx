import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Users, Settings, Layers } from "lucide-react";
import { ExerciseSidebar } from "@/components/builder/exercise-sidebar";
import { WeekDayGrid } from "@/components/builder/week-day-grid";
import { InlineEngineGuidance } from "@/components/builder/inline-engine-guidance";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Program, Exercise, ProgramExercise, Athlete } from "@shared/schema";

interface PhaseOption {
  value: string;
  label: string;
}

interface WaveWeekOption {
  value: number;
  label: string;
  description: string;
}

interface EngineOptions {
  phases: PhaseOption[];
  waveWeeks: WaveWeekOption[];
}

export default function EnhancedProgramBuilder() {
  const { programId } = useParams<{ programId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | undefined>();
  const [phase, setPhase] = useState("PRESEASON_A");
  const [waveWeek, setWaveWeek] = useState(1);

  const { data: program, isLoading: loadingProgram } = useQuery<Program>({
    queryKey: ["/api/programs", programId],
    queryFn: async () => {
      const response = await fetch(`/api/programs/${programId}`);
      if (!response.ok) throw new Error("Failed to fetch program");
      return response.json();
    },
  });

  const { data: programExercises = [], isLoading: loadingExercises } = useQuery<ProgramExercise[]>({
    queryKey: ["/api/programs", programId, "exercises"],
    queryFn: async () => {
      const response = await fetch(`/api/programs/${programId}/exercises`);
      if (!response.ok) throw new Error("Failed to fetch program exercises");
      return response.json();
    },
  });

  const { data: allExercises = [] } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });

  const { data: athletes = [] } = useQuery<Athlete[]>({
    queryKey: ["/api/athletes"],
  });

  const { data: engineOptions } = useQuery<EngineOptions>({
    queryKey: ["/api/program-engine/options"],
  });

  const exercisesWithDetails = useMemo(() => {
    return programExercises
      .filter((pe) => pe.weekNumber === selectedWeek)
      .map((pe) => ({
        ...pe,
        exercise: allExercises.find((e) => e.id === pe.exerciseId),
      }));
  }, [programExercises, selectedWeek, allExercises]);

  const weeklyStats = useMemo(() => {
    let plyoContacts = 0;
    let hardLowerSets = 0;
    let speedTouches = 0;
    
    exercisesWithDetails.forEach((pe) => {
      const ex = pe.exercise;
      if (!ex) return;
      
      const category = ex.category?.toLowerCase() || "";
      if (category.includes("plyo") || category.includes("jump")) {
        plyoContacts += (pe.sets || 3) * (pe.reps || 8);
      }
      if (category.includes("squat") || category.includes("deadlift") || category.includes("leg")) {
        hardLowerSets += pe.sets || 3;
      }
      if (category.includes("sprint") || category.includes("speed")) {
        speedTouches += 1;
      }
    });
    
    return { plyoContacts, hardLowerSets, speedTouches };
  }, [exercisesWithDetails]);

  const addExerciseMutation = useMutation({
    mutationFn: async (data: { exercise: Exercise; day: number }) => {
      const maxOrder = programExercises
        .filter((pe) => pe.weekNumber === selectedWeek && pe.dayNumber === data.day)
        .reduce((max, pe) => Math.max(max, pe.orderIndex), -1);
      
      return apiRequest("POST", "/api/program-exercises", {
        programId,
        exerciseId: data.exercise.id,
        weekNumber: selectedWeek,
        dayNumber: data.day,
        sets: 3,
        reps: 10,
        restSeconds: 90,
        notes: "",
        orderIndex: maxOrder + 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs", programId, "exercises"] });
      toast({ title: "Exercise added" });
    },
    onError: () => {
      toast({ title: "Failed to add exercise", variant: "destructive" });
    },
  });

  const updateExerciseMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ProgramExercise> }) => {
      return apiRequest("PATCH", `/api/program-exercises/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs", programId, "exercises"] });
    },
  });

  const deleteExerciseMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/program-exercises/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs", programId, "exercises"] });
      toast({ title: "Exercise removed" });
    },
  });

  const swapExerciseMutation = useMutation({
    mutationFn: async ({ programExerciseId, newExerciseId }: { programExerciseId: string; newExerciseId: string }) => {
      return apiRequest("PATCH", `/api/program-exercises/${programExerciseId}`, {
        exerciseId: newExerciseId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs", programId, "exercises"] });
      toast({ title: "Exercise swapped" });
    },
    onError: () => {
      toast({ title: "Failed to swap exercise", variant: "destructive" });
    },
  });

  const handleExerciseDrop = (exercise: Exercise, day: number) => {
    addExerciseMutation.mutate({ exercise, day });
  };

  const handleExerciseUpdate = (id: string, updates: Partial<ProgramExercise>) => {
    updateExerciseMutation.mutate({ id, updates });
  };

  const handleExerciseDelete = (id: string) => {
    deleteExerciseMutation.mutate(id);
  };

  const handleExerciseSwap = (programExerciseId: string, newExerciseId: string) => {
    swapExerciseMutation.mutate({ programExerciseId, newExerciseId });
  };

  if (loadingProgram) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-2 border-brand-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background" data-testid="enhanced-program-builder">
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/programs")}
            data-testid="back-button"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-slate-100">
              {program?.name || "Program Builder"}
            </h1>
            <p className="text-xs text-slate-400">
              {program?.duration || 12} weeks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-500" />
            <Select value={selectedAthleteId || "none"} onValueChange={(v) => setSelectedAthleteId(v === "none" ? undefined : v)}>
              <SelectTrigger className="h-8 w-[180px] text-xs bg-slate-800/50 border-slate-600" data-testid="select-athlete">
                <SelectValue placeholder="Select athlete" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No athlete (generic)</SelectItem>
                {athletes.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-slate-500" />
            <Select value={phase} onValueChange={setPhase}>
              <SelectTrigger className="h-8 w-[140px] text-xs bg-slate-800/50 border-slate-600" data-testid="select-phase">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {engineOptions?.phases.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={String(waveWeek)} onValueChange={(v) => setWaveWeek(parseInt(v))}>
              <SelectTrigger className="h-8 w-[100px] text-xs bg-slate-800/50 border-slate-600" data-testid="select-wave">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {engineOptions?.waveWeeks.map((w) => (
                  <SelectItem key={w.value} value={String(w.value)}>W{w.value}: {w.description}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {selectedAthleteId && (
        <InlineEngineGuidance
          athleteId={selectedAthleteId}
          phase={phase}
          waveWeek={waveWeek}
          currentPlyoContacts={weeklyStats.plyoContacts}
          currentHardSets={weeklyStats.hardLowerSets}
          currentSpeedTouches={weeklyStats.speedTouches}
        />
      )}

      <div className="flex-1 flex min-h-0">
        <div className="w-64 shrink-0">
          <ExerciseSidebar
            beltLevel="WHITE"
            onExerciseSelect={(exercise) => {
              addExerciseMutation.mutate({ exercise, day: 1 });
            }}
            budgetWarnings={{
              plyoOverBudget: weeklyStats.plyoContacts > 100,
              setsOverBudget: weeklyStats.hardLowerSets > 20,
            }}
          />
        </div>

        <div className="flex-1 min-w-0">
          <WeekDayGrid
            weekNumber={selectedWeek}
            totalWeeks={program?.duration || 12}
            exercises={exercisesWithDetails}
            allExercises={allExercises}
            onWeekChange={setSelectedWeek}
            onExerciseDrop={handleExerciseDrop}
            onExerciseUpdate={handleExerciseUpdate}
            onExerciseDelete={handleExerciseDelete}
            onExerciseSwap={handleExerciseSwap}
            trainingDays={4}
          />
        </div>
      </div>
    </div>
  );
}
