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
      <Card className="bglass shadow-glass border-0">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-slate-700/50 rounded w-1/3" />
            <div className="h-8 bg-slate-700/50 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bglass shadow-glass border-0" data-testid="athlete-training-profile">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-slate-100 flex items-center justify-between gap-2">
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
              <Label className="text-xs text-slate-400">Training Age (years)</Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                max="30"
                value={formData.trainingAgeYears}
                onChange={(e) => setFormData({ ...formData, trainingAgeYears: parseFloat(e.target.value) || 0 })}
                className="h-8 bg-slate-800/50 border-slate-600"
                data-testid="input-training-age"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-slate-400">Movement Quality (1-5)</Label>
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

            <div className="space-y-2">
              <Label className="text-xs text-slate-400 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Injury Flags
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between p-2 rounded bg-slate-800/30">
                  <span className="text-xs text-slate-300">Recurrent Hamstring</span>
                  <Switch
                    checked={formData.recurrentHamstring === 1}
                    onCheckedChange={(c) => setFormData({ ...formData, recurrentHamstring: c ? 1 : 0 })}
                    data-testid="switch-recurrent-hamstring"
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-800/30">
                  <span className="text-xs text-slate-300">Recurrent Calf</span>
                  <Switch
                    checked={formData.recurrentCalf === 1}
                    onCheckedChange={(c) => setFormData({ ...formData, recurrentCalf: c ? 1 : 0 })}
                    data-testid="switch-recurrent-calf"
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-800/30">
                  <span className="text-xs text-slate-300">Recurrent Groin</span>
                  <Switch
                    checked={formData.recurrentGroin === 1}
                    onCheckedChange={(c) => setFormData({ ...formData, recurrentGroin: c ? 1 : 0 })}
                    data-testid="switch-recurrent-groin"
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-slate-800/30">
                  <span className="text-xs text-slate-300">Recent RTP</span>
                  <Switch
                    checked={formData.recentRTP === 1}
                    onCheckedChange={(c) => setFormData({ ...formData, recentRTP: c ? 1 : 0 })}
                    data-testid="switch-recent-rtp"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-slate-400 flex items-center gap-1">
                <Activity className="h-3 w-3" /> Recent Exposure
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <span className="text-xs text-slate-500">Sprints (14d)</span>
                  <Input
                    type="number"
                    min="0"
                    value={formData.sprintExposuresLast14d}
                    onChange={(e) => setFormData({ ...formData, sprintExposuresLast14d: parseInt(e.target.value) || 0 })}
                    className="h-8 bg-slate-800/50 border-slate-600 text-xs"
                    data-testid="input-sprint-exposures"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-500">High Decel (14d)</span>
                  <Input
                    type="number"
                    min="0"
                    value={formData.highDecelSessionsLast14d}
                    onChange={(e) => setFormData({ ...formData, highDecelSessionsLast14d: parseInt(e.target.value) || 0 })}
                    className="h-8 bg-slate-800/50 border-slate-600 text-xs"
                    data-testid="input-decel-sessions"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-500">Strength (7d)</span>
                  <Input
                    type="number"
                    min="0"
                    value={formData.strengthSessionsLast7d}
                    onChange={(e) => setFormData({ ...formData, strengthSessionsLast7d: parseInt(e.target.value) || 0 })}
                    className="h-8 bg-slate-800/50 border-slate-600 text-xs"
                    data-testid="input-strength-sessions"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : profile ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 rounded bg-slate-800/30">
                <div className="text-xs text-slate-500">Training Age</div>
                <div className="text-sm font-medium text-slate-200">
                  {profile.trainingAgeYears?.toFixed(1) || "0"} years
                </div>
              </div>
              <div className="p-2 rounded bg-slate-800/30">
                <div className="text-xs text-slate-500">Movement Quality</div>
                <div className="text-sm font-medium text-slate-200">
                  {movementQualityLabels[profile.movementQualityScore || 3]}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-slate-500">Injury Flags</div>
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
                {!profile.recurrentHamstring && !profile.recurrentCalf && !profile.recurrentGroin && !profile.recentRTP && (
                  <span className="text-xs text-slate-500">None</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded bg-slate-800/30">
                <div className="text-xs text-slate-500">Sprints</div>
                <div className="text-sm font-medium text-slate-200">
                  {profile.sprintExposuresLast14d || 0}
                </div>
                <div className="text-[10px] text-slate-600">14 days</div>
              </div>
              <div className="p-2 rounded bg-slate-800/30">
                <div className="text-xs text-slate-500">High Decel</div>
                <div className="text-sm font-medium text-slate-200">
                  {profile.highDecelSessionsLast14d || 0}
                </div>
                <div className="text-[10px] text-slate-600">14 days</div>
              </div>
              <div className="p-2 rounded bg-slate-800/30">
                <div className="text-xs text-slate-500">Strength</div>
                <div className="text-sm font-medium text-slate-200">
                  {profile.strengthSessionsLast7d || 0}
                </div>
                <div className="text-[10px] text-slate-600">7 days</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-slate-400 mb-3">No training profile set up yet</p>
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
