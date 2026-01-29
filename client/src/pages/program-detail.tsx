import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Program, ProgramPhase, ProgramWeek, TrainingBlock, BlockExercise, Exercise } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronDown, ChevronRight, Calendar, Layers, Dumbbell, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type BlockExerciseWithName = BlockExercise & { exerciseName?: string };
type BlockWithExercises = TrainingBlock & { exercises: BlockExerciseWithName[] };

interface ProgramStructure {
  phases: ProgramPhase[];
  weeks: ProgramWeek[];
  blocks: BlockWithExercises[];
}

export default function ProgramDetail() {
  const { programId } = useParams<{ programId: string }>();
  const [, setLocation] = useLocation();
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1]));
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

  const { data: program, isLoading: loadingProgram } = useQuery<Program>({
    queryKey: ["/api/programs", programId],
    queryFn: async () => {
      const response = await fetch(`/api/programs/${programId}`);
      if (!response.ok) throw new Error("Failed to fetch program");
      return response.json();
    },
  });

  const { data: structure, isLoading: loadingStructure } = useQuery<ProgramStructure>({
    queryKey: ["/api/programs", programId, "structure"],
    queryFn: async () => {
      const response = await fetch(`/api/programs/${programId}/structure`);
      if (!response.ok) throw new Error("Failed to fetch program structure");
      return response.json();
    },
    enabled: !!programId,
  });

  const { data: assignedAthletes } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/programs", programId, "athletes"],
    queryFn: async () => {
      const response = await fetch(`/api/athlete-programs?programId=${programId}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.map((ap: any) => ({ id: ap.athleteId, name: ap.athleteName || "Unknown" }));
    },
    enabled: !!programId,
  });

  const toggleWeek = (weekNumber: number) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekNumber)) {
      newExpanded.delete(weekNumber);
    } else {
      newExpanded.add(weekNumber);
    }
    setExpandedWeeks(newExpanded);
  };

  const togglePhase = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };

  const getWeeksForPhase = (phase: ProgramPhase) => {
    if (!structure?.weeks) return [];
    return structure.weeks
      .filter(w => w.phaseId === phase.id)
      .sort((a, b) => a.weekNumber - b.weekNumber);
  };

  const getBlocksForWeek = (weekNumber: number) => {
    if (!structure?.blocks) return [];
    return structure.blocks
      .filter(b => b.weekNumber === weekNumber)
      .sort((a, b) => {
        if (a.dayNumber !== b.dayNumber) return a.dayNumber - b.dayNumber;
        return (a.orderIndex || 0) - (b.orderIndex || 0);
      });
  };

  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  if (loadingProgram || loadingStructure) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-12 w-64 skeleton animate-shimmer rounded-lg" />
        <div className="h-64 skeleton animate-shimmer rounded-2xl" />
        <div className="h-64 skeleton animate-shimmer rounded-2xl" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-slate-200">Program not found</h2>
        <Button variant="outline" onClick={() => setLocation("/programs")} className="mt-4">
          Back to Programs
        </Button>
      </div>
    );
  }

  const phases = structure?.phases || [];
  const weeksWithoutPhase = structure?.weeks?.filter(w => !w.phaseId) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/programs")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-heading text-2xl font-bold text-slate-100">{program.name}</h1>
          {program.description && (
            <p className="text-sm text-slate-400 mt-1">{program.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            {program.duration} weeks
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation(`/programs/${programId}/build`)}
            data-testid="button-edit-program"
          >
            <Layers className="h-4 w-4 mr-1" />
            Edit Program
          </Button>
        </div>
      </div>

      {assignedAthletes && assignedAthletes.length > 0 && (
        <Card className="bglass shadow-glass">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Assigned Athletes ({assignedAthletes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="flex flex-wrap gap-2">
              {assignedAthletes.map(athlete => (
                <Badge
                  key={athlete.id}
                  variant="secondary"
                  className="cursor-pointer hover-elevate"
                  onClick={() => setLocation(`/athletes/${athlete.id}`)}
                  data-testid={`athlete-link-${athlete.id}`}
                >
                  {athlete.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {phases.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-heading text-lg font-semibold text-slate-200">Program Phases</h2>
          {phases.map(phase => {
            const phaseWeeks = getWeeksForPhase(phase);
            const isExpanded = expandedPhases.has(phase.id);
            
            return (
              <Card key={phase.id} className="bglass shadow-glass">
                <Collapsible open={isExpanded} onOpenChange={() => togglePhase(phase.id)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover-elevate py-3" data-testid={`phase-header-${phase.id}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          <CardTitle className="text-base">{phase.name}</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {phase.phaseType || "General"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span>Weeks {phase.startWeek}–{phase.endWeek}</span>
                          <span>({phaseWeeks.length} weeks)</span>
                        </div>
                      </div>
                      {phase.goals && (
                        <p className="text-xs text-slate-400 mt-1 ml-7">{phase.goals}</p>
                      )}
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-4">
                      <div className="space-y-3 ml-4">
                        {phaseWeeks.map(week => (
                          <WeekBlock
                            key={week.id}
                            week={week}
                            blocks={getBlocksForWeek(week.weekNumber)}
                            isExpanded={expandedWeeks.has(week.weekNumber)}
                            onToggle={() => toggleWeek(week.weekNumber)}
                            dayNames={dayNames}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}

      {weeksWithoutPhase.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-heading text-lg font-semibold text-slate-200">Weekly Schedule</h2>
          <div className="space-y-3">
            {weeksWithoutPhase
              .sort((a, b) => a.weekNumber - b.weekNumber)
              .map(week => (
                <WeekBlock
                  key={week.id}
                  week={week}
                  blocks={getBlocksForWeek(week.weekNumber)}
                  isExpanded={expandedWeeks.has(week.weekNumber)}
                  onToggle={() => toggleWeek(week.weekNumber)}
                  dayNames={dayNames}
                />
              ))}
          </div>
        </div>
      )}

      {phases.length === 0 && weeksWithoutPhase.length === 0 && (
        <Card className="bglass shadow-glass">
          <CardContent className="py-12 text-center">
            <Layers className="h-12 w-12 mx-auto text-slate-500 mb-4" />
            <h3 className="font-semibold text-lg text-slate-200 mb-2">No Program Content Yet</h3>
            <p className="text-sm text-slate-400 mb-4">
              This program doesn't have any phases, weeks, or training blocks defined.
            </p>
            <Button onClick={() => setLocation(`/programs/${programId}/build`)} data-testid="button-start-building">
              Start Building Program
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface WeekBlockProps {
  week: ProgramWeek;
  blocks: BlockWithExercises[];
  isExpanded: boolean;
  onToggle: () => void;
  dayNames: string[];
}

function WeekBlock({ week, blocks, isExpanded, onToggle, dayNames }: WeekBlockProps) {
  const blocksByDay = blocks.reduce((acc, block) => {
    const day = block.dayNumber;
    if (!acc[day]) acc[day] = [];
    acc[day].push(block);
    return acc;
  }, {} as Record<number, BlockWithExercises[]>);

  const totalExercises = blocks.reduce((sum, b) => sum + (b.exercises?.length || 0), 0);
  const activeDays = Object.keys(blocksByDay).length;

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <div 
          className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800/70 cursor-pointer transition-colors"
          data-testid={`week-header-${week.weekNumber}`}
        >
          <div className="flex items-center gap-3">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <span className="font-medium text-slate-200">Week {week.weekNumber}</span>
            {week.beltTarget && (
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  week.beltTarget === 'BLACK' ? 'border-slate-600 text-slate-300' :
                  week.beltTarget === 'BLUE' ? 'border-blue-500 text-blue-400' :
                  'border-slate-400 text-slate-300'
                }`}
              >
                {week.beltTarget}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>{activeDays} training days</span>
            <span>{blocks.length} sessions</span>
            <span>{totalExercises} exercises</span>
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 space-y-3 pl-6">
          {Object.entries(blocksByDay)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([dayNum, dayBlocks]) => (
              <div key={dayNum} className="border-l-2 border-slate-700 pl-4">
                <div className="text-sm font-medium text-slate-300 mb-2">
                  {dayNames[parseInt(dayNum) - 1] || `Day ${dayNum}`}
                </div>
                <div className="space-y-2">
                  {dayBlocks.map(block => (
                    <div 
                      key={block.id} 
                      className="p-3 rounded-lg bg-slate-800/30"
                      data-testid={`block-${block.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Dumbbell className="h-4 w-4 text-amber-500" />
                          <span className="font-medium text-slate-200">{block.title}</span>
                        </div>
                        {block.belt && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              block.belt === 'BLACK' ? 'border-slate-600' :
                              block.belt === 'BLUE' ? 'border-blue-500 text-blue-400' :
                              'border-slate-400'
                            }`}
                          >
                            {block.belt}
                          </Badge>
                        )}
                      </div>
                      {block.focus && block.focus.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {block.focus.map((area: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {block.exercises && block.exercises.length > 0 ? (
                        <div className="space-y-1.5 mt-3">
                          {block.exercises
                            .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
                            .map((exercise, idx) => (
                              <div 
                                key={exercise.id} 
                                className="flex items-center justify-between text-sm py-1.5 px-2 rounded bg-slate-900/50"
                                data-testid={`exercise-row-${exercise.id}`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-500 w-5">{idx + 1}.</span>
                                  <span className="text-slate-300">{exercise.exerciseName || `Exercise ${exercise.exerciseId}`}</span>
                                </div>
                                <div className="text-xs text-slate-400">
                                  {exercise.scheme || "—"}
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">No exercises added</p>
                      )}
                      {block.notes && (
                        <p className="text-xs text-slate-400 mt-2 italic">{block.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          {blocks.length === 0 && (
            <p className="text-xs text-slate-500 italic py-2">No training sessions scheduled</p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
