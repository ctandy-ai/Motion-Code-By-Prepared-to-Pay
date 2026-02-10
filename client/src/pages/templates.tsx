import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Copy, FileText, Sparkles, Calendar, Layers, Clock, Target } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ProgramTemplate, TemplatePhase, TemplateWeek, TemplateTrainingBlock } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Dumbbell } from "lucide-react";

const copyTemplateSchema = z.object({
  programName: z.string().min(1, "Program name is required"),
  coachId: z.string().optional(),
});

interface BlockExercise {
  id: string;
  exerciseId: string;
  exerciseName: string | null;
  exerciseCategory: string | null;
  exerciseMuscleGroup: string | null;
  exerciseDifficulty: string | null;
  scheme: string | null;
  notes: string | null;
  orderIndex: number;
}

interface BlockWithExercises extends TemplateTrainingBlock {
  exercises: BlockExercise[];
}

interface TemplateStructure {
  template: ProgramTemplate;
  phases: TemplatePhase[];
  weeks: TemplateWeek[];
  blocks: BlockWithExercises[];
}

export default function Templates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<ProgramTemplate | null>(null);
  const [isCopyDialogOpen, setIsCopyDialogOpen] = useState(false);
  const [isStructureDialogOpen, setIsStructureDialogOpen] = useState(false);
  const [viewingTemplateId, setViewingTemplateId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: templates = [] } = useQuery<ProgramTemplate[]>({
    queryKey: ['/api/templates'],
  });

  const { data: templateStructure, isLoading: isLoadingStructure } = useQuery<TemplateStructure>({
    queryKey: ['/api/templates', viewingTemplateId, 'structure'],
    enabled: !!viewingTemplateId && isStructureDialogOpen,
  });

  const copyForm = useForm<z.infer<typeof copyTemplateSchema>>({
    resolver: zodResolver(copyTemplateSchema),
    defaultValues: {
      programName: "",
      coachId: "default-coach",
    },
  });

  const copyTemplateMutation = useMutation({
    mutationFn: async (data: { templateId: string; programName: string; coachId?: string }) => {
      const response = await apiRequest(
        'POST',
        `/api/templates/${data.templateId}/copy-to-program`,
        { 
          programName: data.programName,
          coachId: data.coachId || 'default-coach'
        }
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/programs'] });
      toast({
        title: "Program Created",
        description: "Template has been copied successfully!",
      });
      setIsCopyDialogOpen(false);
      copyForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to copy template",
        variant: "destructive",
      });
    },
  });

  const categories = ["all", ...Array.from(new Set(templates.map(t => t.category)))];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCopyTemplate = (template: ProgramTemplate) => {
    setSelectedTemplate(template);
    copyForm.setValue("programName", `${template.name} (Copy)`);
    setIsCopyDialogOpen(true);
  };

  const handleViewStructure = (template: ProgramTemplate) => {
    setSelectedTemplate(template);
    setViewingTemplateId(template.id);
    setIsStructureDialogOpen(true);
  };

  const onCopySubmit = (data: z.infer<typeof copyTemplateSchema>) => {
    if (selectedTemplate) {
      copyTemplateMutation.mutate({
        templateId: selectedTemplate.id,
        programName: data.programName,
        coachId: data.coachId,
      });
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Strength': 'text-coral-500',
      'Speed': 'text-teal-500',
      'Rehab': 'text-gold-500',
      'In-Season': 'text-ocean-500',
      'Conditioning': 'text-teal-green-500',
      'Periodization': 'text-gold-500',
      'Annual Plan': 'text-gold-500',
    };
    return colors[category] || 'text-slate-400';
  };

  const getPhaseTypeColor = (phaseType: string) => {
    const colors: Record<string, string> = {
      'base': 'bg-ocean-500/20 text-ocean-300 border-ocean-500/40',
      'build': 'bg-teal-500/20 text-teal-300 border-teal-500/40',
      'peak': 'bg-coral-500/20 text-coral-300 border-coral-500/40',
      'taper': 'bg-gold-500/20 text-gold-300 border-gold-500/40',
      'competition': 'bg-teal-green-500/20 text-teal-green-300 border-teal-green-500/40',
      'recovery': 'bg-slate-500/20 text-slate-300 border-slate-500/40',
    };
    return colors[phaseType] || 'bg-slate-500/20 text-slate-300 border-slate-500/40';
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-4xl font-bold text-slate-100 gradient-text">Program Templates</h1>
        <p className="text-slate-400 mt-2">
          Pre-built training programs ready to copy and customize for your athletes
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Search templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="sm:max-w-xs"
          data-testid="input-search-templates"
        />

        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className="cursor-pointer hover-elevate"
              onClick={() => setSelectedCategory(category)}
              data-testid={`filter-${category}`}
            >
              {category === "all" ? "All Categories" : category}
            </Badge>
          ))}
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <Card className="border-0">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-slate-400 mb-4" />
            <h3 className="font-semibold text-lg mb-2 text-slate-100">No Templates Found</h3>
            <p className="text-sm text-slate-400">
              {searchTerm
                ? "Try adjusting your search terms"
                : "No templates available yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="border-0 hover-elevate group" data-testid={`template-card-${template.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl truncate text-slate-100 group-hover:text-ocean-400 transition-colors">
                      {template.name}
                    </CardTitle>
                    <CardDescription className="mt-1 text-slate-400 flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {template.duration} weeks
                      <span>•</span>
                      <span className={getCategoryColor(template.category)}>{template.category}</span>
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-slate-100 shrink-0">
                    {template.isPublic ? "Public" : "Private"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-400 line-clamp-3">
                  {template.description || "No description available"}
                </p>

                {template.tags && template.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 3).map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs text-slate-200">
                        {tag}
                      </Badge>
                    ))}
                    {template.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs text-slate-200">
                        +{template.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <Button
                    onClick={() => handleViewStructure(template)}
                    variant="outline"
                    className="w-full"
                    data-testid={`button-view-structure-${template.id}`}
                  >
                    <Layers className="h-4 w-4 mr-2" />
                    View Structure
                  </Button>
                  <Button
                    onClick={() => handleCopyTemplate(template)}
                    className="w-full"
                    data-testid={`button-copy-${template.id}`}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy to Program
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isCopyDialogOpen} onOpenChange={setIsCopyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Copy Template to Program
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate && `Copying: ${selectedTemplate.name}`}
            </DialogDescription>
          </DialogHeader>

          <Form {...copyForm}>
            <form onSubmit={copyForm.handleSubmit(onCopySubmit)} className="space-y-4">
              <FormField
                control={copyForm.control}
                name="programName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Jordan's Off-Season Power"
                        data-testid="input-program-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedTemplate && (
                <div className="rounded-lg border border-slate-700 p-4 bg-slate-800/50 space-y-2">
                  <h4 className="font-semibold text-sm text-slate-200">Template Details:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-400">{selectedTemplate.duration} weeks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-400">{selectedTemplate.category}</span>
                    </div>
                  </div>
                  {selectedTemplate.description && (
                    <p className="text-sm text-slate-400 mt-2">
                      {selectedTemplate.description}
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCopyDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={copyTemplateMutation.isPending}
                  data-testid="button-create-program"
                >
                  {copyTemplateMutation.isPending ? "Copying..." : "Copy Template"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isStructureDialogOpen} onOpenChange={setIsStructureDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              {selectedTemplate?.name} - Structure
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate && `${selectedTemplate.duration}-week program with phases and weekly progression`}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-12rem)]">
            {isLoadingStructure ? (
              <div className="flex justify-center py-8">
                <p className="text-slate-400">Loading template structure...</p>
              </div>
            ) : !templateStructure || templateStructure.phases.length === 0 ? (
              <div className="flex justify-center py-8">
                <p className="text-slate-400">No structure data available</p>
              </div>
            ) : (
              <div className="space-y-6">
                {templateStructure.phases.map((phase) => {
                  const phaseWeeks = templateStructure.weeks.filter(w => w.phaseId === phase.id);
                  
                  return (
                    <Card key={phase.id} className="border-0">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg text-slate-100">{phase.name}</CardTitle>
                            <CardDescription className="text-slate-400">
                              Weeks {phase.startWeek}-{phase.endWeek} ({phase.endWeek - phase.startWeek + 1} weeks)
                            </CardDescription>
                          </div>
                          <Badge className={getPhaseTypeColor(phase.phaseType)}>
                            {phase.phaseType}
                          </Badge>
                        </div>
                        {phase.goals && (
                          <p className="text-sm text-slate-400 mt-2">{phase.goals}</p>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {phaseWeeks.map((week) => {
                          const weekBlocks = templateStructure.blocks.filter(b => b.templateWeekId === week.id);
                          const totalExercises = weekBlocks.reduce((acc, b) => acc + (b.exercises?.length || 0), 0);
                          
                          return (
                            <Collapsible key={week.id}>
                              <CollapsibleTrigger className="w-full">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800/70 transition-colors">
                                  <div className="flex items-center gap-4">
                                    <span className="font-semibold text-slate-100">Week {week.weekNumber}</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {week.beltTarget || 'N/A'}
                                    </Badge>
                                    {week.focus && week.focus.length > 0 && (
                                      <span className="text-sm text-slate-400">
                                        {week.focus.slice(0, 2).join(', ')}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs text-slate-500">
                                      {weekBlocks.length} blocks • {totalExercises} exercises
                                    </span>
                                    <ChevronDown className="h-4 w-4 text-slate-400" />
                                  </div>
                                </div>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="mt-3 space-y-3 pl-4">
                                  {weekBlocks.length === 0 ? (
                                    <p className="text-sm text-slate-500 italic">No blocks in this week</p>
                                  ) : (
                                    weekBlocks.map((block) => (
                                      <div key={block.id} className="rounded-lg border border-slate-700 bg-slate-900/50 p-3">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium text-slate-200">{block.title}</span>
                                            <Badge variant="outline" className="text-xs">
                                              Day {block.dayNumber}
                                            </Badge>
                                            <Badge variant="secondary" className="text-xs">
                                              {block.belt}
                                            </Badge>
                                          </div>
                                          <span className="text-xs text-slate-500">
                                            {block.exercises?.length || 0} exercises
                                          </span>
                                        </div>
                                        {block.focus && block.focus.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mb-2">
                                            {block.focus.map((f, idx) => (
                                              <Badge key={idx} variant="outline" className="text-xs text-slate-400">
                                                {f}
                                              </Badge>
                                            ))}
                                          </div>
                                        )}
                                        {block.exercises && block.exercises.length > 0 && (
                                          <div className="space-y-1 mt-2">
                                            {block.exercises.map((ex) => (
                                              <div 
                                                key={ex.id} 
                                                className="flex items-center justify-between text-sm py-1 px-2 rounded bg-slate-800/30"
                                              >
                                                <div className="flex items-center gap-2">
                                                  <Dumbbell className="h-3 w-3 text-teal-400" />
                                                  <span className="text-slate-300">{ex.exerciseName || 'Unknown Exercise'}</span>
                                                  {ex.exerciseMuscleGroup && (
                                                    <span className="text-xs text-slate-500">({ex.exerciseMuscleGroup})</span>
                                                  )}
                                                </div>
                                                <span className="text-xs text-slate-400">{ex.scheme || ''}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))
                                  )}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        })}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
