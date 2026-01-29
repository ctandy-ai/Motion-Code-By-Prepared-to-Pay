import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar, Dumbbell, TrendingUp, TrendingDown, Activity, Info } from "lucide-react";
import type { Program, ProgramExercise, ProgramPhase } from "@shared/schema";

interface ProgramTimelineProps {
  program: Program;
  programExercises: ProgramExercise[];
  programPhases?: ProgramPhase[];
  onWeekSelect?: (week: number) => void;
  selectedWeek?: number;
}

interface WeekData {
  weekNumber: number;
  phase: string;
  exerciseCount: number;
  setCount: number;
  trainingDays: number[];
  intensity: "high" | "medium" | "low" | "deload";
}

const phaseColors: Record<string, string> = {
  foundation: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
  progression: "bg-blue-500/20 border-blue-500/40 text-blue-300",
  peak: "bg-amber-500/20 border-amber-500/40 text-amber-300",
  deload: "bg-purple-500/20 border-purple-500/40 text-purple-300",
  accumulation: "bg-cyan-500/20 border-cyan-500/40 text-cyan-300",
  intensification: "bg-orange-500/20 border-orange-500/40 text-orange-300",
  realization: "bg-red-500/20 border-red-500/40 text-red-300",
};

const intensityIcons: Record<string, typeof Activity> = {
  high: TrendingUp,
  medium: Activity,
  low: TrendingDown,
  deload: TrendingDown,
};

export function ProgramTimeline({ program, programExercises, programPhases, onWeekSelect, selectedWeek }: ProgramTimelineProps) {
  const hasRealPhases = programPhases && programPhases.length > 0;
  
  const weekData = useMemo(() => {
    const weeks: WeekData[] = [];
    const duration = program.duration || 4;
    
    for (let w = 1; w <= duration; w++) {
      const weekExercises = programExercises.filter(pe => pe.weekNumber === w);
      const uniqueDays = Array.from(new Set(weekExercises.map(pe => pe.dayNumber))).sort((a, b) => a - b);
      const totalSets = weekExercises.reduce((sum, pe) => sum + (pe.sets || 0), 0);
      
      let phase = "foundation";
      let intensity: "high" | "medium" | "low" | "deload" = "medium";
      
      const realPhase = programPhases?.find(p => w >= p.startWeek && w <= p.endWeek);
      if (realPhase) {
        phase = realPhase.phaseType?.toLowerCase() || realPhase.name?.toLowerCase() || "foundation";
        if (phase.includes("deload") || phase.includes("recovery")) {
          intensity = "deload";
        } else if (phase.includes("peak") || phase.includes("intense") || phase.includes("realization")) {
          intensity = "high";
        } else if (phase.includes("accumulation") || phase.includes("foundation")) {
          intensity = "medium";
        }
      } else {
        const weekPosition = (w - 1) / Math.max(duration - 1, 1);
        if (w % 4 === 0) {
          phase = "deload";
          intensity = "deload";
        } else if (weekPosition < 0.33) {
          phase = "foundation";
          intensity = "medium";
        } else if (weekPosition < 0.66) {
          phase = "progression";
          intensity = "high";
        } else {
          phase = "peak";
          intensity = "high";
        }
      }
      
      weeks.push({
        weekNumber: w,
        phase,
        exerciseCount: weekExercises.length,
        setCount: totalSets,
        trainingDays: uniqueDays,
        intensity,
      });
    }
    
    return weeks;
  }, [program.duration, programExercises, programPhases]);

  const totalExercises = programExercises.length;
  const totalSets = programExercises.reduce((sum, pe) => sum + (pe.sets || 0), 0);
  const activeDays = Array.from(new Set(programExercises.map(pe => `${pe.weekNumber}-${pe.dayNumber}`))).length;

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5 text-primary" />
            Program Timeline
          </CardTitle>
          <div className="flex gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Dumbbell className="w-4 h-4" />
              {totalExercises} exercises
            </span>
            <span>{totalSets} sets</span>
            <span>{activeDays} training days</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider delayDuration={0}>
          <div className="flex gap-1 overflow-x-auto pb-2">
            {weekData.map((week) => {
              const IntensityIcon = intensityIcons[week.intensity];
              const phaseStyle = phaseColors[week.phase] || phaseColors.foundation;
              const isSelected = selectedWeek === week.weekNumber;
              
              return (
                <Tooltip key={week.weekNumber}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onWeekSelect?.(week.weekNumber)}
                      className={`
                        flex-1 min-w-[80px] p-3 rounded-lg border transition-all
                        ${phaseStyle}
                        ${isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover-elevate"}
                      `}
                      data-testid={`timeline-week-${week.weekNumber}`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-medium opacity-70">Week {week.weekNumber}</span>
                        <span className="text-lg font-bold">{week.exerciseCount}</span>
                        <div className="flex gap-0.5 mt-1">
                          {[1, 2, 3, 4, 5, 6, 7].map(day => (
                            <div
                              key={day}
                              className={`w-2 h-2 rounded-full ${
                                week.trainingDays.includes(day) 
                                  ? "bg-current opacity-80" 
                                  : "bg-current opacity-20"
                              }`}
                            />
                          ))}
                        </div>
                        <IntensityIcon className="w-3 h-3 mt-1 opacity-60" />
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-semibold">Week {week.weekNumber}: {week.phase.charAt(0).toUpperCase() + week.phase.slice(1)}</p>
                      <p className="text-sm text-muted-foreground">
                        {week.exerciseCount} exercises, {week.setCount} sets
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Training days: {week.trainingDays.length > 0 ? week.trainingDays.join(", ") : "None"}
                      </p>
                      <Badge variant="outline" className="text-xs capitalize">{week.intensity} intensity</Badge>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        
          <div className="flex gap-4 mt-4 pt-3 border-t border-border/50 flex-wrap items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Phases:</span>
              {Object.entries(phaseColors).slice(0, 4).map(([phase, style]) => (
                <Badge key={phase} variant="outline" className={`${style} text-xs capitalize`}>
                  {phase}
                </Badge>
              ))}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-help">
                  <Info className="w-3.5 h-3.5" />
                  {hasRealPhases ? (
                    <span>Based on program phases</span>
                  ) : (
                    <span className="text-amber-400/80">Estimated periodization</span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                {hasRealPhases ? (
                  <p>Phase colors reflect the defined program structure</p>
                ) : (
                  <p>Phases estimated based on week position. Define phases for accurate visualization.</p>
                )}
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
