import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Brain, Plus, Trash2, Edit2, Zap, AlertTriangle, TrendingDown, Shield } from "lucide-react";
import { PageHeader } from "@/components/page-header";

interface CoachHeuristic {
  id: string;
  coachId: string | null;
  name: string;
  description: string | null;
  triggerType: string;
  triggerCondition: string;
  actionType: string;
  actionDetails: string;
  isActive: number;
  priority: number;
  createdAt: string | null;
  updatedAt: string | null;
}

const TRIGGER_TYPES = [
  { value: "readiness_low", label: "Low Readiness Score", icon: AlertTriangle },
  { value: "readiness_high", label: "High Readiness Score", icon: Zap },
  { value: "soreness_high", label: "High Soreness Reported", icon: AlertTriangle },
  { value: "missed_sessions", label: "Missed Training Sessions", icon: TrendingDown },
  { value: "pr_achieved", label: "Personal Record Achieved", icon: Zap },
  { value: "injury_pathway", label: "Injury Pathway Athlete", icon: Shield },
  { value: "custom", label: "Custom Condition", icon: Brain },
];

const ACTION_TYPES = [
  { value: "reduce_volume", label: "Reduce Training Volume" },
  { value: "increase_volume", label: "Increase Training Volume" },
  { value: "add_exercises", label: "Add Exercises to Program" },
  { value: "remove_exercises", label: "Remove Exercises from Program" },
  { value: "swap_exercise", label: "Swap Exercise" },
  { value: "flag_review", label: "Flag for Coach Review" },
  { value: "send_notification", label: "Send Notification" },
  { value: "adjust_intensity", label: "Adjust Intensity Zone" },
  { value: "custom", label: "Custom Action" },
];

export default function Heuristics() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHeuristic, setEditingHeuristic] = useState<CoachHeuristic | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    triggerType: "",
    triggerCondition: "",
    actionType: "",
    actionDetails: "",
    priority: 0,
    isActive: 1,
  });

  const { data: heuristics, isLoading } = useQuery<CoachHeuristic[]>({
    queryKey: ["/api/heuristics"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest("POST", "/api/heuristics", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/heuristics"] });
      toast({ title: "Rule created successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to create rule", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      return await apiRequest("PATCH", `/api/heuristics/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/heuristics"] });
      toast({ title: "Rule updated successfully" });
      resetForm();
      setIsDialogOpen(false);
      setEditingHeuristic(null);
    },
    onError: () => {
      toast({ title: "Failed to update rule", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/heuristics/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/heuristics"] });
      toast({ title: "Rule deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete rule", variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: number }) => {
      return await apiRequest("PATCH", `/api/heuristics/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/heuristics"] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      triggerType: "",
      triggerCondition: "",
      actionType: "",
      actionDetails: "",
      priority: 0,
      isActive: 1,
    });
    setEditingHeuristic(null);
  };

  const handleEdit = (heuristic: CoachHeuristic) => {
    setEditingHeuristic(heuristic);
    setFormData({
      name: heuristic.name,
      description: heuristic.description || "",
      triggerType: heuristic.triggerType,
      triggerCondition: heuristic.triggerCondition,
      actionType: heuristic.actionType,
      actionDetails: heuristic.actionDetails,
      priority: heuristic.priority,
      isActive: heuristic.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingHeuristic) {
      updateMutation.mutate({ id: editingHeuristic.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getTriggerIcon = (triggerType: string) => {
    const trigger = TRIGGER_TYPES.find(t => t.value === triggerType);
    return trigger?.icon || Brain;
  };

  const getTriggerLabel = (triggerType: string) => {
    const trigger = TRIGGER_TYPES.find(t => t.value === triggerType);
    return trigger?.label || triggerType;
  };

  const getActionLabel = (actionType: string) => {
    const action = ACTION_TYPES.find(a => a.value === actionType);
    return action?.label || actionType;
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Coach Intelligence Rules"
        icon={Brain}
        description='Define "When X happens, do Y" rules for AI-powered coaching decisions'
        actions={
          <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-rule" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Rule
          </Button>
        }
      />

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingHeuristic ? "Edit Rule" : "Create New Rule"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Rule Name</Label>
                  <Input
                    data-testid="input-rule-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Low Readiness Deload"
                    className="bg-muted/50 border-border"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Priority (0-10)</Label>
                  <Input
                    data-testid="input-priority"
                    type="number"
                    min={0}
                    max={10}
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    className="bg-muted/50 border-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Description</Label>
                <Textarea
                  data-testid="input-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this rule does..."
                  className="bg-muted/50 border-border"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">When (Trigger Type)</Label>
                  <Select
                    value={formData.triggerType}
                    onValueChange={(value) => setFormData({ ...formData, triggerType: value })}
                  >
                    <SelectTrigger className="bg-muted/50 border-border" data-testid="select-trigger-type">
                      <SelectValue placeholder="Select trigger..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIGGER_TYPES.map((trigger) => (
                        <SelectItem key={trigger.value} value={trigger.value}>
                          {trigger.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Then (Action Type)</Label>
                  <Select
                    value={formData.actionType}
                    onValueChange={(value) => setFormData({ ...formData, actionType: value })}
                  >
                    <SelectTrigger className="bg-muted/50 border-border" data-testid="select-action-type">
                      <SelectValue placeholder="Select action..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_TYPES.map((action) => (
                        <SelectItem key={action.value} value={action.value}>
                          {action.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Trigger Condition Details</Label>
                <Textarea
                  data-testid="input-trigger-condition"
                  value={formData.triggerCondition}
                  onChange={(e) => setFormData({ ...formData, triggerCondition: e.target.value })}
                  placeholder="e.g., readiness_score < 5, or 'When athlete reports soreness > 7'"
                  className="bg-muted/50 border-border"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Action Details</Label>
                <Textarea
                  data-testid="input-action-details"
                  value={formData.actionDetails}
                  onChange={(e) => setFormData({ ...formData, actionDetails: e.target.value })}
                  placeholder="e.g., reduce_volume_by: 20%, or 'Add hip mobility exercises to warm-up'"
                  className="bg-muted/50 border-border"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  data-testid="button-save-rule"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingHeuristic ? "Update Rule" : "Create Rule"}
                </Button>
              </div>
            </form>
          </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-0 animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-muted rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : heuristics && heuristics.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {heuristics.map((heuristic) => {
            const TriggerIcon = getTriggerIcon(heuristic.triggerType);
            return (
              <Card
                key={heuristic.id}
                className={`border-0 transition-all ${
                  heuristic.isActive ? "opacity-100" : "opacity-50"
                }`}
                data-testid={`rule-card-${heuristic.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        heuristic.triggerType.includes("low") || heuristic.triggerType.includes("high") && heuristic.triggerType.includes("soreness")
                          ? "bg-amber-600/20"
                          : "bg-brand-600/20"
                      }`}>
                        <TriggerIcon className={`h-5 w-5 ${
                          heuristic.triggerType.includes("low") || heuristic.triggerType.includes("high") && heuristic.triggerType.includes("soreness")
                            ? "text-amber-400"
                            : "text-brand-400"
                        }`} />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold text-foreground">
                          {heuristic.name}
                        </CardTitle>
                        {heuristic.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{heuristic.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={heuristic.isActive ? "default" : "secondary"} className="text-xs">
                        {heuristic.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        P{heuristic.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 rounded-xl ringify space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-amber-400">WHEN:</span>
                      <span className="text-xs text-muted-foreground">{getTriggerLabel(heuristic.triggerType)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground pl-4">{heuristic.triggerCondition}</p>
                  </div>
                  <div className="p-3 rounded-xl ringify space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-emerald-400">THEN:</span>
                      <span className="text-xs text-muted-foreground">{getActionLabel(heuristic.actionType)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground pl-4">{heuristic.actionDetails}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={heuristic.isActive === 1}
                        onCheckedChange={(checked) =>
                          toggleActiveMutation.mutate({ id: heuristic.id, isActive: checked ? 1 : 0 })
                        }
                        data-testid={`toggle-active-${heuristic.id}`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {heuristic.isActive ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(heuristic)}
                        data-testid={`button-edit-${heuristic.id}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(heuristic.id)}
                        data-testid={`button-delete-${heuristic.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-0">
          <CardContent className="p-12 text-center">
            <Brain className="h-16 w-16 mx-auto mb-4 text-slate-600" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Rules Defined Yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Create coaching intelligence rules to automate decisions. For example:
              "When readiness is below 5, reduce training volume by 20%"
            </p>
            <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Rule
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="border-0">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Example Rules to Get Started
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: "Low Readiness Deload",
                trigger: "When readiness < 5",
                action: "Reduce volume by 20%",
              },
              {
                name: "High Soreness Alert",
                trigger: "When soreness > 7",
                action: "Flag for coach review",
              },
              {
                name: "ACL Pathway Mobility",
                trigger: "Athlete is ACL pathway",
                action: "Add hip mobility exercises daily",
              },
              {
                name: "Missed Sessions Follow-up",
                trigger: "2+ sessions missed",
                action: "Send check-in notification",
              },
              {
                name: "PR Celebration",
                trigger: "Personal record achieved",
                action: "Award bonus XP and notify",
              },
              {
                name: "Peak Week Taper",
                trigger: "Week before competition",
                action: "Reduce intensity to 70%",
              },
            ].map((example, index) => (
              <div
                key={index}
                className="p-3 rounded-xl ringify hover-elevate cursor-pointer"
                onClick={() => {
                  setFormData({
                    ...formData,
                    name: example.name,
                    triggerCondition: example.trigger,
                    actionDetails: example.action,
                  });
                  setIsDialogOpen(true);
                }}
                data-testid={`example-rule-${index}`}
              >
                <p className="text-sm font-medium text-foreground">{example.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-amber-400">When:</span> {example.trigger}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="text-emerald-400">Then:</span> {example.action}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
