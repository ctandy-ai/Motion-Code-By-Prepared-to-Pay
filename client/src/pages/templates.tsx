import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Copy, Trash2, FileText, Sparkles, Calendar } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ProgramTemplate, TemplateWeekMetadata } from "@shared/schema";

const instantiateSchema = z.object({
  programName: z.string().min(1, "Program name is required"),
});

export default function Templates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<ProgramTemplate | null>(null);
  const [isInstantiateOpen, setIsInstantiateOpen] = useState(false);
  const [isWeeklyBreakdownOpen, setIsWeeklyBreakdownOpen] = useState(false);
  const [viewingTemplateId, setViewingTemplateId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: templates = [] } = useQuery<ProgramTemplate[]>({
    queryKey: ['/api/program-templates'],
  });

  const { data: weeklyMetadata = [], isLoading: isLoadingWeekly } = useQuery<TemplateWeekMetadata[]>({
    queryKey: ['/api/program-templates', viewingTemplateId, 'weeks'],
    enabled: !!viewingTemplateId && isWeeklyBreakdownOpen,
  });

  const instantiateForm = useForm<z.infer<typeof instantiateSchema>>({
    resolver: zodResolver(instantiateSchema),
    defaultValues: {
      programName: "",
    },
  });

  const instantiateMutation = useMutation({
    mutationFn: async (data: { templateId: string; programName: string }) => {
      const response = await fetch(`/api/program-templates/${data.templateId}/instantiate`, {
        method: 'POST',
        body: JSON.stringify({ programName: data.programName }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to instantiate');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/programs'] });
      toast({
        title: "Program Created",
        description: "Template has been instantiated successfully!",
      });
      setIsInstantiateOpen(false);
      instantiateForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create program from template",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/program-templates/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/program-templates'] });
      toast({
        title: "Template Deleted",
        description: "Template has been removed successfully",
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

  const handleInstantiate = (template: ProgramTemplate) => {
    setSelectedTemplate(template);
    instantiateForm.setValue("programName", template.name);
    setIsInstantiateOpen(true);
  };

  const handleViewWeeklyBreakdown = (template: ProgramTemplate) => {
    setSelectedTemplate(template);
    setViewingTemplateId(template.id);
    setIsWeeklyBreakdownOpen(true);
  };

  const onInstantiateSubmit = (data: z.infer<typeof instantiateSchema>) => {
    if (selectedTemplate) {
      instantiateMutation.mutate({
        templateId: selectedTemplate.id,
        programName: data.programName,
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-4xl font-bold text-slate-100">Program Templates</h1>
        <p className="text-slate-400 mt-2">
          Pre-built training programs ready to customize for your athletes
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
        <Card className="bglass shadow-glass border-0">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-slate-400 mb-4" />
            <h3 className="font-semibold text-lg mb-2 text-slate-100">No Templates Found</h3>
            <p className="text-sm text-slate-400">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Create your first program template to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="bglass shadow-glass border-0 hover-elevate" data-testid={`template-card-${template.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl truncate text-slate-100">{template.name}</CardTitle>
                    <CardDescription className="mt-1 text-slate-400">
                      {template.duration} weeks • {template.category}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-slate-100">{template.isPublic ? "Public" : "Private"}</Badge>
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
                  {template.category === "Periodization" && (
                    <Button
                      onClick={() => handleViewWeeklyBreakdown(template)}
                      variant="outline"
                      className="w-full"
                      data-testid={`button-view-weeks-${template.id}`}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      View Weekly Breakdown
                    </Button>
                  )}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleInstantiate(template)}
                      className="flex-1"
                      data-testid={`button-instantiate-${template.id}`}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Use Template
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => deleteMutation.mutate(template.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${template.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isInstantiateOpen} onOpenChange={setIsInstantiateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Create Program from Template
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate && `Using template: ${selectedTemplate.name}`}
            </DialogDescription>
          </DialogHeader>

          <Form {...instantiateForm}>
            <form onSubmit={instantiateForm.handleSubmit(onInstantiateSubmit)} className="space-y-4">
              <FormField
                control={instantiateForm.control}
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
                <div className="rounded-lg border p-4 bg-muted/50 space-y-2">
                  <h4 className="font-semibold text-sm">Template Details:</h4>
                  <p className="text-sm text-slate-400">
                    Duration: {selectedTemplate.duration} weeks
                  </p>
                  <p className="text-sm text-slate-400">
                    Category: {selectedTemplate.category}
                  </p>
                  {selectedTemplate.description && (
                    <p className="text-sm text-slate-400">
                      {selectedTemplate.description}
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsInstantiateOpen(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={instantiateMutation.isPending}
                  data-testid="button-create-program"
                >
                  {instantiateMutation.isPending ? "Creating..." : "Create Program"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isWeeklyBreakdownOpen} onOpenChange={setIsWeeklyBreakdownOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {selectedTemplate?.name} - Weekly Breakdown
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate?.duration}-week periodized training plan with belt progression and testing gateways
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-12rem)]">
            {isLoadingWeekly ? (
              <div className="flex justify-center py-8">
                <p className="text-slate-400">Loading weekly data...</p>
              </div>
            ) : weeklyMetadata.length === 0 ? (
              <div className="flex justify-center py-8">
                <p className="text-slate-400">No weekly data available</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Week</TableHead>
                    <TableHead>Phase</TableHead>
                    <TableHead>Belt Target</TableHead>
                    <TableHead>Focus</TableHead>
                    <TableHead>Strength Theme</TableHead>
                    <TableHead>Running</TableHead>
                    <TableHead>MBS</TableHead>
                    <TableHead>Plyo Cap</TableHead>
                    <TableHead>Testing Gateway</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weeklyMetadata.map((week) => (
                    <TableRow key={week.weekNumber} data-testid={`week-row-${week.weekNumber}`}>
                      <TableCell className="font-medium">{week.weekNumber}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{week.phase}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{week.beltTarget || 'N/A'}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{week.focus || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{week.strengthTheme || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{week.runningQualities || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{week.mbsPrimary || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{week.plyoContactsCap || 'N/A'}</TableCell>
                      <TableCell>
                        {week.testingGateway ? (
                          <Badge className="text-xs bg-primary/20 text-primary border-primary/40">
                            {week.testingGateway}
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-500">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
