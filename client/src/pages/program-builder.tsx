import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Program, Exercise, ProgramExercise, InsertProgramExercise } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ArrowLeft, Trash2, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProgramExerciseSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function ProgramBuilder() {
  const { programId } = useParams<{ programId: string }>();
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const { toast } = useToast();

  const { data: program, isLoading: loadingProgram } = useQuery<Program>({
    queryKey: ["/api/programs", programId],
    queryFn: async () => {
      const response = await fetch(`/api/programs/${programId}`);
      if (!response.ok) throw new Error("Failed to fetch program");
      return response.json();
    },
  });

  const { data: programExercises, isLoading: loadingExercises } = useQuery<ProgramExercise[]>({
    queryKey: ["/api/programs", programId, "exercises"],
    queryFn: async () => {
      const response = await fetch(`/api/programs/${programId}/exercises`);
      if (!response.ok) throw new Error("Failed to fetch program exercises");
      return response.json();
    },
  });

  const { data: allExercises } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });

  const form = useForm<InsertProgramExercise>({
    resolver: zodResolver(insertProgramExerciseSchema),
    defaultValues: {
      programId: programId || "",
      exerciseId: "",
      weekNumber: 1,
      dayNumber: 1,
      sets: 3,
      reps: 10,
      restSeconds: 90,
      notes: "",
      orderIndex: 0,
    },
  });

  const addExerciseMutation = useMutation({
    mutationFn: (data: InsertProgramExercise) =>
      apiRequest("POST", "/api/program-exercises", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs", programId, "exercises"] });
      setIsDialogOpen(false);
      form.reset({
        programId: programId || "",
        exerciseId: "",
        weekNumber: form.getValues("weekNumber"),
        dayNumber: form.getValues("dayNumber"),
        sets: 3,
        reps: 10,
        restSeconds: 90,
        notes: "",
        orderIndex: 0,
      });
      toast({
        title: "Exercise added",
        description: "The exercise has been added to the program.",
      });
    },
  });

  const deleteExerciseMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/program-exercises/${id}`, undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs", programId, "exercises"] });
      toast({
        title: "Exercise removed",
        description: "The exercise has been removed from the program.",
      });
    },
  });

  const onSubmit = (data: InsertProgramExercise) => {
    const maxOrder = programExercises
      ?.filter((pe) => pe.weekNumber === data.weekNumber && pe.dayNumber === data.dayNumber)
      .reduce((max, pe) => Math.max(max, pe.orderIndex), -1) ?? -1;
    
    addExerciseMutation.mutate({
      ...data,
      orderIndex: maxOrder + 1,
    });
  };

  const groupedExercises: Record<number, Record<number, ProgramExercise[]>> = {};
  programExercises?.forEach((pe) => {
    if (!groupedExercises[pe.weekNumber]) {
      groupedExercises[pe.weekNumber] = {};
    }
    if (!groupedExercises[pe.weekNumber][pe.dayNumber]) {
      groupedExercises[pe.weekNumber][pe.dayNumber] = [];
    }
    groupedExercises[pe.weekNumber][pe.dayNumber].push(pe);
  });

  Object.values(groupedExercises).forEach((weekDays) => {
    Object.values(weekDays).forEach((dayExercises) => {
      dayExercises.sort((a, b) => a.orderIndex - b.orderIndex);
    });
  });

  const getExerciseName = (exerciseId: string) => {
    return allExercises?.find((e) => e.id === exerciseId)?.name || "Unknown Exercise";
  };

  const weekDays = groupedExercises[selectedWeek] || {};
  const daysInWeek = program?.duration ? Math.min(7, program.duration * 7) : 7;

  if (loadingProgram) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold mb-4">Program not found</h2>
        <Button onClick={() => setLocation("/programs")}>Back to Programs</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/programs")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">
              {program.name}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Build your {program.duration}-week training program
            </p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-exercise">
              <Plus className="h-4 w-4 mr-2" />
              Add Exercise
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg">Add Exercise to Program</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="exerciseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exercise</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-exercise">
                            <SelectValue placeholder="Select an exercise" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {allExercises?.map((exercise) => (
                            <SelectItem key={exercise.id} value={exercise.id}>
                              {exercise.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="weekNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Week</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-week">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: program.duration }, (_, i) => i + 1).map((week) => (
                              <SelectItem key={week} value={week.toString()}>
                                Week {week}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dayNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Day</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-day">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 7 }, (_, i) => i + 1).map((day) => (
                              <SelectItem key={day} value={day.toString()}>
                                Day {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sets"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sets</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-sets"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reps"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reps</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-reps"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="restSeconds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rest (seconds)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          value={field.value || ""}
                          data-testid="input-rest"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={addExerciseMutation.isPending}
                    data-testid="button-submit-exercise"
                  >
                    {addExerciseMutation.isPending ? "Adding..." : "Add Exercise"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 border-b pb-4">
        <Calendar className="h-4 w-4 text-slate-400" />
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: program.duration }, (_, i) => i + 1).map((week) => (
            <Button
              key={week}
              variant={selectedWeek === week ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedWeek(week)}
              data-testid={`button-week-${week}`}
            >
              Week {week}
            </Button>
          ))}
        </div>
      </div>

      {loadingExercises ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-[200px] rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : Object.keys(weekDays).length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 7 }, (_, i) => i + 1).map((dayNum) => {
            const dayExercises = weekDays[dayNum] || [];
            if (dayExercises.length === 0) return null;
            
            return (
              <Card key={dayNum} className="border-0" data-testid={`day-card-${dayNum}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center justify-between text-slate-100">
                    <span>Day {dayNum}</span>
                    <Badge variant="secondary" className="text-xs text-slate-100">
                      {dayExercises.length} {dayExercises.length === 1 ? "exercise" : "exercises"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dayExercises.map((pe, index) => (
                      <div
                        key={pe.id}
                        className="flex items-start gap-2 p-2 rounded-md border-0 bg-slate-800/30 hover-elevate transition-colors"
                        data-testid={`program-exercise-${pe.id}`}
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-700/50 text-xs font-medium text-slate-200">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-slate-100">
                            {getExerciseName(pe.exerciseId)}
                          </p>
                          <p className="text-xs text-slate-400">
                            {pe.sets} × {pe.reps} reps
                            {pe.restSeconds && ` • ${pe.restSeconds}s rest`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => deleteExerciseMutation.mutate(pe.id)}
                          data-testid={`button-delete-${pe.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h3 className="text-base font-semibold text-slate-100 mb-2">
            No exercises for Week {selectedWeek}
          </h3>
          <p className="text-sm text-slate-400 mb-6">
            Add exercises to build your training program
          </p>
          <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-first-exercise">
            <Plus className="h-4 w-4 mr-2" />
            Add First Exercise
          </Button>
        </div>
      )}
    </div>
  );
}
