import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";
import type { Exercise } from "@shared/schema";

const exerciseFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  component: z.string().min(1, "Component is required"),
  beltLevel: z.string().min(1, "Belt level is required"),
  difficulty: z.string().optional(),
  equipment: z.string().min(1, "Equipment is required"),
  movementType: z.string().optional(),
  setsRange: z.string().optional(),
  repsRange: z.string().optional(),
  restPeriod: z.string().optional(),
  programmingGuide: z.string().optional(),
  videoUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  whyItWorks: z.string().optional(),
  coachingCuesRaw: z.string().optional(),
  applicableSportsRaw: z.string().optional(),
  applicablePositionsRaw: z.string().optional(),
  progressionsRaw: z.string().optional(),
  regressionsRaw: z.string().optional(),
});

type ExerciseFormValues = z.infer<typeof exerciseFormSchema>;

const COMPONENTS = ["acceleration", "deceleration", "change-direction", "top-speed"];
const BELT_LEVELS = ["white", "blue", "black"];
const DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const MOVEMENT_TYPES = ["lower-body-push", "lower-body-pull", "hip-hinge", "single-leg", "plyometric", "isometric"];

function ExerciseForm({
  defaultValues,
  onSubmit,
  isLoading,
}: {
  defaultValues?: Partial<ExerciseFormValues>;
  onSubmit: (data: ExerciseFormValues) => void;
  isLoading: boolean;
}) {
  const form = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      component: "acceleration",
      beltLevel: "white",
      difficulty: "beginner",
      equipment: "Bodyweight",
      movementType: "",
      setsRange: "",
      repsRange: "",
      restPeriod: "60 seconds",
      programmingGuide: "",
      videoUrl: "",
      thumbnailUrl: "",
      whyItWorks: "",
      coachingCuesRaw: "",
      applicableSportsRaw: "general",
      applicablePositionsRaw: "",
      progressionsRaw: "",
      regressionsRaw: "",
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel className="text-white">Exercise Name *</FormLabel>
              <FormControl>
                <Input {...field} className="bg-gray-800 border-gray-700 text-white" placeholder="e.g. Split Squat" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="component" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Movement Pillar *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {COMPONENTS.map(c => <SelectItem key={c} value={c} className="text-white">{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="beltLevel" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Belt Level *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {BELT_LEVELS.map(b => <SelectItem key={b} value={b} className="text-white capitalize">{b} Belt</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="difficulty" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Difficulty</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {DIFFICULTIES.map(d => <SelectItem key={d} value={d} className="text-white capitalize">{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormItem>
          )} />

          <FormField control={form.control} name="movementType" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Movement Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                <FormControl>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {MOVEMENT_TYPES.map(m => <SelectItem key={m} value={m} className="text-white">{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="category" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white">Category *</FormLabel>
            <FormControl>
              <Input {...field} className="bg-gray-800 border-gray-700 text-white" placeholder="e.g. Starting Fundamentals" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="equipment" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white">Equipment Required *</FormLabel>
            <FormControl>
              <Input {...field} className="bg-gray-800 border-gray-700 text-white" placeholder="e.g. Bodyweight, Dumbbells" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-3 gap-4">
          <FormField control={form.control} name="setsRange" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Sets</FormLabel>
              <FormControl>
                <Input {...field} className="bg-gray-800 border-gray-700 text-white" placeholder="2–4" />
              </FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="repsRange" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Reps</FormLabel>
              <FormControl>
                <Input {...field} className="bg-gray-800 border-gray-700 text-white" placeholder="4–8" />
              </FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="restPeriod" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Rest</FormLabel>
              <FormControl>
                <Input {...field} className="bg-gray-800 border-gray-700 text-white" placeholder="90 seconds" />
              </FormControl>
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white">Description *</FormLabel>
            <FormControl>
              <textarea {...field} rows={2} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="coachingCuesRaw" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white">Coaching Cues <span className="text-gray-400 font-normal">(one per line)</span></FormLabel>
            <FormControl>
              <textarea {...field} rows={3} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Soft landing&#10;Quick ground contact&#10;Maintain balance" />
            </FormControl>
          </FormItem>
        )} />

        <FormField control={form.control} name="whyItWorks" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white">Why It Works <span className="text-gray-400 font-normal">(athlete-facing explanation)</span></FormLabel>
            <FormControl>
              <textarea {...field} rows={2} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </FormControl>
          </FormItem>
        )} />

        <FormField control={form.control} name="applicableSportsRaw" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white">Applicable Sports <span className="text-gray-400 font-normal">(comma-separated)</span></FormLabel>
            <FormControl>
              <Input {...field} className="bg-gray-800 border-gray-700 text-white" placeholder="netball, afl, basketball, general" />
            </FormControl>
          </FormItem>
        )} />

        <FormField control={form.control} name="applicablePositionsRaw" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white">Applicable Positions <span className="text-gray-400 font-normal">(comma-separated, leave blank for all)</span></FormLabel>
            <FormControl>
              <Input {...field} className="bg-gray-800 border-gray-700 text-white" placeholder="Centre, Wing Attack, Goal Shooter" />
            </FormControl>
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="progressionsRaw" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Progressions <span className="text-gray-400 font-normal">(comma-separated)</span></FormLabel>
              <FormControl>
                <Input {...field} className="bg-gray-800 border-gray-700 text-white" placeholder="Harder exercise names" />
              </FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="regressionsRaw" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Regressions <span className="text-gray-400 font-normal">(comma-separated)</span></FormLabel>
              <FormControl>
                <Input {...field} className="bg-gray-800 border-gray-700 text-white" placeholder="Easier exercise names" />
              </FormControl>
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="videoUrl" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Video URL</FormLabel>
              <FormControl>
                <Input {...field} className="bg-gray-800 border-gray-700 text-white" placeholder="YouTube embed or /attached_assets/..." />
              </FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="thumbnailUrl" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-white">Thumbnail URL</FormLabel>
              <FormControl>
                <Input {...field} className="bg-gray-800 border-gray-700 text-white" placeholder="https://..." />
              </FormControl>
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="programmingGuide" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-white">Programming Notes</FormLabel>
            <FormControl>
              <textarea {...field} rows={2} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 3×6, 90s rest. Best used weeks 3–8 of preseason." />
            </FormControl>
          </FormItem>
        )} />

        <Button type="submit" disabled={isLoading} className="w-full bg-[#FF6432] hover:bg-blue-700">
          {isLoading ? "Saving..." : "Save Exercise"}
        </Button>
      </form>
    </Form>
  );
}

function formValuesToPayload(data: ExerciseFormValues) {
  return {
    ...data,
    coachingCues: data.coachingCuesRaw ? data.coachingCuesRaw.split("\n").map(s => s.trim()).filter(Boolean) : [],
    applicableSports: data.applicableSportsRaw ? data.applicableSportsRaw.split(",").map(s => s.trim()).filter(Boolean) : ["general"],
    applicablePositions: data.applicablePositionsRaw ? data.applicablePositionsRaw.split(",").map(s => s.trim()).filter(Boolean) : [],
    progressions: data.progressionsRaw ? data.progressionsRaw.split(",").map(s => s.trim()).filter(Boolean) : [],
    regressions: data.regressionsRaw ? data.regressionsRaw.split(",").map(s => s.trim()).filter(Boolean) : [],
  };
}

function exerciseToFormValues(ex: Exercise): Partial<ExerciseFormValues> {
  return {
    name: ex.name,
    description: ex.description,
    category: ex.category,
    component: ex.component,
    beltLevel: ex.beltLevel,
    difficulty: ex.difficulty || "beginner",
    equipment: ex.equipment,
    movementType: ex.movementType || "",
    setsRange: ex.setsRange || "",
    repsRange: ex.repsRange || "",
    restPeriod: ex.restPeriod || "60 seconds",
    programmingGuide: ex.programmingGuide || "",
    videoUrl: ex.videoUrl || "",
    thumbnailUrl: ex.thumbnailUrl || "",
    whyItWorks: ex.whyItWorks || "",
    coachingCuesRaw: (ex.coachingCues || []).join("\n"),
    applicableSportsRaw: (ex.applicableSports || []).join(", "),
    applicablePositionsRaw: (ex.applicablePositions || []).join(", "),
    progressionsRaw: (ex.progressions || []).join(", "),
    regressionsRaw: (ex.regressions || []).join(", "),
  };
}

const BELT_COLORS: Record<string, string> = {
  white: "bg-white/20 text-white",
  blue: "bg-blue-500/20 text-blue-300 border border-blue-500/40",
  black: "bg-gray-900/80 text-gray-200 border border-gray-600",
};

const PILLAR_COLORS: Record<string, string> = {
  acceleration: "text-green-400",
  deceleration: "text-blue-400",
  "change-direction": "text-yellow-400",
  "top-speed": "text-red-400",
};

export default function ExerciseAdmin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterComponent, setFilterComponent] = useState("all");
  const [filterBelt, setFilterBelt] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editExercise, setEditExercise] = useState<Exercise | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Exercise | null>(null);

  const { data: allExercises, isLoading } = useQuery<Exercise[]>({
    queryKey: ["/api/admin/exercises"],
    queryFn: async () => {
      const res = await fetch("/api/admin/exercises", { credentials: "include" });
      if (!res.ok) throw new Error("Access denied");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/exercises", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/exercises"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      setAddOpen(false);
      toast({ title: "Exercise created", description: "It's now available in the library." });
    },
    onError: () => toast({ title: "Error", description: "Failed to create exercise.", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/exercises/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/exercises"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      setEditExercise(null);
      toast({ title: "Exercise updated" });
    },
    onError: () => toast({ title: "Error", description: "Failed to update exercise.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/exercises/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/exercises"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      setDeleteConfirm(null);
      toast({ title: "Exercise deleted" });
    },
  });

  const filtered = allExercises?.filter(ex => {
    const matchesSearch = !search || ex.name.toLowerCase().includes(search.toLowerCase()) || ex.description.toLowerCase().includes(search.toLowerCase());
    const matchesComponent = filterComponent === "all" || ex.component === filterComponent;
    const matchesBelt = filterBelt === "all" || ex.beltLevel === filterBelt;
    return matchesSearch && matchesComponent && matchesBelt;
  }) || [];

  if (user?.role !== "admin") {
    return (
      <div className="flex min-h-screen bg-p2p-dark">
        <Sidebar user={user} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400">Admin access required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-p2p-dark">
      <Sidebar user={user} />
      <div className="flex-1 overflow-y-auto p-4 pt-20 md:pt-6 md:p-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-white mb-1">Exercise Library Admin</h1>
            <p className="text-gray-400 text-sm">
              Add, edit, or remove exercises. Changes appear immediately in the app. {allExercises?.length || 0} exercises total.
            </p>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#FF6432] hover:bg-blue-700 text-white shrink-0">
                <Plus className="w-4 h-4 mr-2" />
                Add Exercise
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">Add New Exercise</DialogTitle>
              </DialogHeader>
              <ExerciseForm
                onSubmit={(data) => createMutation.mutate(formValuesToPayload(data))}
                isLoading={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search exercises..."
              className="pl-9 bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <select
            value={filterComponent}
            onChange={(e) => setFilterComponent(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
          >
            <option value="all">All Pillars</option>
            {COMPONENTS.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
          <select
            value={filterBelt}
            onChange={(e) => setFilterBelt(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
          >
            <option value="all">All Belts</option>
            {BELT_LEVELS.map(b => <option key={b} value={b} className="capitalize">{b} Belt</option>)}
          </select>
          {(search || filterComponent !== "all" || filterBelt !== "all") && (
            <Button variant="ghost" onClick={() => { setSearch(""); setFilterComponent("all"); setFilterBelt("all"); }} className="text-gray-400">
              <X className="w-4 h-4 mr-1" />Clear
            </Button>
          )}
        </div>

        <p className="text-gray-500 text-sm mb-4">{filtered.length} exercise{filtered.length !== 1 ? "s" : ""} shown</p>

        {isLoading ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 animate-pulse h-36" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(ex => (
              <div key={ex.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all group">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-sm leading-tight truncate">{ex.name}</h3>
                    <p className={`text-xs mt-0.5 capitalize font-medium ${PILLAR_COLORS[ex.component] || "text-gray-400"}`}>
                      {ex.component} • {ex.category}
                    </p>
                  </div>
                  <div className="flex gap-1.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => setEditExercise(ex)}
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(ex)}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${BELT_COLORS[ex.beltLevel] || "bg-gray-700 text-gray-300"}`}>
                    {ex.beltLevel} belt
                  </span>
                  {ex.setsRange && ex.repsRange && (
                    <span className="px-2 py-0.5 bg-gray-700/50 text-gray-300 rounded-full text-xs">
                      {ex.setsRange} × {ex.repsRange}
                    </span>
                  )}
                  {ex.equipment && (
                    <span className="px-2 py-0.5 bg-gray-700/50 text-gray-300 rounded-full text-xs">
                      {ex.equipment}
                    </span>
                  )}
                </div>

                <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">{ex.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editExercise} onOpenChange={(o) => !o && setEditExercise(null)}>
          <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Edit: {editExercise?.name}</DialogTitle>
            </DialogHeader>
            {editExercise && (
              <ExerciseForm
                defaultValues={exerciseToFormValues(editExercise)}
                onSubmit={(data) => updateMutation.mutate({ id: editExercise.id, data: formValuesToPayload(data) })}
                isLoading={updateMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirm Dialog */}
        <Dialog open={!!deleteConfirm} onOpenChange={(o) => !o && setDeleteConfirm(null)}>
          <DialogContent className="bg-gray-900 border-gray-700 max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-white">Delete exercise?</DialogTitle>
            </DialogHeader>
            <p className="text-gray-400 text-sm mb-4">
              Are you sure you want to delete <strong className="text-white">{deleteConfirm?.name}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 border-gray-700 text-gray-300" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
