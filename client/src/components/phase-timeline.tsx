import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ProgramPhase, ProgramWeek } from "@shared/schema";

interface PhaseTimelineProps {
  phases: ProgramPhase[];
  weeks: ProgramWeek[];
  currentWeek: number;
  onWeekSelect: (weekNumber: number) => void;
}

const PHASE_COLORS = {
  base: "bg-blue-600/30 border-blue-600/50",
  build: "bg-teal-600/30 border-teal-600/50",
  peak: "bg-coral-600/30 border-coral-600/50",
  taper: "bg-purple-600/30 border-purple-600/50",
  competition: "bg-gold-600/30 border-gold-600/50",
  recovery: "bg-slate-600/30 border-slate-600/50",
  other: "bg-ink-3/30 border-ink-4/50",
};

export function PhaseTimeline({ phases, weeks, currentWeek, onWeekSelect }: PhaseTimelineProps) {
  const [viewStart, setViewStart] = useState(Math.max(1, currentWeek - 4));
  const visibleWeeks = 13; // Show 13 weeks at a time for better visibility

  const getPhaseForWeek = (weekNumber: number) => {
    return phases.find(
      (phase) => weekNumber >= phase.startWeek && weekNumber <= phase.endWeek
    );
  };

  const getWeekMetadata = (weekNumber: number) => {
    return weeks.find((w) => w.weekNumber === weekNumber);
  };

  const getPhaseColor = (phaseType: string) => {
    return PHASE_COLORS[phaseType.toLowerCase() as keyof typeof PHASE_COLORS] || PHASE_COLORS.other;
  };

  const handlePrevious = () => {
    setViewStart(Math.max(1, viewStart - visibleWeeks));
  };

  const handleNext = () => {
    setViewStart(Math.min(52 - visibleWeeks + 1, viewStart + visibleWeeks));
  };

  const visibleWeekNumbers = Array.from(
    { length: visibleWeeks },
    (_, i) => viewStart + i
  ).filter((w) => w <= 52);

  return (
    <Card className="p-4" data-testid="phase-timeline">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          52-Week Program Timeline
        </h3>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            data-testid="button-timeline-previous"
            onClick={handlePrevious}
            disabled={viewStart === 1}
            className="h-7 w-7"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground" data-testid="text-week-range">
            Weeks {viewStart}-{Math.min(viewStart + visibleWeeks - 1, 52)}
          </span>
          <Button
            size="icon"
            variant="ghost"
            data-testid="button-timeline-next"
            onClick={handleNext}
            disabled={viewStart + visibleWeeks > 52}
            className="h-7 w-7"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Phase Bands */}
      <div className="space-y-4">
        {phases.length > 0 ? (
          phases.map((phase) => {
            const isVisible =
              phase.endWeek >= viewStart &&
              phase.startWeek <= viewStart + visibleWeeks - 1;
            
            if (!isVisible) return null;

            const startInView = Math.max(phase.startWeek, viewStart);
            const endInView = Math.min(phase.endWeek, viewStart + visibleWeeks - 1);
            const leftOffset = ((startInView - viewStart) / visibleWeeks) * 100;
            const width = ((endInView - startInView + 1) / visibleWeeks) * 100;

            return (
              <div
                key={phase.id}
                data-testid={`phase-band-${phase.id}`}
                className="relative"
              >
                <div
                  className={`relative rounded-lg border p-3 ${getPhaseColor(phase.phaseType)}`}
                  style={{
                    marginLeft: `${leftOffset}%`,
                    width: `${width}%`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-foreground truncate" data-testid={`text-phase-name-${phase.id}`}>
                        {phase.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1" data-testid={`text-phase-weeks-${phase.id}`}>
                        Weeks {phase.startWeek}-{phase.endWeek} ({phase.endWeek - phase.startWeek + 1} weeks)
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs whitespace-nowrap ml-2" data-testid={`badge-phase-type-${phase.id}`}>
                      {phase.phaseType}
                    </Badge>
                  </div>
                  {phase.goals && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-1" data-testid={`text-phase-goals-${phase.id}`}>
                      {phase.goals}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No phases defined. Create phases to structure your 52-week program.
          </div>
        )}
      </div>

      {/* Week Selector */}
      <div className="mt-6 pt-4 border-t border-ink-3">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${visibleWeekNumbers.length}, 1fr)` }}>
          {visibleWeekNumbers.map((weekNum) => {
            const phase = getPhaseForWeek(weekNum);
            const weekMeta = getWeekMetadata(weekNum);
            const isActive = weekNum === currentWeek;

            return (
              <button
                key={weekNum}
                data-testid={`button-week-${weekNum}`}
                onClick={() => onWeekSelect(weekNum)}
                className={`
                  relative p-2 rounded text-center transition-all
                  ${isActive ? "ring-2 ring-primary bg-primary/20" : "hover-elevate active-elevate-2"}
                  ${phase ? "border" : "border border-dashed border-ink-4"}
                `}
                style={
                  phase
                    ? { borderColor: getPhaseColor(phase.phaseType).split(" ")[1].replace("border-", "") }
                    : undefined
                }
              >
                <div className="text-xs font-semibold text-foreground" data-testid={`text-week-number-${weekNum}`}>
                  W{weekNum}
                </div>
                {weekMeta?.beltTarget && (
                  <Badge variant="secondary" className="text-[10px] mt-1 px-1 py-0" data-testid={`badge-belt-${weekNum}`}>
                    {weekMeta.beltTarget}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
