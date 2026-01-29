import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Program, InsertProgram } from "@shared/schema";
import { Plus, BookOpen, Calendar, Layers, Dumbbell, Clock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ProgramCreationWizard } from "@/components/program-creation-wizard";

export default function Programs() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: programs, isLoading } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertProgram) => {
      const response = await apiRequest("POST", "/api/programs", data);
      return response.json() as Promise<{ id: string }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
      setIsWizardOpen(false);
      toast({
        title: "Program created",
        description: "The training program has been created successfully.",
      });
      // Navigate to the program builder
      if (data?.id) {
        setLocation(`/programs/${data.id}`);
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to create program",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleCreateProgram = (data: {
    name: string;
    description: string;
    duration: number;
    trainingDays: number;
    phase: string;
    templateId: string;
  }) => {
    createMutation.mutate({
      name: data.name,
      description: data.description,
      duration: data.duration,
    });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/programs/${id}`, undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
      toast({
        title: "Program deleted",
        description: "The program has been removed successfully.",
      });
    },
  });

  const importTemplateMutation = useMutation({
    mutationFn: (programId: string) =>
      apiRequest("POST", `/api/programs/${programId}/import-default-template`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
      toast({
        title: "52-Week Template Imported",
        description: "The athletic performance program has been loaded successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Import Failed",
        description: "Could not load the template. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-8">
      <div className="bglass rounded-2xl shadow-glass p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg text-slate-100">Training Programs</h2>
          <div className="chip">Coach Portal</div>
        </div>
        <p className="text-sm text-slate-400 mt-2">
          Create and manage comprehensive training programs for your athletes.
        </p>
        <div className="mt-4">
          <button 
            className="btn btn-pri text-sm" 
            onClick={() => setIsWizardOpen(true)}
            data-testid="button-add-program"
          >
            <Plus className="h-4 w-4 mr-1 inline" />
            New Program
          </button>
          
          <ProgramCreationWizard
            open={isWizardOpen}
            onOpenChange={setIsWizardOpen}
            onCreateProgram={handleCreateProgram}
            isPending={createMutation.isPending}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-[240px] rounded-2xl skeleton animate-shimmer" />
          ))}
        </div>
      ) : programs && programs.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <div key={program.id} className="bglass shadow-glass rounded-2xl p-4 hover:shadow-glow transition-all duration-200" data-testid={`program-card-${program.id}`}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-slate-100 line-clamp-2">
                    {program.name}
                  </h3>
                </div>
                <div className="chip">
                  {program.duration}w
                </div>
              </div>

              <div className="space-y-3">
                {program.description ? (
                  <p className="text-sm text-slate-400 line-clamp-3">
                    {program.description}
                  </p>
                ) : (
                  <p className="text-sm text-slate-500 italic">
                    No description provided
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  Created {new Date(program.createdAt!).toLocaleDateString()}
                </p>
              </div>

              <div className="space-y-2 border-t border-white/10 pt-4 mt-4">
                <button
                  className="btn btn-pri w-full text-xs" 
                  onClick={() => setLocation(`/programs/${program.id}`)}
                  data-testid={`button-open-${program.id}`}
                >
                  <Layers className="h-3.5 w-3.5 mr-1.5 inline" />
                  Open Program
                </button>
                <button
                  className="btn btn-sec w-full text-xs" 
                  onClick={() => setLocation(`/programs/${program.id}/planner`)}
                  data-testid={`button-planner-${program.id}`}
                >
                  <Calendar className="h-3.5 w-3.5 mr-1.5 inline" />
                  Open Planner
                </button>
                <button
                  className="btn btn-sec w-full text-xs"
                  onClick={() => importTemplateMutation.mutate(program.id)}
                  disabled={importTemplateMutation.isPending}
                  data-testid={`button-import-${program.id}`}
                >
                  {importTemplateMutation.isPending ? "Importing..." : "Load 52-Week Template"}
                </button>
                <div className="flex gap-2">
                  <button
                    className="btn btn-sec flex-1 text-xs" 
                    onClick={() => setLocation(`/programs/${program.id}/builder`)}
                    data-testid={`button-edit-${program.id}`}
                  >
                    Legacy
                  </button>
                  <button
                    className="btn btn-sec text-xs"
                    onClick={() => deleteMutation.mutate(program.id)}
                    data-testid={`button-delete-${program.id}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <BookOpen className="mx-auto h-16 w-16 text-slate-500 mb-4" />
          <h3 className="font-heading text-xl font-semibold text-slate-200 mb-2">
            No programs yet
          </h3>
          <p className="text-slate-400 mb-6">
            Create your first training program to get started
          </p>
          <button className="btn btn-pri" onClick={() => setIsWizardOpen(true)} data-testid="button-add-first-program">
            <Plus className="h-4 w-4 mr-2 inline" />
            Create Your First Program
          </button>
        </div>
      )}
    </div>
  );
}
