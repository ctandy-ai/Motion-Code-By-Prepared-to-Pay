import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Zap, Target, Activity, Shield, Info, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

interface EngineGuidance {
  belt: "WHITE" | "BLUE" | "BLACK";
  beltReasons: string[];
  modifiers: string[];
  phase: string;
  waveWeek: number;
  budgets: {
    plyoContacts: number;
    hardLowerSets: number;
    speedTouches: number;
  };
  sessionCaps: {
    plyoContactsPerSession: number;
    hardLowerSetsPerSession: number;
  };
  stageConstraints: {
    active: boolean;
    stageName?: string;
    allowedPlyoBands: string[];
    maxPlyoContactsWeek?: number;
    stopRules: string[];
    requiredExerciseTypes: string[];
    forbiddenExerciseTypes: string[];
  };
  globalStopRules: string[];
  warnings: string[];
  recommendations: string[];
}

interface PhaseOption {
  value: string;
  label: string;
}

interface WaveWeekOption {
  value: number;
  label: string;
  description: string;
}

interface EngineOptions {
  phases: PhaseOption[];
  waveWeeks: WaveWeekOption[];
}

interface ProgramEngineGuidanceProps {
  athleteId: string;
  athleteName?: string;
  trainingDaysPerWeek?: number;
  currentPlyoContacts?: number;
  currentHardSets?: number;
  onPhaseChange?: (phase: string) => void;
  onWaveWeekChange?: (waveWeek: number) => void;
}

export function ProgramEngineGuidance({
  athleteId,
  athleteName,
  trainingDaysPerWeek = 3,
  currentPlyoContacts = 0,
  currentHardSets = 0,
  onPhaseChange,
  onWaveWeekChange,
}: ProgramEngineGuidanceProps) {
  const [phase, setPhase] = useState<string>("PRESEASON_A");
  const [waveWeek, setWaveWeek] = useState<number>(1);
  const [showDetails, setShowDetails] = useState(false);

  const { data: options } = useQuery<EngineOptions>({
    queryKey: ["/api/program-engine/options"],
  });

  const { data: guidance, isLoading } = useQuery<EngineGuidance>({
    queryKey: ["/api/program-engine/preview", athleteId, phase, waveWeek],
    queryFn: async () => {
      const response = await apiRequest("POST", "/api/program-engine/preview", {
        athleteId,
        phase,
        waveWeek,
        trainingDaysPerWeek,
      });
      return response.json();
    },
    enabled: !!athleteId,
  });

  const handlePhaseChange = (newPhase: string) => {
    setPhase(newPhase);
    onPhaseChange?.(newPhase);
  };

  const handleWaveWeekChange = (newWaveWeek: string) => {
    const week = parseInt(newWaveWeek) as 1 | 2 | 3;
    setWaveWeek(week);
    onWaveWeekChange?.(week);
  };

  const beltColor = (belt: string) => {
    switch (belt) {
      case "WHITE": return "bg-slate-100 text-slate-800";
      case "BLUE": return "bg-blue-500 text-white";
      case "BLACK": return "bg-slate-900 text-white border border-slate-600";
      default: return "bg-slate-500 text-white";
    }
  };

  const budgetProgress = (current: number, max: number) => {
    const percentage = Math.min(100, (current / max) * 100);
    const color = percentage > 100 ? "bg-red-500" : percentage > 80 ? "bg-amber-500" : "bg-emerald-500";
    return { percentage, color };
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-8 bg-muted rounded" />
            <div className="h-8 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!guidance) {
    return null;
  }

  const plyoProgress = budgetProgress(currentPlyoContacts, guidance.budgets.plyoContacts);
  const setsProgress = budgetProgress(currentHardSets, guidance.budgets.hardLowerSets);

  return (
    <Card data-testid="program-engine-guidance">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Target className="h-4 w-4 text-brand-400" />
            Engine Guidance
            {athleteName && <span className="text-muted-foreground font-normal">for {athleteName}</span>}
          </CardTitle>
          <Badge className={`${beltColor(guidance.belt)} text-xs`}>
            {guidance.belt} Belt
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Phase</label>
            <Select value={phase} onValueChange={handlePhaseChange}>
              <SelectTrigger className="h-8 text-xs bg-muted border-border" data-testid="select-phase">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options?.phases.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Wave Week</label>
            <Select value={String(waveWeek)} onValueChange={handleWaveWeekChange}>
              <SelectTrigger className="h-8 text-xs bg-muted border-border" data-testid="select-wave-week">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options?.waveWeeks.map((w) => (
                  <SelectItem key={w.value} value={String(w.value)}>
                    {w.label}: {w.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Plyo Contacts
              </span>
              <span className="text-muted-foreground">
                {currentPlyoContacts} / {guidance.budgets.plyoContacts}
                <span className="text-muted-foreground ml-1">
                  ({guidance.sessionCaps.plyoContactsPerSession}/session)
                </span>
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full ${plyoProgress.color} transition-all`}
                style={{ width: `${plyoProgress.percentage}%` }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Hard Lower Sets
              </span>
              <span className="text-muted-foreground">
                {currentHardSets} / {guidance.budgets.hardLowerSets}
                <span className="text-muted-foreground ml-1">
                  ({guidance.sessionCaps.hardLowerSetsPerSession}/session)
                </span>
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full ${setsProgress.color} transition-all`}
                style={{ width: `${setsProgress.percentage}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted">
            <span className="text-muted-foreground">Speed Touches/Week</span>
            <Badge variant="outline" className="text-xs">
              {guidance.budgets.speedTouches}
            </Badge>
          </div>
        </div>

        {(guidance.warnings.length > 0 || guidance.stageConstraints.active) && (
          <div className="space-y-2">
            {guidance.stageConstraints.active && (
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 text-xs text-amber-400">
                  <Shield className="h-3 w-3" />
                  <span className="font-medium">{guidance.stageConstraints.stageName} Active</span>
                </div>
                {guidance.stageConstraints.forbiddenExerciseTypes.length > 0 && (
                  <p className="text-xs text-amber-300/80 mt-1">
                    Avoid: {guidance.stageConstraints.forbiddenExerciseTypes.join(", ")}
                  </p>
                )}
              </div>
            )}
            
            {guidance.warnings.map((warning, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="h-3 w-3 text-amber-400 mt-0.5 shrink-0" />
                <span className="text-xs text-amber-300">{warning}</span>
              </div>
            ))}
          </div>
        )}

        {guidance.recommendations.length > 0 && (
          <div className="space-y-2">
            {guidance.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-brand-500/10 border border-brand-500/20">
                <Info className="h-3 w-3 text-brand-400 mt-0.5 shrink-0" />
                <span className="text-xs text-brand-300">{rec}</span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full justify-center pt-2"
          data-testid="toggle-details"
        >
          {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {showDetails ? "Hide" : "Show"} Belt Reasons & Stop Rules
        </button>

        {showDetails && (
          <div className="space-y-3 pt-2 border-t border-border">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Belt Classification Reasons:</p>
              <ul className="space-y-1">
                {guidance.beltReasons.map((reason, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                    <span className="text-muted-foreground">•</span>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Global Stop Rules:</p>
              <ul className="space-y-1">
                {guidance.globalStopRules.map((rule, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                    <span className="text-red-400">⚠</span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
