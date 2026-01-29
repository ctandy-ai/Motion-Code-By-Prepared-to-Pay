import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Trash2, GripVertical, Copy, ChevronLeft, ChevronRight, Edit2, 
  RefreshCw, Save, StickyNote, Dumbbell, Calendar, ChevronDown, 
  ChevronUp, Target, Clock
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Exercise, ProgramExercise } from "@shared/schema";

interface DayExercise extends ProgramExercise {
  exercise?: Exercise;
}

interface WeekDayGridProps {
  weekNumber: number;
  totalWeeks: number;
  exercises: DayExercise[];
  allExercises?: Exercise[];
  onWeekChange: (week: number) => void;
  onExerciseDrop: (exercise: Exercise, day: number) => void;
  onExerciseUpdate: (id: string, updates: Partial<ProgramExercise>) => void;
  onExerciseDelete: (id: string) => void;
  onExerciseSwap?: (programExerciseId: string, newExerciseId: string) => void;
  onCopyWeek?: (fromWeek: number) => void;
  trainingDays?: number;
}

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function WeekDayGrid({
  weekNumber,
  totalWeeks,
  exercises,
  allExercises = [],
  onWeekChange,
  onExerciseDrop,
  onExerciseUpdate,
  onExerciseDelete,
  onExerciseSwap,
  onCopyWeek,
  trainingDays = 4,
}: WeekDayGridProps) {
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const [expandedDays, setExpandedDays] = useState<number[]>([1, 2, 3, 4]);
  const [expandedExercise, setExpandedExercise] = useState<DayExercise | null>(null);
  const [swapExercise, setSwapExercise] = useState<DayExercise | null>(null);
  const [swapSearch, setSwapSearch] = useState("");
  
  const [editSets, setEditSets] = useState(3);
  const [editReps, setEditReps] = useState(10);
  const [editWeight, setEditWeight] = useState("");
  const [editRest, setEditRest] = useState(90);
  const [editNotes, setEditNotes] = useState("");

  const toggleDay = (day: number) => {
    setExpandedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };
  
  const openEditDialog = (pe: DayExercise) => {
    setExpandedExercise(pe);
    setEditSets(pe.sets || 3);
    setEditReps(pe.reps || 10);
    setEditWeight(pe.targetWeight || "");
    setEditRest(pe.restSeconds || 90);
    setEditNotes(pe.notes || "");
  };
  
  const saveEditDialog = () => {
    if (!expandedExercise) return;
    onExerciseUpdate(expandedExercise.id, {
      sets: editSets,
      reps: editReps,
      targetWeight: editWeight,
      restSeconds: editRest,
      notes: editNotes,
    });
    setExpandedExercise(null);
  };
  
  const filteredSwapExercises = allExercises.filter(e => 
    e.name.toLowerCase().includes(swapSearch.toLowerCase()) ||
    e.category?.toLowerCase().includes(swapSearch.toLowerCase())
  ).slice(0, 20);
  
  const handleSwap = (newExerciseId: string) => {
    if (!swapExercise || !onExerciseSwap) return;
    onExerciseSwap(swapExercise.id, newExerciseId);
    setSwapExercise(null);
    setSwapSearch("");
  };

  const handleDragOver = (e: React.DragEvent, day: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDragOverDay(day);
  };

  const handleDragLeave = () => {
    setDragOverDay(null);
  };

  const handleDrop = (e: React.DragEvent, day: number) => {
    e.preventDefault();
    setDragOverDay(null);
    
    try {
      const data = e.dataTransfer.getData("application/json");
      if (data) {
        const exercise = JSON.parse(data) as Exercise;
        onExerciseDrop(exercise, day);
      }
    } catch (err) {
      console.error("Failed to parse dropped exercise:", err);
    }
  };

  const getExercisesForDay = (day: number) => {
    return exercises
      .filter((e) => e.dayNumber === day)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  };

  const totalExercises = exercises.length;
  const totalSets = exercises.reduce((sum, e) => sum + (e.sets || 0), 0);

  // Calculate phase based on week
  const getPhaseLabel = (week: number) => {
    if (week === 1) return "Foundation";
    if (week === 2) return "Progression";
    if (week === 3) return "Peak";
    if (week === 4) return "Deload";
    return `Week ${week}`;
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900/50 to-slate-950/50" data-testid="week-day-grid">
      {/* Week Navigation Header */}
      <div className="p-4 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onWeekChange(Math.max(1, weekNumber - 1))}
              disabled={weekNumber <= 1}
              className="h-10 w-10"
              data-testid="prev-week"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <div className="text-center">
              <h2 className="text-xl font-bold text-white">Week {weekNumber}</h2>
              <p className="text-sm text-amber-400">{getPhaseLabel(weekNumber)}</p>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => onWeekChange(Math.min(totalWeeks, weekNumber + 1))}
              disabled={weekNumber >= totalWeeks}
              className="h-10 w-10"
              data-testid="next-week"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-slate-400">
              <Dumbbell className="h-4 w-4" />
              <span className="text-sm">{totalExercises} exercises</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Target className="h-4 w-4" />
              <span className="text-sm">{totalSets} total sets</span>
            </div>
            {onCopyWeek && weekNumber > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCopyWeek(weekNumber - 1)}
                data-testid="copy-week"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy from Week {weekNumber - 1}
              </Button>
            )}
          </div>
        </div>

        {/* Week Timeline */}
        <div className="flex gap-1 bg-slate-800/50 p-1 rounded-lg">
          {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(week => (
            <button
              key={week}
              onClick={() => onWeekChange(week)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                week === weekNumber 
                  ? "bg-amber-500 text-slate-900" 
                  : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
              }`}
              data-testid={`week-tab-${week}`}
            >
              W{week}
            </button>
          ))}
        </div>
      </div>

      {/* Day Cards Grid */}
      <ScrollArea className="flex-1 p-4">
        <div className="grid grid-cols-2 gap-4 max-w-6xl mx-auto">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => {
            const dayExercises = getExercisesForDay(day);
            const isTrainingDay = day <= trainingDays;
            const isDropTarget = dragOverDay === day;
            const isExpanded = expandedDays.includes(day);
            const daySets = dayExercises.reduce((sum, e) => sum + (e.sets || 0), 0);
            
            if (!isTrainingDay && dayExercises.length === 0) {
              return null; // Hide non-training days with no exercises
            }
            
            return (
              <Card
                key={day}
                className={`
                  overflow-hidden transition-all duration-200
                  ${isTrainingDay 
                    ? "bg-slate-800/60 border-slate-700/60" 
                    : "bg-slate-900/40 border-slate-800/40"
                  }
                  ${isDropTarget ? "border-amber-400 ring-2 ring-amber-400/30 bg-amber-500/5" : ""}
                `}
                onDragOver={(e) => handleDragOver(e, day)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, day)}
                data-testid={`day-column-${day}`}
              >
                {/* Day Header */}
                <button
                  onClick={() => toggleDay(day)}
                  className="w-full p-4 flex items-center justify-between bg-slate-800/40 hover:bg-slate-700/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                      isTrainingDay ? "bg-amber-500/20 text-amber-400" : "bg-slate-700/50 text-slate-500"
                    }`}>
                      {DAY_SHORT[day - 1]}
                    </div>
                    <div className="text-left">
                      <h3 className={`font-semibold ${isTrainingDay ? "text-white" : "text-slate-500"}`}>
                        {DAY_NAMES[day - 1]}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {dayExercises.length} exercises, {daySets} sets
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isTrainingDay ? "default" : "outline"} className="text-xs">
                      {isTrainingDay ? "Training" : "Rest"}
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Day Content - Exercises */}
                {isExpanded && (
                  <div className="p-4 space-y-3 min-h-[200px]">
                    {dayExercises.length === 0 ? (
                      <div 
                        className={`
                          flex flex-col items-center justify-center h-40 
                          border-2 border-dashed rounded-lg transition-colors
                          ${isDropTarget 
                            ? "border-amber-400 bg-amber-500/10" 
                            : "border-slate-700/50 bg-slate-800/20"
                          }
                        `}
                      >
                        <Dumbbell className={`h-8 w-8 mb-2 ${isDropTarget ? "text-amber-400" : "text-slate-600"}`} />
                        <p className={`text-sm ${isDropTarget ? "text-amber-400" : "text-slate-600"}`}>
                          {isDropTarget ? "Drop to add exercise" : "Drag exercises here"}
                        </p>
                      </div>
                    ) : (
                      dayExercises.map((pe, idx) => (
                        <Card
                          key={pe.id}
                          className="p-3 bg-slate-700/40 border-slate-600/40 hover:border-amber-500/50 hover:bg-slate-700/60 transition-all group"
                          data-testid={`exercise-card-${pe.id}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-500 w-5">{idx + 1}</span>
                              <GripVertical className="h-4 w-4 text-slate-600 cursor-grab" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-white truncate text-sm">
                                {pe.exercise?.name || "Unknown Exercise"}
                              </p>
                              
                              <div className="flex items-center gap-3 mt-2">
                                <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded">
                                  <span className="text-amber-400 font-semibold text-sm">{pe.sets}</span>
                                  <span className="text-slate-500 text-xs">sets</span>
                                </div>
                                <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded">
                                  <span className="text-amber-400 font-semibold text-sm">{pe.reps}</span>
                                  <span className="text-slate-500 text-xs">reps</span>
                                </div>
                                {pe.restSeconds && (
                                  <div className="flex items-center gap-1 text-slate-500 text-xs">
                                    <Clock className="h-3 w-3" />
                                    {pe.restSeconds}s
                                  </div>
                                )}
                                {pe.notes && (
                                  <StickyNote className="h-4 w-4 text-amber-500" />
                                )}
                              </div>
                              
                              {pe.exercise?.category && (
                                <Badge variant="outline" className="mt-2 text-xs">
                                  {pe.exercise.category}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(pe)}
                                data-testid={`edit-exercise-${pe.id}`}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              {onExerciseSwap && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setSwapExercise(pe)}
                                  data-testid={`swap-exercise-${pe.id}`}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onExerciseDelete(pe.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                data-testid={`delete-exercise-${pe.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                    
                    {dayExercises.length > 0 && (
                      <div 
                        className={`
                          flex items-center justify-center h-12 
                          border-2 border-dashed rounded-lg transition-colors mt-3
                          ${isDropTarget 
                            ? "border-amber-400 bg-amber-500/10" 
                            : "border-slate-700/30"
                          }
                        `}
                      >
                        <p className="text-xs text-slate-600">
                          + Add more exercises
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </ScrollArea>
      
      {/* Edit Exercise Dialog */}
      <Dialog open={!!expandedExercise} onOpenChange={(open) => !open && setExpandedExercise(null)}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-lg text-white flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-amber-400" />
              Edit Exercise
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {expandedExercise?.exercise?.name || "Configure exercise parameters"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Sets</label>
                <Input
                  type="number"
                  value={editSets}
                  onChange={(e) => setEditSets(parseInt(e.target.value) || 3)}
                  className="bg-slate-800 border-slate-600"
                  data-testid="input-edit-sets"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Reps</label>
                <Input
                  type="number"
                  value={editReps}
                  onChange={(e) => setEditReps(parseInt(e.target.value) || 10)}
                  className="bg-slate-800 border-slate-600"
                  data-testid="input-edit-reps"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Rest (sec)</label>
                <Input
                  type="number"
                  value={editRest}
                  onChange={(e) => setEditRest(parseInt(e.target.value) || 90)}
                  className="bg-slate-800 border-slate-600"
                  data-testid="input-edit-rest"
                />
              </div>
            </div>
            
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Target Weight / Load</label>
              <Input
                type="text"
                value={editWeight}
                onChange={(e) => setEditWeight(e.target.value)}
                placeholder="e.g., 135 lbs, 80% 1RM, BW"
                className="bg-slate-800 border-slate-600"
                data-testid="input-edit-weight"
              />
            </div>
            
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Notes</label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Coaching cues, tempo, athlete-specific instructions..."
                className="bg-slate-800 border-slate-600 min-h-[80px]"
                data-testid="input-edit-notes"
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setExpandedExercise(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={saveEditDialog}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                data-testid="button-save-exercise"
              >
                <Save className="h-4 w-4 mr-1.5" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Swap Exercise Dialog */}
      <Dialog open={!!swapExercise} onOpenChange={(open) => !open && setSwapExercise(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2 text-white">
              <RefreshCw className="h-4 w-4 text-amber-400" />
              Swap Exercise
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Replace with a different exercise
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <p className="text-xs text-slate-400">Current exercise:</p>
              <p className="text-sm font-medium text-white">
                {swapExercise?.exercise?.name || "Unknown"}
              </p>
            </div>
            
            <Input
              type="text"
              value={swapSearch}
              onChange={(e) => setSwapSearch(e.target.value)}
              placeholder="Search for replacement exercise..."
              className="bg-slate-800 border-slate-600"
              data-testid="input-swap-search"
            />
            
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-1">
                {filteredSwapExercises.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">
                    No exercises found. Try a different search term.
                  </p>
                ) : (
                  filteredSwapExercises.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => handleSwap(ex.id)}
                      className="w-full text-left p-3 rounded-lg hover:bg-slate-700/50 transition-colors border border-transparent hover:border-amber-500/30"
                      data-testid={`swap-option-${ex.id}`}
                    >
                      <p className="font-medium text-white">{ex.name}</p>
                      <p className="text-xs text-slate-500">{ex.category}</p>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
