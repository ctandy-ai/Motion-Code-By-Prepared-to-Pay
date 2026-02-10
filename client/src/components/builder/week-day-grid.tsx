import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Trash2, GripVertical, Copy, ChevronLeft, ChevronRight, Edit2,
  RefreshCw, Save, StickyNote, Dumbbell, Calendar, ChevronDown,
  ChevronUp, Target, Clock, Link, Unlink, ClipboardCopy, ClipboardPaste,
  Check, X, Percent, Gauge, Timer
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
  onReorderExercises?: (updates: Array<{ id: string; orderIndex: number }>) => void;
  onCopyDay?: (fromDay: number, toDay: number) => void;
  onGroupExercises?: (exerciseIds: string[], groupType: string) => void;
  onUngroupExercise?: (exerciseId: string) => void;
  trainingDays?: number;
}

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const GROUP_TYPE_COLORS: Record<string, string> = {
  superset: "border-amber-400",
  circuit: "border-emerald-400",
  "giant-set": "border-purple-400",
};

const GROUP_TYPE_BADGE_CLASSES: Record<string, string> = {
  superset: "bg-amber-500/20 text-amber-300",
  circuit: "bg-emerald-500/20 text-emerald-300",
  "giant-set": "bg-purple-500/20 text-purple-300",
};

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
  onReorderExercises,
  onCopyDay,
  onGroupExercises,
  onUngroupExercise,
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
  const [editIntensity, setEditIntensity] = useState<number | "">("");
  const [editTempo, setEditTempo] = useState("");
  const [editRpe, setEditRpe] = useState<number | "">("");

  const [copiedDay, setCopiedDay] = useState<number | null>(null);

  const [groupingDay, setGroupingDay] = useState<number | null>(null);
  const [selectedForGroup, setSelectedForGroup] = useState<Set<string>>(new Set());
  const [groupTypeSelection, setGroupTypeSelection] = useState("superset");

  const [reorderDragId, setReorderDragId] = useState<string | null>(null);
  const [reorderDropIndex, setReorderDropIndex] = useState<number | null>(null);
  const [reorderDay, setReorderDay] = useState<number | null>(null);

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
    setEditIntensity(pe.intensityPercent ?? "");
    setEditTempo(pe.tempo || "");
    setEditRpe(pe.rpeTarget ?? "");
  };

  const saveEditDialog = () => {
    if (!expandedExercise) return;
    onExerciseUpdate(expandedExercise.id, {
      sets: editSets,
      reps: editReps,
      targetWeight: editWeight,
      restSeconds: editRest,
      notes: editNotes,
      intensityPercent: editIntensity === "" ? null : Number(editIntensity),
      tempo: editTempo || null,
      rpeTarget: editRpe === "" ? null : Number(editRpe),
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
    const types = e.dataTransfer.types;
    if (types.includes("application/reorder")) {
      e.dataTransfer.dropEffect = "move";
    } else {
      e.dataTransfer.dropEffect = "copy";
      setDragOverDay(day);
    }
  };

  const handleDragLeave = () => {
    setDragOverDay(null);
  };

  const handleDrop = (e: React.DragEvent, day: number) => {
    e.preventDefault();
    setDragOverDay(null);

    if (e.dataTransfer.types.includes("application/reorder")) {
      return;
    }

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

  const handleReorderDragStart = (e: React.DragEvent, pe: DayExercise) => {
    e.dataTransfer.setData("application/reorder", pe.id);
    e.dataTransfer.effectAllowed = "move";
    setReorderDragId(pe.id);
    setReorderDay(pe.dayNumber);
  };

  const handleReorderDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setReorderDropIndex(index);
  }, []);

  const handleReorderDrop = (e: React.DragEvent, day: number, dayExercises: DayExercise[]) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedId = e.dataTransfer.getData("application/reorder");
    if (!draggedId || !onReorderExercises || reorderDropIndex === null) {
      setReorderDragId(null);
      setReorderDropIndex(null);
      setReorderDay(null);
      return;
    }

    const ordered = [...dayExercises];
    const fromIdx = ordered.findIndex(ex => ex.id === draggedId);
    if (fromIdx === -1) return;

    const [moved] = ordered.splice(fromIdx, 1);
    const toIdx = reorderDropIndex > fromIdx ? reorderDropIndex - 1 : reorderDropIndex;
    ordered.splice(toIdx, 0, moved);

    const updates = ordered.map((ex, i) => ({ id: ex.id, orderIndex: i }));
    onReorderExercises(updates);

    setReorderDragId(null);
    setReorderDropIndex(null);
    setReorderDay(null);
  };

  const handleReorderDragEnd = () => {
    setReorderDragId(null);
    setReorderDropIndex(null);
    setReorderDay(null);
  };

  const getExercisesForDay = (day: number) => {
    return exercises
      .filter((e) => e.dayNumber === day)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  };

  const startGrouping = (day: number) => {
    setGroupingDay(day);
    setSelectedForGroup(new Set());
    setGroupTypeSelection("superset");
  };

  const cancelGrouping = () => {
    setGroupingDay(null);
    setSelectedForGroup(new Set());
  };

  const confirmGrouping = () => {
    if (selectedForGroup.size < 2 || !onGroupExercises) return;
    onGroupExercises(Array.from(selectedForGroup), groupTypeSelection);
    setGroupingDay(null);
    setSelectedForGroup(new Set());
  };

  const toggleGroupSelection = (id: string) => {
    setSelectedForGroup(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopyDay = (day: number) => {
    setCopiedDay(day);
  };

  const handlePasteDay = (targetDay: number) => {
    if (copiedDay === null || !onCopyDay) return;
    onCopyDay(copiedDay, targetDay);
    setCopiedDay(null);
  };

  const totalExercises = exercises.length;
  const totalSets = exercises.reduce((sum, e) => sum + (e.sets || 0), 0);

  const getPhaseLabel = (week: number) => {
    if (week === 1) return "Foundation";
    if (week === 2) return "Progression";
    if (week === 3) return "Peak";
    if (week === 4) return "Deload";
    return `Week ${week}`;
  };

  const groupExercises = (dayExercises: DayExercise[]) => {
    const groups: Array<{ groupId: string | null; groupType: string | null; items: DayExercise[] }> = [];
    const visited = new Set<string>();

    for (const pe of dayExercises) {
      if (visited.has(pe.id)) continue;
      if (pe.groupId) {
        const groupItems = dayExercises.filter(e => e.groupId === pe.groupId);
        groupItems.forEach(e => visited.add(e.id));
        const existing = groups.find(g => g.groupId === pe.groupId);
        if (!existing) {
          groups.push({ groupId: pe.groupId, groupType: pe.groupType, items: groupItems });
        }
      } else {
        visited.add(pe.id);
        groups.push({ groupId: null, groupType: null, items: [pe] });
      }
    }
    return groups;
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900/50 to-slate-950/50" data-testid="week-day-grid">
      {/* Week Navigation Header */}
      <div className="p-4 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onWeekChange(Math.max(1, weekNumber - 1))}
              disabled={weekNumber <= 1}
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
              data-testid="next-week"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-6 flex-wrap">
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
            const isGroupingThisDay = groupingDay === day;
            const isCopiedDay = copiedDay === day;

            if (!isTrainingDay && dayExercises.length === 0) {
              return null;
            }

            const grouped = groupExercises(dayExercises);

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
                  ${isCopiedDay ? "ring-2 ring-sky-400/40" : ""}
                `}
                onDragOver={(e) => handleDragOver(e, day)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, day)}
                data-testid={`day-column-${day}`}
              >
                {/* Day Header */}
                <div className="w-full p-4 flex items-center justify-between gap-2 bg-slate-800/40">
                  <button
                    onClick={() => toggleDay(day)}
                    className="flex items-center gap-3 flex-1"
                  >
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
                  </button>
                  <div className="flex items-center gap-1">
                    {isCopiedDay && (
                      <Badge className="bg-sky-500/20 text-sky-300 text-[10px]">Copied</Badge>
                    )}
                    {onCopyDay && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); handleCopyDay(day); }}
                        data-testid={`copy-day-${day}`}
                      >
                        <ClipboardCopy className="h-4 w-4" />
                      </Button>
                    )}
                    {copiedDay !== null && copiedDay !== day && onCopyDay && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); handlePasteDay(day); }}
                        data-testid={`paste-day-${day}`}
                      >
                        <ClipboardPaste className="h-4 w-4 text-sky-400" />
                      </Button>
                    )}
                    <Badge variant={isTrainingDay ? "default" : "outline"} className="text-xs">
                      {isTrainingDay ? "Training" : "Rest"}
                    </Badge>
                    <button onClick={() => toggleDay(day)}>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Day Content - Exercises */}
                {isExpanded && (
                  <div className="p-4 space-y-3 min-h-[200px]">
                    {/* Grouping toolbar */}
                    {isGroupingThisDay && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-700/50 border border-slate-600/50">
                        <span className="text-xs text-slate-300 mr-1">Group type:</span>
                        <Select value={groupTypeSelection} onValueChange={setGroupTypeSelection}>
                          <SelectTrigger className="w-[120px] bg-slate-800 border-slate-600 text-xs" data-testid="select-group-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="superset">Superset</SelectItem>
                            <SelectItem value="circuit">Circuit</SelectItem>
                            <SelectItem value="giant-set">Giant Set</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={confirmGrouping}
                          disabled={selectedForGroup.size < 2}
                          className="bg-amber-500 text-slate-900 ml-auto"
                          data-testid="confirm-group"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Confirm ({selectedForGroup.size})
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelGrouping}
                          data-testid="cancel-group"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}

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
                      <>
                        {grouped.map((group) => {
                          const isGrouped = !!group.groupId;
                          const borderColor = isGrouped
                            ? GROUP_TYPE_COLORS[group.groupType || "superset"] || "border-amber-400"
                            : "";

                          return (
                            <div key={group.groupId || group.items[0].id}>
                              {isGrouped && (
                                <div className="flex items-center gap-2 mb-1 ml-3">
                                  <Link className="h-3 w-3 text-slate-400" />
                                  <Badge className={`text-[10px] ${GROUP_TYPE_BADGE_CLASSES[group.groupType || "superset"] || "bg-amber-500/20 text-amber-300"}`}>
                                    {group.groupType || "superset"}
                                  </Badge>
                                </div>
                              )}
                              <div className={isGrouped ? `border-l-2 ${borderColor} pl-3 space-y-2 mb-2` : "space-y-2"}>
                                {group.items.map((pe, idx) => {
                                  const globalIdx = dayExercises.indexOf(pe);
                                  const isBeingDragged = reorderDragId === pe.id;
                                  const showDropBefore = reorderDay === day && reorderDropIndex === globalIdx && reorderDragId !== null && reorderDragId !== pe.id;

                                  return (
                                    <div key={pe.id}>
                                      {showDropBefore && (
                                        <div className="h-1 bg-amber-400 rounded-full mx-2 my-1" data-testid={`drop-indicator-${globalIdx}`} />
                                      )}
                                      <Card
                                        draggable={!isGroupingThisDay}
                                        onDragStart={(e) => handleReorderDragStart(e, pe)}
                                        onDragOver={(e) => handleReorderDragOver(e, globalIdx)}
                                        onDrop={(e) => handleReorderDrop(e, day, dayExercises)}
                                        onDragEnd={handleReorderDragEnd}
                                        className={`p-3 bg-slate-700/40 border-slate-600/40 transition-all group ${
                                          isBeingDragged ? "opacity-40" : ""
                                        }`}
                                        data-testid={`exercise-card-${pe.id}`}
                                      >
                                        <div className="flex items-start gap-3">
                                          {isGroupingThisDay ? (
                                            <Checkbox
                                              checked={selectedForGroup.has(pe.id)}
                                              onCheckedChange={() => toggleGroupSelection(pe.id)}
                                              className="mt-1"
                                              data-testid={`group-checkbox-${pe.id}`}
                                            />
                                          ) : (
                                            <div className="flex items-center gap-2">
                                              <span className="text-xs font-bold text-slate-500 w-5">{globalIdx + 1}</span>
                                              <GripVertical className="h-4 w-4 text-slate-600 cursor-grab" />
                                            </div>
                                          )}

                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <p className="font-medium text-white truncate text-sm">
                                                {pe.exercise?.name || "Unknown Exercise"}
                                              </p>
                                              {isGrouped && (
                                                <Badge className={`text-[10px] ${GROUP_TYPE_BADGE_CLASSES[pe.groupType || "superset"] || "bg-amber-500/20 text-amber-300"}`}>
                                                  {pe.groupType || "superset"}
                                                </Badge>
                                              )}
                                            </div>

                                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                              <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded">
                                                <span className="text-amber-400 font-semibold text-sm">{pe.sets}</span>
                                                <span className="text-slate-500 text-xs">sets</span>
                                              </div>
                                              <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded">
                                                <span className="text-amber-400 font-semibold text-sm">{pe.reps}</span>
                                                <span className="text-slate-500 text-xs">reps</span>
                                              </div>
                                              {pe.intensityPercent != null && (
                                                <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded">
                                                  <Percent className="h-3 w-3 text-slate-400" />
                                                  <span className="text-amber-400 font-semibold text-sm">{pe.intensityPercent}</span>
                                                  <span className="text-slate-500 text-xs">1RM</span>
                                                </div>
                                              )}
                                              {pe.rpeTarget != null && (
                                                <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded">
                                                  <Gauge className="h-3 w-3 text-slate-400" />
                                                  <span className="text-amber-400 font-semibold text-sm">{pe.rpeTarget}</span>
                                                  <span className="text-slate-500 text-xs">RPE</span>
                                                </div>
                                              )}
                                              {pe.restSeconds && (
                                                <div className="flex items-center gap-1 text-slate-500 text-xs">
                                                  <Clock className="h-3 w-3" />
                                                  {pe.restSeconds}s
                                                </div>
                                              )}
                                              {pe.tempo && (
                                                <div className="flex items-center gap-1 text-slate-500 text-xs">
                                                  <Timer className="h-3 w-3" />
                                                  {pe.tempo}
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

                                          <div className="flex items-center gap-1" style={{ visibility: isGroupingThisDay ? 'hidden' : 'visible' }}>
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
                                            {isGrouped && onUngroupExercise && (
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onUngroupExercise(pe.id)}
                                                data-testid={`ungroup-exercise-${pe.id}`}
                                              >
                                                <Unlink className="h-4 w-4" />
                                              </Button>
                                            )}
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => onExerciseDelete(pe.id)}
                                              className="text-red-400"
                                              data-testid={`delete-exercise-${pe.id}`}
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      </Card>
                                    </div>
                                  );
                                })}
                              </div>
                              {/* Drop indicator after last item in group */}
                              {isGrouped && reorderDay === day && reorderDropIndex === (dayExercises.indexOf(group.items[group.items.length - 1]) + 1) && reorderDragId !== null && (
                                <div className="h-1 bg-amber-400 rounded-full mx-2 my-1" />
                              )}
                            </div>
                          );
                        })}

                        {/* Final drop zone for reorder */}
                        {reorderDragId && reorderDay === day && (
                          <div
                            className="h-8"
                            onDragOver={(e) => handleReorderDragOver(e, dayExercises.length)}
                            onDrop={(e) => handleReorderDrop(e, day, dayExercises)}
                          >
                            {reorderDropIndex === dayExercises.length && (
                              <div className="h-1 bg-amber-400 rounded-full mx-2 my-1" />
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {dayExercises.length > 0 && (
                      <div className="flex items-center gap-2 mt-3">
                        <div
                          className={`
                            flex-1 flex items-center justify-center h-12
                            border-2 border-dashed rounded-lg transition-colors
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
                        {dayExercises.length >= 2 && onGroupExercises && !isGroupingThisDay && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startGrouping(day)}
                            data-testid={`create-superset-${day}`}
                          >
                            <Link className="h-3.5 w-3.5 mr-1.5" />
                            Create Superset
                          </Button>
                        )}
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
            {/* Sets & Reps row */}
            <div className="grid grid-cols-2 gap-3">
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
            </div>

            {/* Intensity / RPE row */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">%1RM</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={editIntensity}
                  onChange={(e) => {
                    const v = e.target.value;
                    setEditIntensity(v === "" ? "" : Math.min(100, Math.max(0, parseInt(v) || 0)));
                  }}
                  placeholder="0-100"
                  className="bg-slate-800 border-slate-600"
                  data-testid="input-edit-intensity"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">RPE Target</label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  step={0.5}
                  value={editRpe}
                  onChange={(e) => {
                    const v = e.target.value;
                    setEditRpe(v === "" ? "" : Math.min(10, Math.max(1, parseFloat(v) || 1)));
                  }}
                  placeholder="1-10"
                  className="bg-slate-800 border-slate-600"
                  data-testid="input-edit-rpe"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Target Weight</label>
                <Input
                  type="text"
                  value={editWeight}
                  onChange={(e) => setEditWeight(e.target.value)}
                  placeholder="e.g. 135 lbs"
                  className="bg-slate-800 border-slate-600"
                  data-testid="input-edit-weight"
                />
              </div>
            </div>

            {/* Tempo / Rest row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Tempo</label>
                <Input
                  type="text"
                  value={editTempo}
                  onChange={(e) => setEditTempo(e.target.value)}
                  placeholder="e.g. 3-1-2-0"
                  className="bg-slate-800 border-slate-600"
                  data-testid="input-edit-tempo"
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
              <label className="text-xs text-slate-400 mb-1 block">Notes</label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Coaching cues, athlete-specific instructions..."
                className="bg-slate-800 border-slate-600 min-h-[80px]"
                data-testid="input-edit-notes"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setExpandedExercise(null)}
                data-testid="cancel-edit"
              >
                Cancel
              </Button>
              <Button
                onClick={saveEditDialog}
                className="bg-amber-500 text-slate-900"
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
