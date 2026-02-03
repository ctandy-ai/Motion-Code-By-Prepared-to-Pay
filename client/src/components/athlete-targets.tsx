import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Target, Plus, Trophy, Trash2, AlertCircle, CheckCircle2, TrendingUp, Calendar } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AthleteTarget, Exercise } from "@shared/schema";
import { format } from "date-fns";

interface AthleteTargetsProps {
  athleteId: string;
}

const targetFormSchema = z.object({
  exerciseId: z.string().min(1, "Please select an exercise"),
  targetType: z.enum(["1rm", "volume", "reps"]),
  targetValue: z.number().min(1, "Target must be greater than 0"),
  currentValue: z.number().optional(),
  unit: z.string().default("kg"),
  deadline: z.string().optional(),
  notes: z.string().optional(),
});

type TargetFormValues = z.infer<typeof targetFormSchema>;

export function AthleteTargets({ athleteId }: AthleteTargetsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<TargetFormValues>({
    resolver: zodResolver(targetFormSchema),
    defaultValues: {
      exerciseId: "",
      targetType: "1rm",
      targetValue: 0,
      unit: "kg",
      notes: "",
    },
  });

  const { data: targets = [], isLoading, error } = useQuery<AthleteTarget[]>({
    queryKey: [`/api/athletes/${athleteId}/targets`],
  });

  const { data: exercises = [] } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: TargetFormValues) => {
      const response = await apiRequest("POST", `/api/athletes/${athleteId}/targets`, {
        ...data,
        deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/athletes/${athleteId}/targets`] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Target created",
        description: "Performance target has been set successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create target. Please try again.",
        variant: "destructive",
      });
    },
  });

  const markAchievedMutation = useMutation({
    mutationFn: async (targetId: string) => {
      const response = await apiRequest("PATCH", `/api/athlete-targets/${targetId}`, {
        status: "achieved",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/athletes/${athleteId}/targets`] });
      toast({
        title: "Target achieved!",
        description: "Congratulations on reaching your goal!",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (targetId: string) => {
      await apiRequest("DELETE", `/api/athlete-targets/${targetId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/athletes/${athleteId}/targets`] });
      toast({
        title: "Target deleted",
        description: "The target has been removed.",
      });
    },
  });

  const onSubmit = (data: TargetFormValues) => {
    createMutation.mutate(data);
  };

  const getExerciseName = (exerciseId: string) => {
    const exercise = exercises.find((e) => e.id === exerciseId);
    return exercise?.name || "Unknown Exercise";
  };

  const getProgressPercentage = (target: AthleteTarget) => {
    if (!target.currentValue || target.currentValue === 0) return 0;
    return Math.min(100, (target.currentValue / target.targetValue) * 100);
  };

  const getTargetTypeLabel = (type: string) => {
    switch (type) {
      case "1rm":
        return "1RM Goal";
      case "volume":
        return "Volume";
      case "reps":
        return "Rep Target";
      default:
        return type;
    }
  };

  const activeTargets = targets.filter((t) => t.status === "active");
  const achievedTargets = targets.filter((t) => t.status === "achieved");

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load targets. Please try again later.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="bglass shadow-glass border-0">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="font-heading text-lg flex items-center gap-2">
          <Target className="w-5 h-5 text-amber-500" />
          Performance Targets
        </CardTitle>
        <Button size="sm" onClick={() => setIsDialogOpen(true)} data-testid="button-add-target">
          <Plus className="w-4 h-4 mr-1" />
          Add Target
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : targets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground" data-testid="empty-targets">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No targets set</p>
            <p className="text-sm">Set 1RM goals and performance targets to track progress.</p>
          </div>
        ) : (
          <div className="space-y-6" data-testid="targets-list">
            {activeTargets.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Active Targets ({activeTargets.length})
                </h4>
                {activeTargets.map((target) => (
                  <div
                    key={target.id}
                    className="p-4 rounded-lg border bg-card/50 space-y-3"
                    data-testid={`target-${target.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold" data-testid={`target-exercise-${target.id}`}>
                          {getExerciseName(target.exerciseId)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{getTargetTypeLabel(target.targetType)}</Badge>
                          {target.deadline && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(target.deadline), "MMM d, yyyy")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => markAchievedMutation.mutate(target.id)}
                          data-testid={`button-achieve-${target.id}`}
                        >
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => deleteMutation.mutate(target.id)}
                          data-testid={`button-delete-${target.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Current: {target.currentValue || 0} {target.unit}
                        </span>
                        <span className="font-medium" data-testid={`target-value-${target.id}`}>
                          Target: {target.targetValue} {target.unit}
                        </span>
                      </div>
                      <Progress value={getProgressPercentage(target)} className="h-2" />
                    </div>
                    {target.notes && (
                      <p className="text-xs text-muted-foreground">{target.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {achievedTargets.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  Achieved ({achievedTargets.length})
                </h4>
                {achievedTargets.slice(0, 3).map((target) => (
                  <div
                    key={target.id}
                    className="p-3 rounded-lg border bg-green-500/10 border-green-500/20"
                    data-testid={`achieved-target-${target.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <span className="font-medium">{getExerciseName(target.exerciseId)}</span>
                      </div>
                      <Badge variant="secondary" className="bg-green-500/20 text-green-600">
                        {target.targetValue} {target.unit}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Performance Target</DialogTitle>
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
                        {exercises.map((exercise) => (
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

              <FormField
                control={form.control}
                name="targetType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-target-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1rm">1RM Goal</SelectItem>
                        <SelectItem value="volume">Volume Target</SelectItem>
                        <SelectItem value="reps">Rep Target</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="targetValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Value</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-target-value"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-unit">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="lbs">lbs</SelectItem>
                          <SelectItem value="reps">reps</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="currentValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Value (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        data-testid="input-current-value"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deadline (optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-deadline" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Training notes or strategy..."
                        className="resize-none"
                        {...field}
                        data-testid="input-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-target">
                  {createMutation.isPending ? "Creating..." : "Create Target"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
