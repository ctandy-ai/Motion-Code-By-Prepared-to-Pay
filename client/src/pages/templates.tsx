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
import { Copy, Trash2, FileText, Sparkles } from "lucide-react";
import type { ProgramTemplate } from "@shared/schema";

const instantiateSchema = z.object({
  programName: z.string().min(1, "Program name is required"),
});

export default function Templates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<ProgramTemplate | null>(null);
  const [isInstantiateOpen, setIsInstantiateOpen] = useState(false);
  const { toast } = useToast();

  const { data: templates = [] } = useQuery<ProgramTemplate[]>({
    queryKey: ['/api/program-templates'],
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
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-slate-400 mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Templates Found</h3>
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
            <Card key={template.id} className="hover-elevate" data-testid={`template-card-${template.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl truncate">{template.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {template.duration} weeks • {template.category}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{template.isPublic ? "Public" : "Private"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-400 line-clamp-3">
                  {template.description || "No description available"}
                </p>

                {template.tags && template.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 3).map((tag, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {template.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
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
    </div>
  );
}
