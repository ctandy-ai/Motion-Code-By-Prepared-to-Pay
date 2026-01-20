import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, Zap, Activity, Target, Shield, Info, ChevronDown } from "lucide-react";
import { useState } from "react";

interface EngineGuidance {
  belt: "WHITE" | "BLUE" | "BLACK";
  beltReasons: string[];
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
    forbiddenExerciseTypes: string[];
  };
  globalStopRules: string[];
  warnings: string[];
}

interface InlineEngineGuidanceProps {
  athleteId?: string;
  phase: string;
  waveWeek: number;
  currentPlyoContacts?: number;
  currentHardSets?: number;
  currentSpeedTouches?: number;
  onPhaseChange?: (phase: string) => void;
  onWaveWeekChange?: (week: number) => void;
}

export function InlineEngineGuidance({
  athleteId,
  phase,
  waveWeek,
  currentPlyoContacts = 0,
  currentHardSets = 0,
  currentSpeedTouches = 0,
}: InlineEngineGuidanceProps) {
  const [showDetails, setShowDetails] = useState(false);

  const queryParams = `?athleteId=${athleteId}&phase=${phase}&waveWeek=${waveWeek}&trainingDaysPerWeek=4`;
  const { data: guidance } = useQuery<EngineGuidance>({
    queryKey: ["/api/program-engine/preview", athleteId, phase, waveWeek, 4],
    queryFn: () => fetch(`/api/program-engine/preview${queryParams}`).then(res => res.json()),
    enabled: !!athleteId,
  });

  if (!guidance) {
    return null;
  }

  const beltColor = (belt: string) => {
    switch (belt) {
      case "WHITE": return "bg-slate-100 text-slate-800";
      case "BLUE": return "bg-blue-500 text-white";
      case "BLACK": return "bg-slate-900 text-white border border-slate-600";
      default: return "bg-slate-500 text-white";
    }
  };

  const getProgressColor = (current: number, max: number) => {
    const pct = (current / max) * 100;
    if (pct > 100) return "bg-red-500";
    if (pct > 85) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const plyoPct = Math.min(100, (currentPlyoContacts / guidance.budgets.plyoContacts) * 100);
  const setsPct = Math.min(100, (currentHardSets / guidance.budgets.hardLowerSets) * 100);
  const speedPct = Math.min(100, (currentSpeedTouches / guidance.budgets.speedTouches) * 100);

  const plyoOverBudget = currentPlyoContacts > guidance.budgets.plyoContacts;
  const setsOverBudget = currentHardSets > guidance.budgets.hardLowerSets;

  return (
    <div className="bg-slate-900/50 border-b border-slate-700/50 px-4 py-2" data-testid="inline-engine-guidance">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-brand-400" />
          <span className="text-xs font-medium text-slate-300">Engine</span>
          <Badge className={`${beltColor(guidance.belt)} text-[10px]`}>
            {guidance.belt}
          </Badge>
          {guidance.stageConstraints.active && (
            <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-400">
              <Shield className="h-2.5 w-2.5 mr-1" />
              {guidance.stageConstraints.stageName}
            </Badge>
          )}
        </div>

        <div className="flex-1 flex items-center gap-6 min-w-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 min-w-[140px]">
                <Zap className={`h-3 w-3 ${plyoOverBudget ? "text-red-400" : "text-slate-400"}`} />
                <div className="flex-1">
                  <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getProgressColor(currentPlyoContacts, guidance.budgets.plyoContacts)} transition-all`}
                      style={{ width: `${plyoPct}%` }}
                    />
                  </div>
                </div>
                <span className={`text-[10px] tabular-nums ${plyoOverBudget ? "text-red-400" : "text-slate-400"}`}>
                  {currentPlyoContacts}/{guidance.budgets.plyoContacts}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <p className="font-medium">Plyo Contacts</p>
              <p className="text-slate-400">Max {guidance.sessionCaps.plyoContactsPerSession}/session</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 min-w-[140px]">
                <Activity className={`h-3 w-3 ${setsOverBudget ? "text-red-400" : "text-slate-400"}`} />
                <div className="flex-1">
                  <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getProgressColor(currentHardSets, guidance.budgets.hardLowerSets)} transition-all`}
                      style={{ width: `${setsPct}%` }}
                    />
                  </div>
                </div>
                <span className={`text-[10px] tabular-nums ${setsOverBudget ? "text-red-400" : "text-slate-400"}`}>
                  {currentHardSets}/{guidance.budgets.hardLowerSets}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <p className="font-medium">Hard Lower Sets</p>
              <p className="text-slate-400">Max {guidance.sessionCaps.hardLowerSetsPerSession}/session</p>
            </TooltipContent>
          </Tooltip>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-500">Speed:</span>
            <span className={`text-[10px] tabular-nums ${currentSpeedTouches > guidance.budgets.speedTouches ? "text-red-400" : "text-slate-400"}`}>
              {currentSpeedTouches}/{guidance.budgets.speedTouches}
            </span>
          </div>
        </div>

        {(guidance.warnings.length > 0 || plyoOverBudget || setsOverBudget) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 text-amber-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span className="text-[10px]">{guidance.warnings.length + (plyoOverBudget ? 1 : 0) + (setsOverBudget ? 1 : 0)}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs max-w-[250px]">
              <ul className="space-y-1">
                {plyoOverBudget && <li className="text-red-400">Plyo contacts over budget!</li>}
                {setsOverBudget && <li className="text-red-400">Hard sets over budget!</li>}
                {guidance.warnings.map((w, i) => (
                  <li key={i} className="text-amber-400">{w}</li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        )}

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300"
        >
          <Info className="h-3 w-3" />
          <ChevronDown className={`h-3 w-3 transition-transform ${showDetails ? "rotate-180" : ""}`} />
        </button>
      </div>

      {showDetails && (
        <div className="mt-2 pt-2 border-t border-slate-700/30 grid grid-cols-2 gap-4 text-[10px]">
          <div>
            <p className="text-slate-500 mb-1">Belt Reasons:</p>
            <ul className="space-y-0.5">
              {guidance.beltReasons.map((r, i) => (
                <li key={i} className="text-slate-400">• {r}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-slate-500 mb-1">Stop Rules:</p>
            <ul className="space-y-0.5">
              {guidance.globalStopRules.slice(0, 3).map((r, i) => (
                <li key={i} className="text-slate-400">• {r}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
