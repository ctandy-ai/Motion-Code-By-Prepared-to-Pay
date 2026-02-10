import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ClipboardList,
  Plus,
  Edit2,
  Trash2,
  GripVertical,
  CheckCircle2,
  MessageSquare,
  ToggleLeft,
  Sliders,
  Loader2,
  Copy,
} from "lucide-react";
import type { CustomSurvey, SurveyQuestion } from "@shared/schema";

const questionTypeConfig = {
  scale: { label: "Scale", icon: Sliders, color: "text-blue-400" },
  text: { label: "Text", icon: MessageSquare, color: "text-green-400" },
  multiChoice: { label: "Multiple Choice", icon: CheckCircle2, color: "text-purple-400" },
  yesNo: { label: "Yes/No", icon: ToggleLeft, color: "text-amber-400" },
};

const frequencyOptions = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "pre_workout", label: "Pre-Workout" },
  { value: "post_workout", label: "Post-Workout" },
];

export default function SurveyBuilder() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSurvey, setEditingSurvey] = useState<CustomSurvey | null>(null);
  const [surveyName, setSurveyName] = useState("");
  const [surveyDescription, setSurveyDescription] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [isActive, setIsActive] = useState(true);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);

  const { data: surveys = [], isLoading, error } = useQuery<CustomSurvey[]>({
    queryKey: ["/api/custom-surveys"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/custom-surveys", {
        name: surveyName,
        description: surveyDescription,
        frequency,
        isActive: isActive ? 1 : 0,
        questions: JSON.stringify(questions),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-surveys"] });
      toast({ title: "Survey created" });
      closeDialog();
    },
    onError: () => {
      toast({ title: "Failed to create survey", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PATCH", `/api/custom-surveys/${id}`, {
        name: surveyName,
        description: surveyDescription,
        frequency,
        isActive: isActive ? 1 : 0,
        questions: JSON.stringify(questions),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-surveys"] });
      toast({ title: "Survey updated" });
      closeDialog();
    },
    onError: () => {
      toast({ title: "Failed to update survey", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/custom-surveys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-surveys"] });
      toast({ title: "Survey deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete survey", variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/custom-surveys/${id}`, {
        isActive: isActive ? 1 : 0,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-surveys"] });
    },
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingSurvey(null);
    setSurveyName("");
    setSurveyDescription("");
    setFrequency("daily");
    setIsActive(true);
    setQuestions([]);
  };

  const openEditDialog = (survey: CustomSurvey) => {
    setEditingSurvey(survey);
    setSurveyName(survey.name);
    setSurveyDescription(survey.description || "");
    setFrequency(survey.frequency);
    setIsActive(survey.isActive === 1);
    try {
      setQuestions(JSON.parse(survey.questions));
    } catch {
      setQuestions([]);
    }
    setIsDialogOpen(true);
  };

  const addQuestion = (type: SurveyQuestion["type"]) => {
    const newQuestion: SurveyQuestion = {
      id: `q-${Date.now()}`,
      type,
      label: "",
      required: true,
      ...(type === "scale" && { min: 1, max: 10 }),
      ...(type === "multiChoice" && { options: ["Option 1", "Option 2"] }),
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<SurveyQuestion>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleSubmit = () => {
    if (!surveyName.trim()) {
      toast({ title: "Survey name is required", variant: "destructive" });
      return;
    }
    if (questions.length === 0) {
      toast({ title: "Add at least one question", variant: "destructive" });
      return;
    }
    if (questions.some(q => !q.label.trim())) {
      toast({ title: "All questions must have a label", variant: "destructive" });
      return;
    }
    if (editingSurvey) {
      updateMutation.mutate(editingSurvey.id);
    } else {
      createMutation.mutate();
    }
  };

  const parseQuestions = (survey: CustomSurvey): SurveyQuestion[] => {
    try {
      return JSON.parse(survey.questions);
    } catch {
      return [];
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>Failed to load surveys. Please try again.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="survey-builder-page">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
            <ClipboardList className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Survey Builder</h1>
            <p className="text-sm text-muted-foreground">Create custom surveys for athlete check-ins</p>
          </div>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} data-testid="button-create-survey">
          <Plus className="h-4 w-4 mr-2" />
          New Survey
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : surveys.length === 0 ? (
        <Card className="bg-muted/50 border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-lg">No surveys yet</p>
            <p className="text-muted-foreground text-sm">Create your first custom survey</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {surveys.map((survey) => {
            const surveyQuestions = parseQuestions(survey);
            return (
              <Card
                key={survey.id}
                className={`bg-muted/50 border-border ${survey.isActive !== 1 && 'opacity-60'}`}
                data-testid={`survey-card-${survey.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-base text-foreground truncate" data-testid={`text-survey-name-${survey.id}`}>
                        {survey.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {frequencyOptions.find(f => f.value === survey.frequency)?.label || survey.frequency}
                        </Badge>
                        <Badge variant={survey.isActive === 1 ? "default" : "secondary"} className="text-xs">
                          {survey.isActive === 1 ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(survey)}
                        data-testid={`button-edit-survey-${survey.id}`}
                      >
                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(survey.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-survey-${survey.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {survey.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {survey.description}
                    </p>
                  )}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">{surveyQuestions.length} questions</p>
                    <div className="flex flex-wrap gap-1">
                      {surveyQuestions.slice(0, 4).map((q) => {
                        const config = questionTypeConfig[q.type];
                        const Icon = config.icon;
                        return (
                          <Badge key={q.id} variant="outline" className={`text-xs ${config.color} border-current/30`}>
                            <Icon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        );
                      })}
                      {surveyQuestions.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{surveyQuestions.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">Toggle Active</span>
                    <Switch
                      checked={survey.isActive === 1}
                      onCheckedChange={(checked) => 
                        toggleActiveMutation.mutate({ id: survey.id, isActive: checked })
                      }
                      data-testid={`switch-active-${survey.id}`}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-[700px] bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingSurvey ? "Edit Survey" : "Create Survey"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Survey Name</Label>
                <Input
                  id="name"
                  value={surveyName}
                  onChange={(e) => setSurveyName(e.target.value)}
                  placeholder="Pre-Game Readiness"
                  className="bg-muted/50 border-border"
                  data-testid="input-survey-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger className="bg-muted/50 border-border" data-testid="select-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencyOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={surveyDescription}
                onChange={(e) => setSurveyDescription(e.target.value)}
                placeholder="Describe the purpose of this survey..."
                className="bg-muted/50 border-border resize-none"
                rows={2}
                data-testid="input-survey-description"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="active"
                checked={isActive}
                onCheckedChange={setIsActive}
                data-testid="switch-survey-active"
              />
              <Label htmlFor="active">Active</Label>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Questions</Label>
                <div className="flex items-center gap-1">
                  {Object.entries(questionTypeConfig).map(([type, config]) => {
                    const Icon = config.icon;
                    return (
                      <Button
                        key={type}
                        variant="outline"
                        size="sm"
                        onClick={() => addQuestion(type as SurveyQuestion["type"])}
                        className="gap-1 text-xs"
                        data-testid={`button-add-${type}`}
                      >
                        <Icon className={`h-3 w-3 ${config.color}`} />
                        {config.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-border rounded-lg">
                  <p className="text-sm text-muted-foreground">No questions yet</p>
                  <p className="text-xs text-muted-foreground">Add questions using the buttons above</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((question, index) => {
                    const config = questionTypeConfig[question.type];
                    const Icon = config.icon;
                    return (
                      <Card key={question.id} className="bg-muted/50 border-border" data-testid={`question-card-${question.id}`}>
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div className="flex items-center gap-2 text-muted-foreground pt-1">
                              <GripVertical className="h-4 w-4" />
                              <span className="text-sm font-medium">{index + 1}</span>
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <Icon className={`h-4 w-4 ${config.color}`} />
                                <Badge variant="outline" className={`text-xs ${config.color} border-current/30`}>
                                  {config.label}
                                </Badge>
                              </div>
                              <Input
                                value={question.label}
                                onChange={(e) => updateQuestion(question.id, { label: e.target.value })}
                                placeholder="Enter question..."
                                className="bg-background border-border"
                                data-testid={`input-question-label-${question.id}`}
                              />
                              
                              {question.type === "scale" && (
                                <div className="flex items-center gap-4 text-xs">
                                  <div className="flex items-center gap-2">
                                    <Label className="text-muted-foreground">Min:</Label>
                                    <Input
                                      type="number"
                                      value={question.min || 1}
                                      onChange={(e) => updateQuestion(question.id, { min: parseInt(e.target.value) || 1 })}
                                      className="w-16 h-7 bg-background border-border"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Label className="text-muted-foreground">Max:</Label>
                                    <Input
                                      type="number"
                                      value={question.max || 10}
                                      onChange={(e) => updateQuestion(question.id, { max: parseInt(e.target.value) || 10 })}
                                      className="w-16 h-7 bg-background border-border"
                                    />
                                  </div>
                                </div>
                              )}

                              {question.type === "multiChoice" && (
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Options (comma-separated)</Label>
                                  <Input
                                    value={(question.options || []).join(", ")}
                                    onChange={(e) => updateQuestion(question.id, { 
                                      options: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                                    })}
                                    placeholder="Option 1, Option 2, Option 3"
                                    className="bg-background border-border"
                                  />
                                </div>
                              )}

                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={question.required}
                                  onCheckedChange={(checked) => updateQuestion(question.id, { required: checked })}
                                />
                                <Label className="text-xs text-muted-foreground">Required</Label>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeQuestion(question.id)}
                              data-testid={`button-remove-question-${question.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={closeDialog} data-testid="button-cancel">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-survey"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingSurvey ? "Save Changes" : "Create Survey"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
