import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Athlete, AthleteProgram, Program, InsertAthleteProgram } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Calendar, Trophy } from "lucide-react";
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
import { insertAthleteProgramSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function AthleteDetail() {
  const { athleteId } = useParams<{ athleteId: string }>();
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const formSchema = z.object({
    athleteId: z.string(),
    programId: z.string(),
    startDate: z.string(),
    status: z.string(),
  });

  type FormValues = z.infer<typeof formSchema>;

  const { data: athlete, isLoading: loadingAthlete } = useQuery<Athlete>({
    queryKey: ["/api/athletes", athleteId],
    queryFn: async () => {
      const response = await fetch(`/api/athletes/${athleteId}`);
      if (!response.ok) throw new Error("Failed to fetch athlete");
      return response.json();
    },
  });

  const { data: athletePrograms, isLoading: loadingPrograms } = useQuery<AthleteProgram[]>({
    queryKey: ["/api/athletes", athleteId, "programs"],
    queryFn: async () => {
      const response = await fetch(`/api/athletes/${athleteId}/programs`);
      if (!response.ok) throw new Error("Failed to fetch athlete programs");
      return response.json();
    },
  });

  const { data: allPrograms } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      athleteId: athleteId || "",
      programId: "",
      startDate: new Date().toISOString().split("T")[0],
      status: "active",
    },
  });

  const assignMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const payload: InsertAthleteProgram = {
        athleteId: data.athleteId,
        programId: data.programId,
        startDate: new Date(data.startDate),
        status: data.status,
      };
      console.log("Sending payload:", payload);
      const result = await apiRequest("POST", "/api/athlete-programs", payload);
      console.log("Response:", result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/athletes", athleteId, "programs"] });
      setIsDialogOpen(false);
      form.reset({
        athleteId: athleteId || "",
        programId: "",
        startDate: new Date().toISOString().split("T")[0],
        status: "active",
      });
      toast({
        title: "Program assigned",
        description: "The program has been assigned to the athlete.",
      });
    },
    onError: (error: any) => {
      console.error("Assignment error:", error);
      toast({
        title: "Failed to assign program",
        description: error.message || "An error occurred while assigning the program.",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/athlete-programs/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/athletes", athleteId, "programs"] });
      toast({
        title: "Status updated",
        description: "The program status has been updated.",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    assignMutation.mutate(data);
  };

  const getProgramName = (programId: string) => {
    return allPrograms?.find((p) => p.id === programId)?.name || "Unknown Program";
  };

  const getProgramDuration = (programId: string) => {
    return allPrograms?.find((p) => p.id === programId)?.duration || 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "completed":
        return "secondary";
      case "paused":
        return "outline";
      default:
        return "outline";
    }
  };

  if (loadingAthlete) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold mb-4">Athlete not found</h2>
        <Button onClick={() => setLocation("/athletes")}>Back to Athletes</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/athletes")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              {athlete.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {athlete.team && athlete.position
                ? `${athlete.team} • ${athlete.position}`
                : athlete.team || athlete.position || "No team assigned"}
            </p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-assign-program">
              <Plus className="h-4 w-4 mr-2" />
              Assign Program
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-lg">Assign Program to {athlete.name}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="programId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-program">
                            <SelectValue placeholder="Select a program" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {allPrograms?.map((program) => (
                            <SelectItem key={program.id} value={program.id}>
                              {program.name} ({program.duration} weeks)
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
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <input
                          type="date"
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          data-testid="input-start-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
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
                    disabled={assignMutation.isPending}
                    data-testid="button-submit-assignment"
                  >
                    {assignMutation.isPending ? "Assigning..." : "Assign Program"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Programs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {athletePrograms?.filter((ap) => ap.status === "active").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Programs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {athletePrograms?.filter((ap) => ap.status === "completed").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Programs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {athletePrograms?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Assigned Programs</h2>
        {loadingPrograms ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-[180px] rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : athletePrograms && athletePrograms.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {athletePrograms.map((ap) => (
              <Card key={ap.id} className="border shadow-sm" data-testid={`assignment-card-${ap.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-semibold">
                      {getProgramName(ap.programId)}
                    </CardTitle>
                    <Badge variant={getStatusColor(ap.status)} className="shrink-0">
                      {ap.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Started {new Date(ap.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Trophy className="h-4 w-4" />
                    <span>{getProgramDuration(ap.programId)} weeks</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    {ap.status === "active" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ id: ap.id, status: "paused" })}
                          data-testid={`button-pause-${ap.id}`}
                        >
                          Pause
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ id: ap.id, status: "completed" })}
                          data-testid={`button-complete-${ap.id}`}
                        >
                          Complete
                        </Button>
                      </>
                    )}
                    {ap.status === "paused" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStatusMutation.mutate({ id: ap.id, status: "active" })}
                        data-testid={`button-resume-${ap.id}`}
                      >
                        Resume
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h3 className="text-base font-semibold text-foreground mb-2">
              No programs assigned
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Assign a training program to get started
            </p>
            <Button onClick={() => setIsDialogOpen(true)} data-testid="button-assign-first-program">
              <Plus className="h-4 w-4 mr-2" />
              Assign First Program
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
