import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Program, InsertProgram } from "@shared/schema";
import { Plus, BookOpen, Calendar, Layers, Dumbbell, Clock } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgramCreationWizard } from "@/components/program-creation-wizard";
import { PageHeader } from "@/components/page-header";

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
      <PageHeader
        title="Training Programs"
        icon={BookOpen}
        description="Create and manage comprehensive training programs for your athletes."
        actions={
          <Button onClick={() => setIsWizardOpen(true)} data-testid="button-add-program">
            <Plus className="h-4 w-4 mr-1" />
            New Program
          </Button>
        }
      />
        
      <ProgramCreationWizard
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        onCreateProgram={handleCreateProgram}
        isPending={createMutation.isPending}
      />

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-[240px] rounded-lg skeleton animate-shimmer" />
          ))}
        </div>
      ) : programs && programs.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <Card key={program.id} className="hover-elevate" data-testid={`program-card-${program.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-semibold text-foreground line-clamp-2">
                    {program.name}
                  </CardTitle>
                  <Badge variant="secondary" className="shrink-0">{program.duration}w</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-2">
                {program.description ? (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {program.description}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No description provided
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Created {new Date(program.createdAt!).toLocaleDateString()}
                </p>
              </CardContent>

              <CardFooter className="flex-col gap-2 pt-0">
                <Button
                  className="w-full"
                  size="sm"
                  onClick={() => setLocation(`/programs/${program.id}`)}
                  data-testid={`button-open-${program.id}`}
                >
                  <Layers className="h-3.5 w-3.5 mr-1.5" />
                  Open Program
                </Button>
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setLocation(`/programs/${program.id}/planner`)}
                    data-testid={`button-planner-${program.id}`}
                  >
                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                    Planner
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => importTemplateMutation.mutate(program.id)}
                    disabled={importTemplateMutation.isPending}
                    data-testid={`button-import-${program.id}`}
                  >
                    {importTemplateMutation.isPending ? "..." : "52-Week"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(program.id)}
                    data-testid={`button-delete-${program.id}`}
                  >
                    Delete
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <BookOpen className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
            No programs yet
          </h3>
          <p className="text-muted-foreground mb-6">
            Create your first training program to get started
          </p>
          <Button onClick={() => setIsWizardOpen(true)} data-testid="button-add-first-program">
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Program
          </Button>
        </div>
      )}
    </div>
  );
}
