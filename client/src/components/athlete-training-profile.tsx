import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Settings, User, Activity, AlertTriangle, Zap, Save, X, Edit2 } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AthleteTrainingProfile } from "@shared/schema";

interface AthleteTrainingProfileProps {
  athleteId: string;
  athleteName?: string;
}

export function AthleteTrainingProfileCard({ athleteId, athleteName }: AthleteTrainingProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const { data: profile, isLoading } = useQuery<AthleteTrainingProfile>({
    queryKey: ["/api/athletes", athleteId, "training-profile"],
    queryFn: async () => {
      const response = await fetch(`/api/athletes/${athleteId}/training-profile`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch training profile");
      }
      return response.json();
    },
  });

  const [formData, setFormData] = useState({
    trainingAgeYears: 0,
    movementQualityScore: 3,
    recurrentHamstring: 0,
    recurrentCalf: 0,
    recurrentGroin: 0,
    recentRTP: 0,
    aclHistory: 0,
    ankleInjury: 0,
    kneeIssues: 0,
    shoulderInjury: 0,
    lowerBackIssues: 0,
    concussionProtocol: 0,
    sprintExposuresLast14d: 0,
    highDecelSessionsLast14d: 0,
    strengthSessionsLast7d: 0,
  });

  const startEditing = () => {
    if (profile) {
      setFormData({
        trainingAgeYears: profile.trainingAgeYears || 0,
        movementQualityScore: profile.movementQualityScore || 3,
        recurrentHamstring: profile.recurrentHamstring || 0,
        recurrentCalf: profile.recurrentCalf || 0,
        recurrentGroin: profile.recurrentGroin || 0,
        recentRTP: profile.recentRTP || 0,
        aclHistory: profile.aclHistory || 0,
        ankleInjury: profile.ankleInjury || 0,
        kneeIssues: profile.kneeIssues || 0,
        shoulderInjury: profile.shoulderInjury || 0,
        lowerBackIssues: profile.lowerBackIssues || 0,
        concussionProtocol: profile.concussionProtocol || 0,
        sprintExposuresLast14d: profile.sprintExposuresLast14d || 0,
        highDecelSessionsLast14d: profile.highDecelSessionsLast14d || 0,
        strengthSessionsLast7d: profile.strengthSessionsLast7d || 0,
      });
    }
    setIsEditing(true);
  };

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", `/api/athletes/${athleteId}/training-profile`, {
        athleteId,
        ...data,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/athletes", athleteId, "training-profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/program-engine/preview", athleteId] });
      setIsEditing(false);
      toast({ title: "Training profile updated" });
    },
    onError: () => {
      toast({ title: "Failed to update profile", variant: "destructive" });
    },
  });

  const movementQualityLabels: Record<number, string> = {
    1: "Poor",
    2: "Below Average",
    3: "Average",
    4: "Good",
    5: "Excellent",
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-8 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="athlete-training-profile">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-brand-400" />
            Training Profile
          </span>
          {!isEditing ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={startEditing}
              data-testid="edit-profile-button"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(false)}
                data-testid="cancel-edit-button"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateMutation.mutate(formData)}
                disabled={updateMutation.isPending}
                data-testid="save-profile-button"
              >
                <Save className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Training Age (years)</Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                max="30"
                value={formData.trainingAgeYears}
                onChange={(e) => setFormData({ ...formData, trainingAgeYears: parseFloat(e.target.value) || 0 })}
                className="h-8 bg-muted border-border"
                data-testid="input-training-age"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Movement Quality (1-5)</Label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[formData.movementQualityScore]}
                  onValueChange={(v) => setFormData({ ...formData, movementQualityScore: v[0] })}
                  min={1}
                  max={5}
                  step={1}
                  className="flex-1"
                  data-testid="slider-movement-quality"
                />
                <Badge variant="outline" className="w-20 justify-center">
                  {movementQualityLabels[formData.movementQualityScore]}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Soft Tissue Injuries
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between p-2 rounded bg-muted">
                  <span className="text-xs text-muted-foreground">Recurrent Hamstring</span>
                  <Switch
                    checked={formData.recurrentHamstring === 1}
                    onCheckedChange={(c) => setFormData({ ...formData, recurrentHamstring: c ? 1 : 0 })}
                    data-testid="switch-recurrent-hamstring"
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted">
                  <span className="text-xs text-muted-foreground">Recurrent Calf</span>
                  <Switch
                    checked={formData.recurrentCalf === 1}
                    onCheckedChange={(c) => setFormData({ ...formData, recurrentCalf: c ? 1 : 0 })}
                    data-testid="switch-recurrent-calf"
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted">
                  <span className="text-xs text-muted-foreground">Recurrent Groin</span>
                  <Switch
                    checked={formData.recurrentGroin === 1}
                    onCheckedChange={(c) => setFormData({ ...formData, recurrentGroin: c ? 1 : 0 })}
                    data-testid="switch-recurrent-groin"
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted">
                  <span className="text-xs text-muted-foreground">Recent RTP</span>
                  <Switch
                    checked={formData.recentRTP === 1}
                    onCheckedChange={(c) => setFormData({ ...formData, recentRTP: c ? 1 : 0 })}
                    data-testid="switch-recent-rtp"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Joint/Ligament Issues
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between p-2 rounded bg-muted">
                  <span className="text-xs text-muted-foreground">ACL History</span>
                  <Switch
                    checked={formData.aclHistory === 1}
                    onCheckedChange={(c) => setFormData({ ...formData, aclHistory: c ? 1 : 0 })}
                    data-testid="switch-acl-history"
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted">
                  <span className="text-xs text-muted-foreground">Ankle Injury</span>
                  <Switch
                    checked={formData.ankleInjury === 1}
                    onCheckedChange={(c) => setFormData({ ...formData, ankleInjury: c ? 1 : 0 })}
                    data-testid="switch-ankle-injury"
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted">
                  <span className="text-xs text-muted-foreground">Knee Issues</span>
                  <Switch
                    checked={formData.kneeIssues === 1}
                    onCheckedChange={(c) => setFormData({ ...formData, kneeIssues: c ? 1 : 0 })}
                    data-testid="switch-knee-issues"
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted">
                  <span className="text-xs text-muted-foreground">Shoulder Injury</span>
                  <Switch
                    checked={formData.shoulderInjury === 1}
                    onCheckedChange={(c) => setFormData({ ...formData, shoulderInjury: c ? 1 : 0 })}
                    data-testid="switch-shoulder-injury"
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted">
                  <span className="text-xs text-muted-foreground">Lower Back Issues</span>
                  <Switch
                    checked={formData.lowerBackIssues === 1}
                    onCheckedChange={(c) => setFormData({ ...formData, lowerBackIssues: c ? 1 : 0 })}
                    data-testid="switch-lower-back-issues"
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-red-900/30 border border-red-600/30">
                  <span className="text-xs text-red-300">Concussion Protocol</span>
                  <Switch
                    checked={formData.concussionProtocol === 1}
                    onCheckedChange={(c) => setFormData({ ...formData, concussionProtocol: c ? 1 : 0 })}
                    data-testid="switch-concussion-protocol"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Activity className="h-3 w-3" /> Recent Exposure
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Sprints (14d)</span>
                  <Input
                    type="number"
                    min="0"
                    value={formData.sprintExposuresLast14d}
                    onChange={(e) => setFormData({ ...formData, sprintExposuresLast14d: parseInt(e.target.value) || 0 })}
                    className="h-8 bg-muted border-border text-xs"
                    data-testid="input-sprint-exposures"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">High Decel (14d)</span>
                  <Input
                    type="number"
                    min="0"
                    value={formData.highDecelSessionsLast14d}
                    onChange={(e) => setFormData({ ...formData, highDecelSessionsLast14d: parseInt(e.target.value) || 0 })}
                    className="h-8 bg-muted border-border text-xs"
                    data-testid="input-decel-sessions"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Strength (7d)</span>
                  <Input
                    type="number"
                    min="0"
                    value={formData.strengthSessionsLast7d}
                    onChange={(e) => setFormData({ ...formData, strengthSessionsLast7d: parseInt(e.target.value) || 0 })}
                    className="h-8 bg-muted border-border text-xs"
                    data-testid="input-strength-sessions"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : profile ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 rounded bg-muted">
                <div className="text-xs text-muted-foreground">Training Age</div>
                <div className="text-sm font-medium text-foreground">
                  {profile.trainingAgeYears?.toFixed(1) || "0"} years
                </div>
              </div>
              <div className="p-2 rounded bg-muted">
                <div className="text-xs text-muted-foreground">Movement Quality</div>
                <div className="text-sm font-medium text-foreground">
                  {movementQualityLabels[profile.movementQualityScore || 3]}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Injury Flags</div>
              <div className="flex flex-wrap gap-1">
                {profile.recurrentHamstring ? (
                  <Badge variant="destructive" className="text-xs">Hamstring</Badge>
                ) : null}
                {profile.recurrentCalf ? (
                  <Badge variant="destructive" className="text-xs">Calf</Badge>
                ) : null}
                {profile.recurrentGroin ? (
                  <Badge variant="destructive" className="text-xs">Groin</Badge>
                ) : null}
                {profile.recentRTP ? (
                  <Badge variant="outline" className="text-xs border-amber-500 text-amber-400">RTP</Badge>
                ) : null}
                {profile.aclHistory ? (
                  <Badge variant="destructive" className="text-xs">ACL</Badge>
                ) : null}
                {profile.ankleInjury ? (
                  <Badge variant="destructive" className="text-xs">Ankle</Badge>
                ) : null}
                {profile.kneeIssues ? (
                  <Badge variant="destructive" className="text-xs">Knee</Badge>
                ) : null}
                {profile.shoulderInjury ? (
                  <Badge variant="destructive" className="text-xs">Shoulder</Badge>
                ) : null}
                {profile.lowerBackIssues ? (
                  <Badge variant="destructive" className="text-xs">Lower Back</Badge>
                ) : null}
                {profile.concussionProtocol ? (
                  <Badge className="text-xs bg-red-700 text-white">Concussion</Badge>
                ) : null}
                {!profile.recurrentHamstring && !profile.recurrentCalf && !profile.recurrentGroin && !profile.recentRTP && 
                 !profile.aclHistory && !profile.ankleInjury && !profile.kneeIssues && !profile.shoulderInjury && 
                 !profile.lowerBackIssues && !profile.concussionProtocol && (
                  <span className="text-xs text-muted-foreground">None</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded bg-muted">
                <div className="text-xs text-muted-foreground">Sprints</div>
                <div className="text-sm font-medium text-foreground">
                  {profile.sprintExposuresLast14d || 0}
                </div>
                <div className="text-[10px] text-muted-foreground">14 days</div>
              </div>
              <div className="p-2 rounded bg-muted">
                <div className="text-xs text-muted-foreground">High Decel</div>
                <div className="text-sm font-medium text-foreground">
                  {profile.highDecelSessionsLast14d || 0}
                </div>
                <div className="text-[10px] text-muted-foreground">14 days</div>
              </div>
              <div className="p-2 rounded bg-muted">
                <div className="text-xs text-muted-foreground">Strength</div>
                <div className="text-sm font-medium text-foreground">
                  {profile.strengthSessionsLast7d || 0}
                </div>
                <div className="text-[10px] text-muted-foreground">7 days</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">No training profile set up yet</p>
            <Button
              variant="outline"
              size="sm"
              onClick={startEditing}
              data-testid="create-profile-button"
            >
              Set Up Profile
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
