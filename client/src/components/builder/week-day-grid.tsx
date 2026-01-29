import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, GripVertical, Copy, ChevronLeft, ChevronRight, Edit2, X, RefreshCw, Save, StickyNote } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
  const [editingExercise, setEditingExercise] = useState<string | null>(null);
  const [expandedExercise, setExpandedExercise] = useState<DayExercise | null>(null);
  const [swapExercise, setSwapExercise] = useState<DayExercise | null>(null);
  const [swapSearch, setSwapSearch] = useState("");
  
  const [editSets, setEditSets] = useState(3);
  const [editReps, setEditReps] = useState(10);
  const [editWeight, setEditWeight] = useState("");
  const [editRest, setEditRest] = useState(90);
  const [editNotes, setEditNotes] = useState("");
  
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

  const handleQuickEdit = (id: string, field: keyof ProgramExercise, value: number) => {
    onExerciseUpdate(id, { [field]: value });
    setEditingExercise(null);
  };

  return (
    <div className="flex flex-col h-full" data-testid="week-day-grid">
      <div className="flex items-center justify-between p-3 border-b border-slate-700/50 bg-slate-900/30">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onWeekChange(Math.max(1, weekNumber - 1))}
            disabled={weekNumber <= 1}
            data-testid="prev-week"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-semibold text-slate-200 min-w-[80px] text-center">
            Week {weekNumber}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onWeekChange(Math.min(totalWeeks, weekNumber + 1))}
            disabled={weekNumber >= totalWeeks}
            data-testid="next-week"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-xs text-slate-500">of {totalWeeks}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {onCopyWeek && weekNumber > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopyWeek(weekNumber - 1)}
              data-testid="copy-week"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy from W{weekNumber - 1}
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="grid grid-cols-7 gap-2 p-3 min-h-[400px]">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => {
            const dayExercises = getExercisesForDay(day);
            const isTrainingDay = day <= trainingDays;
            const isDropTarget = dragOverDay === day;
            
            return (
              <div
                key={day}
                className={`
                  flex flex-col rounded-lg border transition-all min-h-[300px]
                  ${isTrainingDay 
                    ? "bg-slate-800/30 border-slate-700/50" 
                    : "bg-slate-900/20 border-slate-800/30"
                  }
                  ${isDropTarget ? "border-brand-400 bg-brand-500/10 ring-1 ring-brand-400" : ""}
                `}
                onDragOver={(e) => handleDragOver(e, day)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, day)}
                data-testid={`day-column-${day}`}
              >
                <div className="p-2 border-b border-slate-700/30 flex items-center justify-between">
                  <span className={`text-xs font-medium ${isTrainingDay ? "text-slate-300" : "text-slate-500"}`}>
                    {DAY_NAMES[day - 1]}
                  </span>
                  <Badge 
                    variant="outline" 
                    className={`text-[9px] ${isTrainingDay ? "border-slate-600" : "border-slate-700 text-slate-600"}`}
                  >
                    {dayExercises.length}
                  </Badge>
                </div>
                
                <div className="flex-1 p-1.5 space-y-1.5 overflow-y-auto">
                  {dayExercises.map((pe) => (
                    <Card
                      key={pe.id}
                      className="p-2 bg-slate-800/50 border-slate-700/50 hover:border-slate-600 transition-all group"
                      data-testid={`exercise-card-${pe.id}`}
                    >
                      <div className="flex items-start gap-1.5">
                        <GripVertical className="h-3 w-3 text-slate-600 mt-0.5 cursor-grab shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-slate-200 truncate leading-tight">
                            {pe.exercise?.name || "Unknown Exercise"}
                          </p>
                          
                          <div className="flex items-center gap-1 mt-1">
                            {editingExercise === pe.id ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  defaultValue={pe.sets}
                                  className="h-5 w-10 text-[10px] p-1 bg-slate-700"
                                  onBlur={(e) => handleQuickEdit(pe.id, "sets", parseInt(e.target.value) || 3)}
                                  onKeyDown={(e) => e.key === "Enter" && handleQuickEdit(pe.id, "sets", parseInt((e.target as HTMLInputElement).value) || 3)}
                                />
                                <span className="text-[10px] text-slate-500">×</span>
                                <Input
                                  type="number"
                                  defaultValue={pe.reps}
                                  className="h-5 w-10 text-[10px] p-1 bg-slate-700"
                                  onBlur={(e) => handleQuickEdit(pe.id, "reps", parseInt(e.target.value) || 10)}
                                  onKeyDown={(e) => e.key === "Enter" && handleQuickEdit(pe.id, "reps", parseInt((e.target as HTMLInputElement).value) || 10)}
                                />
                              </div>
                            ) : (
                              <button
                                onClick={() => setEditingExercise(pe.id)}
                                className="text-[10px] text-slate-400 hover:text-slate-200 bg-slate-700/50 px-1.5 py-0.5 rounded"
                                data-testid={`edit-dosage-${pe.id}`}
                              >
                                {pe.sets}×{pe.reps}
                              </button>
                            )}
                            {pe.notes && (
                              <StickyNote className="h-2.5 w-2.5 text-amber-500" />
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-0.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="px-1"
                            onClick={() => openEditDialog(pe)}
                            data-testid={`edit-exercise-${pe.id}`}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          {onExerciseSwap && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="px-1"
                              onClick={() => setSwapExercise(pe)}
                              data-testid={`swap-exercise-${pe.id}`}
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="px-1"
                            onClick={() => onExerciseDelete(pe.id)}
                            data-testid={`delete-exercise-${pe.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  {dayExercises.length === 0 && isTrainingDay && (
                    <div className="flex items-center justify-center h-20 border border-dashed border-slate-700/50 rounded-md">
                      <p className="text-[10px] text-slate-600 text-center">
                        Drop exercise<br />here
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      
      <Dialog open={!!expandedExercise} onOpenChange={(open) => !open && setExpandedExercise(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">
              Edit: {expandedExercise?.exercise?.name || "Exercise"}
            </DialogTitle>
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
                data-testid="button-save-exercise"
              >
                <Save className="h-4 w-4 mr-1.5" />
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!swapExercise} onOpenChange={(open) => !open && setSwapExercise(null)}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Swap Exercise
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3">
            <div className="p-3 bg-slate-800/50 rounded-lg">
              <p className="text-xs text-slate-400">Current exercise:</p>
              <p className="text-sm font-medium text-slate-200">
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
            
            <div className="max-h-[300px] overflow-y-auto space-y-1">
              {filteredSwapExercises.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">
                  No exercises found. Try a different search term.
                </p>
              ) : (
                filteredSwapExercises.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => handleSwap(ex.id)}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                    data-testid={`swap-option-${ex.id}`}
                  >
                    <p className="text-sm font-medium text-slate-200">{ex.name}</p>
                    <p className="text-xs text-slate-500">{ex.category}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
