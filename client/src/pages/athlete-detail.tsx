import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Athlete, AthleteProgram, Program, InsertAthleteProgram, WorkoutLog, Exercise, ReadinessSurvey, ValdTest, ValdProfile, ValdTrialResult, AthleteBeltClassification, Belt, Team } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Trophy, Dumbbell, ClipboardList, TrendingUp, Eye, Heart, Moon, Battery, Brain, AlertCircle, CheckCircle2, Zap, Activity, FileBarChart, Shield, RefreshCw, Award, Info, X, Users, Layers, FlaskConical, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ProgramEngineGuidance } from "@/components/program-engine-guidance";
import { AthleteTrainingProfileCard } from "@/components/athlete-training-profile";
import { AthleteTargets } from "@/components/athlete-targets";
import { BodyComposition } from "@/components/body-composition";
import { NormativeComparison } from "@/components/normative-comparison";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts";
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

  const { data: workoutLogs = [] } = useQuery<WorkoutLog[]>({
    queryKey: ["/api/workout-logs", athleteId],
    queryFn: async () => {
      const response = await fetch(`/api/workout-logs?athleteId=${athleteId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!athleteId,
  });

  const { data: exercises = [] } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });

  const { data: wellnessSurveys = [] } = useQuery<ReadinessSurvey[]>({
    queryKey: ["/api/athletes", athleteId, "readiness-surveys"],
    queryFn: async () => {
      const response = await fetch(`/api/athletes/${athleteId}/readiness-surveys`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!athleteId,
  });

  interface ValdDataResponse {
    profile: ValdProfile | undefined;
    tests: ValdTest[];
    latestResults: Record<string, ValdTrialResult[]>;
  }

  const { data: valdData } = useQuery<ValdDataResponse>({
    queryKey: ["/api/vald/athletes", athleteId, "data"],
    queryFn: async () => {
      const response = await fetch(`/api/vald/athletes/${athleteId}/data`);
      if (!response.ok) return { profile: undefined, tests: [], latestResults: {} };
      return response.json();
    },
    enabled: !!athleteId,
  });

  const { data: beltClassification, isLoading: loadingBelt } = useQuery<AthleteBeltClassification | null>({
    queryKey: ["/api/athletes", athleteId, "belt"],
    queryFn: async () => {
      const response = await fetch(`/api/athletes/${athleteId}/belt`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!athleteId,
  });

  const computeBeltMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/athletes/${athleteId}/belt/compute`);
      return response;
    },
    onSuccess: (data: any) => {
      if (data && data.classification) {
        queryClient.setQueryData(["/api/athletes", athleteId, "belt"], data.classification);
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/athletes", athleteId, "belt"] });
      }
      toast({
        title: "Belt classification computed",
        description: "The athlete's belt level has been updated based on their profile and test data.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to compute belt",
        description: error.message || "An error occurred while computing belt classification.",
        variant: "destructive",
      });
    },
  });

  const { data: athleteTeams = [] } = useQuery<Team[]>({
    queryKey: ["/api/athletes", athleteId, "teams"],
    queryFn: async () => {
      const response = await fetch(`/api/athletes/${athleteId}/teams`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!athleteId,
  });

  const { data: allTeams = [] } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });

  const addTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const response = await apiRequest("POST", `/api/athletes/${athleteId}/teams/${teamId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/athletes", athleteId, "teams"] });
      toast({ title: "Team added", description: "Athlete has been added to the team." });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add team",
        description: error.message || "Athlete may already be in this team.",
        variant: "destructive",
      });
    },
  });

  const removeTeamMutation = useMutation({
    mutationFn: async (teamId: string) => {
      await apiRequest("DELETE", `/api/athletes/${athleteId}/teams/${teamId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/athletes", athleteId, "teams"] });
      toast({ title: "Team removed", description: "Athlete has been removed from the team." });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove team",
        description: error.message || "An error occurred.",
        variant: "destructive",
      });
    },
  });

  const availableTeamsToAdd = allTeams.filter(t => !athleteTeams.find(at => at.id === t.id));

  const getBeltColor = (belt: string | undefined) => {
    switch (belt) {
      case "WHITE": return "bg-slate-200 text-slate-800";
      case "BLUE": return "bg-primary/90 text-primary-foreground";
      case "BLACK": return "bg-slate-900 text-slate-100 border border-amber-500";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getBeltIcon = (belt: string | undefined) => {
    switch (belt) {
      case "WHITE": return <Shield className="w-5 h-5" />;
      case "BLUE": return <Award className="w-5 h-5" />;
      case "BLACK": return <Trophy className="w-5 h-5" />;
      default: return <Shield className="w-5 h-5" />;
    }
  };

  const getExerciseName = (exerciseId: string) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    return exercise?.name || 'Unknown Exercise';
  };

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

  const hasValdData = valdData && (valdData.profile || valdData.tests.length > 0);
  const testCount = valdData?.tests?.length || 0;

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

  const initials = athlete.name.split(' ').map(n => n[0]).join('').slice(0, 2);
  const hasActiveProgram = athletePrograms?.some(ap => ap.status === "active");

  return (
    <div className="space-y-6">
      <Breadcrumb data-testid="breadcrumb-nav">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild data-testid="breadcrumb-athletes">
              <a onClick={(e) => { e.preventDefault(); setLocation("/athletes"); }} href="/athletes" role="link" style={{ cursor: "pointer" }}>Athletes</a>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{athlete.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header - always visible */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14" data-testid="athlete-avatar">
            <AvatarFallback className="bg-brand-600 text-white text-xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-semibold text-foreground">
                {athlete.name}
              </h1>
              <Badge
                variant={hasActiveProgram ? "default" : "secondary"}
                className="text-xs"
                data-testid="badge-athlete-status"
              >
                {hasActiveProgram ? "In Program" : athlete.status || "Registered"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {athlete.team && athlete.position
                ? `${athlete.team} • ${athlete.position}`
                : athlete.team || athlete.position || "No team assigned"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            variant="outline"
            onClick={() => setLocation(`/athletes/${athleteId}/report`)}
            data-testid="button-view-report"
          >
            <FileBarChart className="h-4 w-4 mr-2" />
            Performance Report
          </Button>
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
      </div>

      {/* Summary stat cards - always visible */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        <Card className="border-0" data-testid="card-belt-classification">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between gap-2">
              Belt
              <Button
                variant="ghost"
                size="sm"
                onClick={() => computeBeltMutation.mutate()}
                disabled={computeBeltMutation.isPending}
                data-testid="button-compute-belt"
              >
                <RefreshCw className={`w-3 h-3 ${computeBeltMutation.isPending ? 'animate-spin' : ''}`} />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingBelt ? (
              <div className="animate-pulse h-8 bg-muted rounded" />
            ) : beltClassification ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={`${getBeltColor(beltClassification.belt)} px-3 py-1 text-sm font-semibold`}>
                    {getBeltIcon(beltClassification.belt)}
                    <span className="ml-1">{beltClassification.belt}</span>
                  </Badge>
                </div>
                {beltClassification.isOverridden ? (
                  <p className="text-xs text-yellow-400 flex items-center gap-1">
                    <Info className="w-3 h-3" /> Staff override
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                <p>Not classified</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-auto underline"
                  onClick={() => computeBeltMutation.mutate()}
                  disabled={computeBeltMutation.isPending}
                  data-testid="button-classify-now"
                >
                  Classify now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-0" data-testid="card-active-programs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Programs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {athletePrograms?.filter((ap) => ap.status === "active").length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {athletePrograms?.length || 0} total
            </p>
          </CardContent>
        </Card>
        <Card className="border-0" data-testid="card-vald-tests">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">VALD Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-foreground">{testCount}</div>
              {hasValdData && (
                <Badge variant="secondary" className="text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  Synced
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0" data-testid="card-workout-count">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Workouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {workoutLogs.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">logged sessions</p>
          </CardContent>
        </Card>
        <Card className="border-0" data-testid="card-wellness-score">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Wellness</CardTitle>
          </CardHeader>
          <CardContent>
            {wellnessSurveys.length > 0 ? (() => {
              const latest = wellnessSurveys[0];
              const safeNum = (val: number | null | undefined, fallback = 5) => {
                const num = Number(val);
                return isNaN(num) ? fallback : num;
              };
              const score = Math.round((
                safeNum(latest.sleepQuality) * 0.20 +
                (11 - safeNum(latest.muscleSoreness)) * 0.15 +
                safeNum(latest.energyLevel) * 0.20 +
                (11 - safeNum(latest.stressLevel)) * 0.15 +
                safeNum(latest.mood) * 0.10 +
                safeNum(latest.overallReadiness) * 0.20
              ) * 10);
              return (
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${score >= 80 ? 'text-green-400' : score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                    {score}
                  </span>
                  <span className="text-xs text-muted-foreground">/100</span>
                </div>
              );
            })() : (
              <div className="text-2xl font-bold text-muted-foreground">--</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabbed content area */}
      <Tabs defaultValue="testing" className="w-full" data-testid="athlete-tabs">
        <TabsList className="w-full justify-start gap-1" data-testid="athlete-tabs-list">
          <TabsTrigger value="testing" className="gap-1.5" data-testid="tab-testing">
            <FlaskConical className="w-4 h-4" />
            Testing
            {testCount > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">{testCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="overview" className="gap-1.5" data-testid="tab-overview">
            <Users className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="programs" className="gap-1.5" data-testid="tab-programs">
            <Layers className="w-4 h-4" />
            Programs
          </TabsTrigger>
          <TabsTrigger value="training" className="gap-1.5" data-testid="tab-training">
            <Dumbbell className="w-4 h-4" />
            Training
          </TabsTrigger>
          <TabsTrigger value="wellness" className="gap-1.5" data-testid="tab-wellness">
            <Heart className="w-4 h-4" />
            Wellness
          </TabsTrigger>
        </TabsList>

        {/* TESTING & PERFORMANCE TAB - first-class citizen */}
        <TabsContent value="testing" className="space-y-6 mt-4" data-testid="tab-content-testing">
          {/* VALD Testing Data */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                VALD Testing Data
              </h2>
              {hasValdData && valdData?.profile && (
                <Badge className="bg-cyan-500/20 text-cyan-400">
                  Connected
                </Badge>
              )}
            </div>

            {hasValdData && valdData!.tests.length > 0 ? (
              <div className="space-y-3">
                {valdData!.tests.map((test) => {
                  const results = valdData!.latestResults[test.id] || [];
                  const keyMetrics = results.slice(0, 6);
                  const testTypeLabels: Record<string, string> = {
                    CMJ: 'Countermovement Jump', SJ: 'Squat Jump', DJ: 'Drop Jump', IMTP: 'Isometric Mid-Thigh Pull',
                    SLDJ: 'Single Leg Drop Jump', SLCMJ: 'Single Leg CMJ', SQT: 'Squat', LCMJ: 'Loaded CMJ',
                    HJ: 'Hurdle Jump', SLLAH: 'SL Land & Hold', ISOT: 'Isometric Test', SLHJ: 'SL Hurdle Jump',
                  };
                  const testLabel = testTypeLabels[test.testType] || test.testName || test.testType;
                  let metaWeight: number | null = null;
                  try {
                    const meta = typeof test.metadata === 'string' ? JSON.parse(test.metadata) : test.metadata;
                    if (meta?.weight) metaWeight = meta.weight;
                  } catch {}
                  
                  return (
                    <Card 
                      key={test.id} 
                      className="border-0"
                      data-testid={`vald-test-${test.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center shrink-0">
                            <Activity className="w-6 h-6 text-cyan-400" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-medium text-foreground">
                                {testLabel}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {test.testType}
                              </Badge>
                              {metaWeight && (
                                <span className="text-xs text-muted-foreground">
                                  {metaWeight.toFixed(1)} kg
                                </span>
                              )}
                              {results.length > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  {results.length} metric{results.length !== 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                            
                            {keyMetrics.length > 0 && (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                                {keyMetrics.map((metric, idx) => {
                                  const val = typeof metric.metricValue === 'number' ? metric.metricValue : parseFloat(String(metric.metricValue));
                                  const formatted = !isNaN(val) ? val.toFixed(2) : metric.metricValue;
                                  const name = (metric.metricName || '').toLowerCase();
                                  const isAsymmetry = name.includes('asymmetry') || name.includes('imbalance') || name.includes('deficit');
                                  const isRsi = name.includes('rsi') || name.includes('reactive');
                                  let qualityColor = 'bg-muted/50';
                                  let dotColor = '';
                                  if (!isNaN(val)) {
                                    if (isAsymmetry) {
                                      const absVal = Math.abs(val);
                                      if (absVal <= 10) { qualityColor = 'bg-emerald-500/10'; dotColor = 'bg-emerald-500'; }
                                      else if (absVal <= 15) { qualityColor = 'bg-amber-500/10'; dotColor = 'bg-amber-500'; }
                                      else { qualityColor = 'bg-red-500/10'; dotColor = 'bg-red-500'; }
                                    } else if (isRsi) {
                                      if (val >= 2.0) { qualityColor = 'bg-emerald-500/10'; dotColor = 'bg-emerald-500'; }
                                      else if (val >= 1.2) { qualityColor = 'bg-amber-500/10'; dotColor = 'bg-amber-500'; }
                                      else { qualityColor = 'bg-red-500/10'; dotColor = 'bg-red-500'; }
                                    }
                                  }
                                  return (
                                    <div
                                      key={idx}
                                      className={`rounded-md ${qualityColor} px-2.5 py-1.5`}
                                      data-testid={`metric-${test.id}-${idx}`}
                                    >
                                      <div className="flex items-center gap-1">
                                        {dotColor && <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotColor} shrink-0`} />}
                                        <p className="text-[10px] text-muted-foreground truncate">{metric.metricName}</p>
                                      </div>
                                      <p className="text-sm font-semibold text-foreground">
                                        {formatted}
                                        {metric.metricUnit && (
                                          <span className="text-xs font-normal text-muted-foreground ml-0.5">{metric.metricUnit}</span>
                                        )}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          
                          <div className="text-right shrink-0">
                            <p className="text-xs text-muted-foreground">
                              {test.recordedAt 
                                ? new Date(test.recordedAt).toLocaleDateString() 
                                : 'Unknown date'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="border-0">
                <CardContent className="p-8 text-center">
                  <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground mb-1">No VALD Tests Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect to VALD Hub to sync force plate, NordBord, and other testing data for this athlete.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => setLocation("/vald")}
                    data-testid="button-go-vald-hub"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Go to VALD Hub
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Normative Benchmarks */}
          {athleteId && (
            <NormativeComparison athleteId={athleteId} />
          )}
        </TabsContent>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6 mt-4" data-testid="tab-content-overview">
          <Card className="border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg font-medium text-foreground flex items-center gap-2">
                  <Users className="h-5 w-5 text-brand-500" />
                  Team Memberships
                </CardTitle>
                {availableTeamsToAdd.length > 0 && (
                  <Select
                    onValueChange={(teamId) => addTeamMutation.mutate(teamId)}
                  >
                    <SelectTrigger className="w-[180px]" data-testid="select-add-team">
                      <SelectValue placeholder="Add to team..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTeamsToAdd.map((team) => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {athleteTeams.length === 0 ? (
                <p className="text-sm text-muted-foreground">Not assigned to any teams yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {athleteTeams.map((team) => (
                    <Badge
                      key={team.id}
                      variant="secondary"
                      className="flex items-center gap-1"
                      data-testid={`team-badge-${team.id}`}
                    >
                      {team.name}
                      <button
                        onClick={() => removeTeamMutation.mutate(team.id)}
                        className="ml-1 rounded-full p-0.5 hover-elevate"
                        data-testid={`button-remove-team-${team.id}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {athleteId && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <AthleteTrainingProfileCard 
                  athleteId={athleteId}
                  athleteName={athlete?.name}
                />
                <ProgramEngineGuidance 
                  athleteId={athleteId} 
                  athleteName={athlete?.name}
                  trainingDaysPerWeek={3}
                />
              </div>
              <AthleteTargets athleteId={athleteId} />
              <BodyComposition athleteId={athleteId} />
            </>
          )}
        </TabsContent>

        {/* PROGRAMS TAB */}
        <TabsContent value="programs" className="space-y-6 mt-4" data-testid="tab-content-programs">
          <div>
            <h2 className="text-lg font-semibold mb-4">Assigned Programs</h2>
            {loadingPrograms ? (
              <div className="grid gap-6 md:grid-cols-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-[180px] rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : athletePrograms && athletePrograms.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {athletePrograms.map((ap) => (
                  <Card key={ap.id} className="border-0" data-testid={`assignment-card-${ap.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base font-semibold text-foreground">
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
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => setLocation(`/programs/${ap.programId}`)}
                          data-testid={`button-open-program-${ap.id}`}
                        >
                          <Layers className="h-3.5 w-3.5 mr-1.5" />
                          Open Program
                        </Button>
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
        </TabsContent>

        {/* TRAINING LOGS TAB */}
        <TabsContent value="training" className="space-y-6 mt-4" data-testid="tab-content-training">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                Recent Workout Logs
              </h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLocation(`/athlete/${athleteId}/portal`)}
                data-testid="button-view-portal"
              >
                <Eye className="w-4 h-4 mr-1" />
                View Portal
              </Button>
            </div>
            
            {workoutLogs.length > 0 ? (
              <div className="space-y-3">
                {workoutLogs.slice(0, 10).map((log) => {
                  const reps = log.repsPerSet ? log.repsPerSet.split(',').map(Number).filter(n => !isNaN(n)) : [];
                  const weights = log.weightPerSet ? log.weightPerSet.split(',').map(Number).filter(n => !isNaN(n)) : [];
                  const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;
                  const totalVolume = reps.reduce((sum, r, i) => sum + (r * (weights[i] || 0)), 0);
                  
                  return (
                    <Card 
                      key={log.id} 
                      className="border-0"
                      data-testid={`workout-log-${log.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                            <Dumbbell className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {getExerciseName(log.exerciseId)}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                              <span>{log.sets} sets</span>
                              <span>Max: {maxWeight}kg</span>
                              <span>Volume: {totalVolume.toLocaleString()}kg</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-muted-foreground">
                              {log.completedAt ? new Date(log.completedAt).toLocaleDateString() : 'Today'}
                            </p>
                            {log.notes && (
                              <Badge variant="secondary" className="mt-1 text-xs">
                                Has notes
                              </Badge>
                            )}
                          </div>
                        </div>
                        {log.notes && (
                          <div className="mt-3 pt-3 border-t border-ink-3">
                            <p className="text-sm text-muted-foreground italic">"{log.notes}"</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
                
                {workoutLogs.length > 10 && (
                  <p className="text-center text-sm text-muted-foreground py-2">
                    + {workoutLogs.length - 10} more logs
                  </p>
                )}
              </div>
            ) : (
              <Card className="border-0">
                <CardContent className="p-8 text-center">
                  <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground mb-1">No Workout Logs Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    This athlete hasn't logged any workouts yet
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => setLocation(`/athlete/${athleteId}/log-workout`)}
                    data-testid="button-log-workout-cta"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Log First Workout
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* WELLNESS TAB */}
        <TabsContent value="wellness" className="space-y-6 mt-4" data-testid="tab-content-wellness">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-400" />
                Wellness & Readiness
              </h2>
            </div>

            {wellnessSurveys.length >= 2 && (() => {
              const safeNum = (val: number | null | undefined, fallback = 5) => {
                const num = Number(val);
                return isNaN(num) ? fallback : num;
              };
              const trendData = wellnessSurveys.slice(0, 14).map(s => ({
                date: s.surveyDate ? new Date(s.surveyDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '?',
                score: Math.round((
                  safeNum(s.sleepQuality) * 0.20 +
                  (11 - safeNum(s.muscleSoreness)) * 0.15 +
                  safeNum(s.energyLevel) * 0.20 +
                  (11 - safeNum(s.stressLevel)) * 0.15 +
                  safeNum(s.mood) * 0.10 +
                  safeNum(s.overallReadiness) * 0.20
                ) * 10),
              })).reverse();
              return (
                <Card className="border-0 mb-4" data-testid="wellness-trend-chart">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-2 font-medium">Readiness Trend</p>
                    <div className="h-[120px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData}>
                          <defs>
                            <linearGradient id="wellnessGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            domain={[0, 100]}
                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                            axisLine={false}
                            tickLine={false}
                            width={28}
                          />
                          <RechartsTooltip
                            contentStyle={{
                              background: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '6px',
                              fontSize: '12px',
                            }}
                            labelStyle={{ color: 'hsl(var(--foreground))' }}
                          />
                          <Area
                            type="monotone"
                            dataKey="score"
                            stroke="hsl(var(--chart-2))"
                            fill="url(#wellnessGrad)"
                            strokeWidth={2}
                            dot={{ r: 3, fill: 'hsl(var(--chart-2))' }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
            
            {wellnessSurveys.length > 0 ? (
              <div className="space-y-3">
                {wellnessSurveys.slice(0, 7).map((survey) => {
                  const calculateReadinessScore = () => {
                    const weights = {
                      sleepQuality: 0.20,
                      muscleSoreness: 0.15,
                      energyLevel: 0.20,
                      stressLevel: 0.15,
                      mood: 0.10,
                      overallReadiness: 0.20,
                    };
                    const safeNum = (val: number | null | undefined, fallback = 5) => {
                      const num = Number(val);
                      return isNaN(num) ? fallback : num;
                    };
                    let score = 0;
                    score += safeNum(survey.sleepQuality) * weights.sleepQuality;
                    score += (11 - safeNum(survey.muscleSoreness)) * weights.muscleSoreness;
                    score += safeNum(survey.energyLevel) * weights.energyLevel;
                    score += (11 - safeNum(survey.stressLevel)) * weights.stressLevel;
                    score += safeNum(survey.mood) * weights.mood;
                    score += safeNum(survey.overallReadiness) * weights.overallReadiness;
                    return Math.round(score * 10);
                  };
                  
                  const readinessScore = calculateReadinessScore();
                  const getScoreColor = () => {
                    if (readinessScore >= 80) return "text-green-400";
                    if (readinessScore >= 60) return "text-amber-400";
                    return "text-red-400";
                  };
                  const getStatusIcon = () => {
                    if (readinessScore >= 80) return CheckCircle2;
                    return AlertCircle;
                  };
                  const StatusIcon = getStatusIcon();
                  
                  return (
                    <Card 
                      key={survey.id} 
                      className="border-0"
                      data-testid={`wellness-survey-${survey.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                            readinessScore >= 80 ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20' :
                            readinessScore >= 60 ? 'bg-gradient-to-br from-amber-500/20 to-yellow-500/20' :
                            'bg-gradient-to-br from-red-500/20 to-orange-500/20'
                          }`}>
                            <span className={`text-xl font-display font-bold ${getScoreColor()}`}>
                              {readinessScore}
                            </span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <StatusIcon className={`w-4 h-4 ${getScoreColor()}`} />
                              <span className={`font-medium ${getScoreColor()}`}>
                                {readinessScore >= 80 ? 'Ready to Train' : readinessScore >= 60 ? 'Moderate Readiness' : 'Consider Recovery'}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Moon className="w-3 h-3" />
                                Sleep: {survey.sleepHours ?? 7}h ({survey.sleepQuality ?? 5}/10)
                              </span>
                              <span className="flex items-center gap-1">
                                <Battery className="w-3 h-3" />
                                Energy: {survey.energyLevel ?? 5}/10
                              </span>
                              <span className="flex items-center gap-1">
                                <Brain className="w-3 h-3" />
                                Stress: {survey.stressLevel ?? 5}/10
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-right shrink-0">
                            <p className="text-xs text-muted-foreground">
                              {survey.surveyDate ? new Date(survey.surveyDate).toLocaleDateString() : 'Today'}
                            </p>
                            {survey.notes && (
                              <Badge variant="secondary" className="mt-1 text-xs">
                                Has notes
                              </Badge>
                            )}
                          </div>
                        </div>
                        {survey.notes && (
                          <div className="mt-3 pt-3 border-t border-ink-3">
                            <p className="text-sm text-muted-foreground italic">"{survey.notes}"</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
                
                {wellnessSurveys.length > 7 && (
                  <p className="text-center text-sm text-muted-foreground py-2">
                    + {wellnessSurveys.length - 7} more surveys
                  </p>
                )}
              </div>
            ) : (
              <Card className="border-0">
                <CardContent className="p-8 text-center">
                  <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-semibold text-foreground mb-1">No Wellness Data Yet</h3>
                  <p className="text-sm text-muted-foreground">
                    This athlete hasn't submitted any wellness surveys yet
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
