import { useState, useCallback, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Trash2, GripVertical, Copy, ChevronLeft, ChevronRight, Edit2,
  RefreshCw, Save, StickyNote, Dumbbell,
  Link, Unlink, ClipboardCopy, ClipboardPaste,
  Check, X, Plus
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

const GROUP_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  superset: { border: "border-amber-400/60", bg: "bg-amber-500/10", text: "text-amber-400" },
  circuit: { border: "border-emerald-400/60", bg: "bg-emerald-500/10", text: "text-emerald-400" },
  "giant-set": { border: "border-purple-400/60", bg: "bg-purple-500/10", text: "text-purple-400" },
};

function InlineEdit({ value, onSave, type = "number", width = "w-12", placeholder, min, max, step }: {
  value: string | number;
  onSave: (val: string) => void;
  type?: string;
  width?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== String(value)) {
      onSave(draft);
    }
  };

  if (!editing) {
    return (
      <button
        onClick={() => { setDraft(String(value)); setEditing(true); }}
        className={`${width} text-center tabular-nums font-semibold text-sm text-amber-400 rounded px-1.5 py-0.5 hover-elevate cursor-text`}
        data-testid="inline-edit-trigger"
      >
        {value || placeholder || "-"}
      </button>
    );
  }

  return (
    <Input
      ref={inputRef}
      type={type}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
      className={`${width} text-center text-sm bg-slate-800 border-amber-400/50 tabular-nums`}
      min={min}
      max={max}
      step={step}
      data-testid="inline-edit-input"
    />
  );
}

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
  const [swapExercise, setSwapExercise] = useState<DayExercise | null>(null);
  const [swapSearch, setSwapSearch] = useState("");
  const [notesExercise, setNotesExercise] = useState<DayExercise | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

  const [copiedDay, setCopiedDay] = useState<number | null>(null);

  const [groupingDay, setGroupingDay] = useState<number | null>(null);
  const [selectedForGroup, setSelectedForGroup] = useState<Set<string>>(new Set());
  const [groupTypeSelection, setGroupTypeSelection] = useState("superset");

  const [reorderDragId, setReorderDragId] = useState<string | null>(null);
  const [reorderDropIndex, setReorderDropIndex] = useState<number | null>(null);
  const [reorderDay, setReorderDay] = useState<number | null>(null);

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
    if (!e.dataTransfer.types.includes("application/reorder")) {
      e.dataTransfer.dropEffect = "copy";
      setDragOverDay(day);
    }
  };

  const handleDrop = (e: React.DragEvent, day: number) => {
    e.preventDefault();
    setDragOverDay(null);
    if (e.dataTransfer.types.includes("application/reorder")) return;
    try {
      const data = e.dataTransfer.getData("application/json");
      if (data) onExerciseDrop(JSON.parse(data) as Exercise, day);
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
    onReorderExercises(ordered.map((ex, i) => ({ id: ex.id, orderIndex: i })));
    setReorderDragId(null);
    setReorderDropIndex(null);
    setReorderDay(null);
  };

  const handleReorderDragEnd = () => {
    setReorderDragId(null);
    setReorderDropIndex(null);
    setReorderDay(null);
  };

  const getExercisesForDay = (day: number) =>
    exercises.filter((e) => e.dayNumber === day).sort((a, b) => a.orderIndex - b.orderIndex);

  const groupExercisesIntoBlocks = (dayExercises: DayExercise[]) => {
    const groups: Array<{ groupId: string | null; groupType: string | null; items: DayExercise[] }> = [];
    const visited = new Set<string>();
    for (const pe of dayExercises) {
      if (visited.has(pe.id)) continue;
      if (pe.groupId) {
        const groupItems = dayExercises.filter(e => e.groupId === pe.groupId);
        groupItems.forEach(e => visited.add(e.id));
        if (!groups.find(g => g.groupId === pe.groupId)) {
          groups.push({ groupId: pe.groupId, groupType: pe.groupType, items: groupItems });
        }
      } else {
        visited.add(pe.id);
        groups.push({ groupId: null, groupType: null, items: [pe] });
      }
    }
    return groups;
  };

  const openNotes = (pe: DayExercise) => {
    setNotesExercise(pe);
    setNotesDraft(pe.notes || "");
  };

  const saveNotes = () => {
    if (!notesExercise) return;
    onExerciseUpdate(notesExercise.id, { notes: notesDraft });
    setNotesExercise(null);
  };

  const totalExercises = exercises.length;
  const totalSets = exercises.reduce((sum, e) => sum + (e.sets || 0), 0);

  const visibleDays = [1, 2, 3, 4, 5, 6, 7].filter(day => {
    return day <= trainingDays || getExercisesForDay(day).length > 0;
  });

  return (
    <div className="flex flex-col h-full" data-testid="week-day-grid">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-700/50 bg-slate-900/60">
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
          <span className="text-sm font-semibold text-white min-w-[70px] text-center">Week {weekNumber}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onWeekChange(Math.min(totalWeeks, weekNumber + 1))}
            disabled={weekNumber >= totalWeeks}
            data-testid="next-week"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span>{totalExercises} exercises</span>
          <span>{totalSets} sets</span>
          {onCopyWeek && weekNumber > 1 && (
            <Button variant="ghost" size="sm" onClick={() => onCopyWeek(weekNumber - 1)} data-testid="copy-week" className="text-xs gap-1">
              <Copy className="h-3 w-3" /> Copy W{weekNumber - 1}
            </Button>
          )}
        </div>

        <div className="flex gap-0.5 bg-slate-800/60 p-0.5 rounded-md">
          {Array.from({ length: Math.min(totalWeeks, 12) }, (_, i) => i + 1).map(week => (
            <button
              key={week}
              onClick={() => onWeekChange(week)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                week === weekNumber
                  ? "bg-amber-500 text-slate-900"
                  : "text-slate-500 hover-elevate"
              }`}
              data-testid={`week-tab-${week}`}
            >
              {week}
            </button>
          ))}
          {totalWeeks > 12 && (
            <Select value={String(weekNumber)} onValueChange={(v) => onWeekChange(parseInt(v))}>
              <SelectTrigger className="h-6 w-16 text-xs bg-transparent border-0 px-1" data-testid="week-select-more">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(w => (
                  <SelectItem key={w} value={String(w)}>Week {w}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1">
          {visibleDays.map((day) => {
            const dayExercises = getExercisesForDay(day);
            const isTrainingDay = day <= trainingDays;
            const isDropTarget = dragOverDay === day;
            const daySets = dayExercises.reduce((sum, e) => sum + (e.sets || 0), 0);
            const isGroupingThisDay = groupingDay === day;
            const grouped = groupExercisesIntoBlocks(dayExercises);

            return (
              <div
                key={day}
                className={`rounded-md transition-all ${
                  isDropTarget ? "ring-1 ring-amber-400/50 bg-amber-500/5" : ""
                }`}
                onDragOver={(e) => handleDragOver(e, day)}
                onDragLeave={() => setDragOverDay(null)}
                onDrop={(e) => handleDrop(e, day)}
                data-testid={`day-column-${day}`}
              >
                <div className="flex items-center gap-2 px-3 py-1.5">
                  <span className={`text-xs font-bold uppercase tracking-wider ${isTrainingDay ? "text-amber-400" : "text-slate-600"}`}>
                    {DAY_SHORT[day - 1]}
                  </span>
                  <span className="text-[11px] text-slate-500">{dayExercises.length} ex / {daySets} sets</span>
                  <div className="flex-1" />

                  {copiedDay !== null && copiedDay !== day && onCopyDay && (
                    <Button variant="ghost" size="sm" onClick={() => { onCopyDay(copiedDay, day); setCopiedDay(null); }} data-testid={`paste-day-${day}`} className="text-xs h-6 gap-1 text-sky-400">
                      <ClipboardPaste className="h-3 w-3" /> Paste
                    </Button>
                  )}
                  {copiedDay === day && <Badge className="bg-sky-500/20 text-sky-300 text-[10px]">Copied</Badge>}

                  {onCopyDay && (
                    <Button variant="ghost" size="icon" onClick={() => setCopiedDay(day)} data-testid={`copy-day-${day}`}>
                      <ClipboardCopy className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {dayExercises.length >= 2 && onGroupExercises && !isGroupingThisDay && (
                    <Button variant="ghost" size="icon" onClick={() => { setGroupingDay(day); setSelectedForGroup(new Set()); setGroupTypeSelection("superset"); }} data-testid={`create-superset-${day}`}>
                      <Link className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>

                {isGroupingThisDay && (
                  <div className="flex items-center gap-2 px-3 py-1.5 mx-3 mb-1 rounded-md bg-slate-800/60 border border-slate-700/50">
                    <span className="text-[11px] text-slate-400">Select exercises to group:</span>
                    <Select value={groupTypeSelection} onValueChange={setGroupTypeSelection}>
                      <SelectTrigger className="w-24 h-6 text-[11px] bg-slate-800 border-slate-600" data-testid="select-group-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="superset">Superset</SelectItem>
                        <SelectItem value="circuit">Circuit</SelectItem>
                        <SelectItem value="giant-set">Giant Set</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={() => { if (selectedForGroup.size >= 2 && onGroupExercises) { onGroupExercises(Array.from(selectedForGroup), groupTypeSelection); } setGroupingDay(null); setSelectedForGroup(new Set()); }} disabled={selectedForGroup.size < 2} className="text-xs bg-amber-500 text-slate-900" data-testid="confirm-group">
                      <Check className="h-3 w-3 mr-1" /> Group ({selectedForGroup.size})
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setGroupingDay(null); setSelectedForGroup(new Set()); }} className="text-xs" data-testid="cancel-group">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                <div className="px-1 pb-2">
                  {dayExercises.length === 0 ? (
                    <div className={`flex items-center justify-center h-14 mx-2 border border-dashed rounded-md text-xs transition-colors ${
                      isDropTarget ? "border-amber-400/50 text-amber-400" : "border-slate-700/40 text-slate-600"
                    }`}>
                      <Dumbbell className="h-3.5 w-3.5 mr-1.5" />
                      {isDropTarget ? "Drop here" : "Drag exercises here"}
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {grouped.map((group) => {
                        const isGrouped = !!group.groupId;
                        const colors = GROUP_COLORS[group.groupType || "superset"] || GROUP_COLORS.superset;

                        return (
                          <div key={group.groupId || group.items[0].id} className={isGrouped ? `ml-2 border-l-2 ${colors.border} mb-1` : ""}>
                            {isGrouped && (
                              <div className="flex items-center gap-1.5 pl-2 py-0.5">
                                <Link className={`h-2.5 w-2.5 ${colors.text}`} />
                                <span className={`text-[10px] uppercase font-semibold tracking-wider ${colors.text}`}>
                                  {group.groupType}
                                </span>
                              </div>
                            )}
                            {group.items.map((pe) => {
                              const globalIdx = dayExercises.indexOf(pe);
                              const isBeingDragged = reorderDragId === pe.id;
                              const showDropBefore = reorderDay === day && reorderDropIndex === globalIdx && reorderDragId !== null && reorderDragId !== pe.id;

                              return (
                                <div key={pe.id}>
                                  {showDropBefore && <div className="h-0.5 bg-amber-400 rounded-full mx-3 my-0.5" />}
                                  <div
                                    draggable={!isGroupingThisDay}
                                    onDragStart={(e) => handleReorderDragStart(e, pe)}
                                    onDragOver={(e) => handleReorderDragOver(e, globalIdx)}
                                    onDrop={(e) => handleReorderDrop(e, day, dayExercises)}
                                    onDragEnd={handleReorderDragEnd}
                                    className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-all ${
                                      isBeingDragged ? "opacity-30" : "hover-elevate"
                                    }`}
                                    data-testid={`exercise-card-${pe.id}`}
                                  >
                                    {isGroupingThisDay ? (
                                      <Checkbox
                                        checked={selectedForGroup.has(pe.id)}
                                        onCheckedChange={() => {
                                          const next = new Set(selectedForGroup);
                                          if (next.has(pe.id)) next.delete(pe.id); else next.add(pe.id);
                                          setSelectedForGroup(next);
                                        }}
                                        className="shrink-0"
                                        data-testid={`group-checkbox-${pe.id}`}
                                      />
                                    ) : (
                                      <GripVertical className="h-3.5 w-3.5 text-slate-700 cursor-grab shrink-0" />
                                    )}

                                    <span className="text-xs text-slate-500 w-4 text-right shrink-0 tabular-nums">{globalIdx + 1}</span>

                                    <span className="flex-1 text-sm text-slate-200 truncate min-w-0" data-testid={`exercise-name-${pe.id}`}>
                                      {pe.exercise?.name || "Unknown"}
                                    </span>

                                    <div className="flex items-center gap-0.5 shrink-0">
                                      <InlineEdit
                                        value={pe.sets || 3}
                                        onSave={(v) => onExerciseUpdate(pe.id, { sets: parseInt(v) || 3 })}
                                        width="w-8"
                                      />
                                      <span className="text-slate-600 text-xs">x</span>
                                      <InlineEdit
                                        value={pe.reps || 10}
                                        onSave={(v) => onExerciseUpdate(pe.id, { reps: parseInt(v) || 10 })}
                                        width="w-8"
                                      />
                                    </div>

                                    {pe.intensityPercent != null && (
                                      <span className="text-xs text-slate-400 tabular-nums shrink-0">
                                        @{pe.intensityPercent}%
                                      </span>
                                    )}
                                    {pe.rpeTarget != null && (
                                      <span className="text-xs text-slate-400 tabular-nums shrink-0">
                                        RPE {pe.rpeTarget}
                                      </span>
                                    )}
                                    {pe.tempo && (
                                      <span className="text-[11px] text-slate-500 font-mono shrink-0">{pe.tempo}</span>
                                    )}
                                    {pe.notes && (
                                      <StickyNote className="h-3 w-3 text-amber-500/60 shrink-0" />
                                    )}

                                    <div className="flex items-center shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                                      <Button variant="ghost" size="icon" onClick={() => openNotes(pe)} data-testid={`edit-exercise-${pe.id}`}>
                                        <Edit2 className="h-3.5 w-3.5" />
                                      </Button>
                                      {onExerciseSwap && (
                                        <Button variant="ghost" size="icon" onClick={() => setSwapExercise(pe)} data-testid={`swap-exercise-${pe.id}`}>
                                          <RefreshCw className="h-3.5 w-3.5" />
                                        </Button>
                                      )}
                                      {isGrouped && onUngroupExercise && (
                                        <Button variant="ghost" size="icon" onClick={() => onUngroupExercise(pe.id)} data-testid={`ungroup-exercise-${pe.id}`}>
                                          <Unlink className="h-3.5 w-3.5" />
                                        </Button>
                                      )}
                                      <Button variant="ghost" size="icon" className="text-red-400" onClick={() => onExerciseDelete(pe.id)} data-testid={`delete-exercise-${pe.id}`}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}

                      {reorderDragId && reorderDay === day && (
                        <div
                          className="h-6"
                          onDragOver={(e) => handleReorderDragOver(e, dayExercises.length)}
                          onDrop={(e) => handleReorderDrop(e, day, dayExercises)}
                        >
                          {reorderDropIndex === dayExercises.length && (
                            <div className="h-0.5 bg-amber-400 rounded-full mx-3" />
                          )}
                        </div>
                      )}

                      <div className={`flex items-center justify-center h-8 mx-2 border border-dashed rounded-md text-[11px] transition-colors ${
                        isDropTarget ? "border-amber-400/40 text-amber-400" : "border-slate-800/40 text-slate-700"
                      }`}>
                        <Plus className="h-3 w-3 mr-1" /> Add
                      </div>
                    </div>
                  )}
                </div>

                {day < visibleDays[visibleDays.length - 1] && (
                  <div className="border-b border-slate-800/40 mx-3" />
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <Dialog open={!!notesExercise} onOpenChange={(open) => !open && setNotesExercise(null)}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-base text-white flex items-center gap-2">
              <Edit2 className="h-4 w-4 text-amber-400" />
              {notesExercise?.exercise?.name || "Edit Exercise"}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Advanced parameters and coaching notes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] text-slate-500 mb-0.5 block">%1RM</label>
                <Input
                  type="number" min={0} max={100}
                  value={notesExercise?.intensityPercent ?? ""}
                  onChange={(e) => {
                    if (!notesExercise) return;
                    const v = e.target.value;
                    onExerciseUpdate(notesExercise.id, { intensityPercent: v === "" ? null : Math.min(100, Math.max(0, parseInt(v) || 0)) });
                  }}
                  placeholder="0-100"
                  className="bg-slate-800 border-slate-600 h-8 text-sm"
                  data-testid="input-edit-intensity"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 mb-0.5 block">RPE</label>
                <Input
                  type="number" min={1} max={10} step={0.5}
                  value={notesExercise?.rpeTarget ?? ""}
                  onChange={(e) => {
                    if (!notesExercise) return;
                    const v = e.target.value;
                    onExerciseUpdate(notesExercise.id, { rpeTarget: v === "" ? null : Math.min(10, Math.max(1, parseFloat(v) || 1)) });
                  }}
                  placeholder="1-10"
                  className="bg-slate-800 border-slate-600 h-8 text-sm"
                  data-testid="input-edit-rpe"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 mb-0.5 block">Rest (s)</label>
                <Input
                  type="number"
                  value={notesExercise?.restSeconds || 90}
                  onChange={(e) => {
                    if (!notesExercise) return;
                    onExerciseUpdate(notesExercise.id, { restSeconds: parseInt(e.target.value) || 90 });
                  }}
                  className="bg-slate-800 border-slate-600 h-8 text-sm"
                  data-testid="input-edit-rest"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-500 mb-0.5 block">Tempo</label>
                <Input
                  type="text"
                  value={notesExercise?.tempo || ""}
                  onChange={(e) => {
                    if (!notesExercise) return;
                    onExerciseUpdate(notesExercise.id, { tempo: e.target.value || null });
                  }}
                  placeholder="e.g. 3-1-2-0"
                  className="bg-slate-800 border-slate-600 h-8 text-sm"
                  data-testid="input-edit-tempo"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-500 mb-0.5 block">Target Weight</label>
                <Input
                  type="text"
                  value={notesExercise?.targetWeight || ""}
                  onChange={(e) => {
                    if (!notesExercise) return;
                    onExerciseUpdate(notesExercise.id, { targetWeight: e.target.value });
                  }}
                  placeholder="e.g. 135 lbs"
                  className="bg-slate-800 border-slate-600 h-8 text-sm"
                  data-testid="input-edit-weight"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-500 mb-0.5 block">Coaching Notes</label>
              <Textarea
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Cues, athlete-specific instructions..."
                className="bg-slate-800 border-slate-600 min-h-[60px] text-sm"
                data-testid="input-edit-notes"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setNotesExercise(null)} data-testid="cancel-edit">
                Close
              </Button>
              <Button size="sm" onClick={saveNotes} className="bg-amber-500 text-slate-900" data-testid="button-save-exercise">
                <Save className="h-3.5 w-3.5 mr-1" /> Save Notes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!swapExercise} onOpenChange={(open) => !open && setSwapExercise(null)}>
        <DialogContent className="max-w-lg max-h-[70vh] bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2 text-white">
              <RefreshCw className="h-4 w-4 text-amber-400" />
              Swap Exercise
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Replacing: {swapExercise?.exercise?.name}
            </DialogDescription>
          </DialogHeader>

          <Input
            type="text"
            value={swapSearch}
            onChange={(e) => setSwapSearch(e.target.value)}
            placeholder="Search exercises..."
            className="bg-slate-800 border-slate-600 h-8 text-sm"
            data-testid="input-swap-search"
          />

          <ScrollArea className="max-h-[250px]">
            <div className="space-y-0.5">
              {filteredSwapExercises.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No exercises found</p>
              ) : (
                filteredSwapExercises.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => handleSwap(ex.id)}
                    className="w-full text-left px-3 py-2 rounded-md hover-elevate transition-colors"
                    data-testid={`swap-option-${ex.id}`}
                  >
                    <p className="text-sm text-white">{ex.name}</p>
                    <p className="text-[11px] text-slate-500">{ex.category}</p>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
