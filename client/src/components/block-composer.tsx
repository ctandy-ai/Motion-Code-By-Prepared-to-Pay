import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Exercise } from "@shared/schema";

interface SelectedExercise {
  id: string;
  name: string;
  scheme?: string;
  notes?: string;
  orderIndex: number;
}

interface BlockComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (block: {
    title: string;
    belt: string;
    focus: string[];
    scheme?: string;
    notes?: string;
    exercises: SelectedExercise[];
  }) => void;
  initialData?: {
    title?: string;
    belt?: string;
    focus?: string[];
    scheme?: string;
    notes?: string;
    exercises?: SelectedExercise[];
  };
}

const BELT_LEVELS = ["White", "Blue", "Black"];
const FOCUS_AREAS = ["accel", "decel", "cod", "sprint", "strength", "power", "capacity"];

export function BlockComposer({ open, onOpenChange, onSave, initialData }: BlockComposerProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [belt, setBelt] = useState(initialData?.belt || "White");
  const [focus, setFocus] = useState<string[]>(initialData?.focus || []);
  const [scheme, setScheme] = useState(initialData?.scheme || "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>(initialData?.exercises || []);
  const [exerciseSearch, setExerciseSearch] = useState("");

  // Sync state with initialData when it changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setBelt(initialData.belt || "White");
      setFocus(initialData.focus || []);
      setScheme(initialData.scheme || "");
      setNotes(initialData.notes || "");
      setSelectedExercises(initialData.exercises || []);
    }
  }, [initialData]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setTitle("");
      setBelt("White");
      setFocus([]);
      setScheme("");
      setNotes("");
      setSelectedExercises([]);
      setExerciseSearch("");
    }
  }, [open]);

  const { data: exercises = [] } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });

  const filteredExercises = exercises.filter(
    (ex) =>
      ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()) &&
      !selectedExercises.some((sel) => sel.id === ex.id)
  );

  const toggleFocus = (area: string) => {
    setFocus((prev) =>
      prev.includes(area) ? prev.filter((f) => f !== area) : [...prev, area]
    );
  };

  const addExercise = (exercise: Exercise) => {
    setSelectedExercises((prev) => [
      ...prev,
      {
        id: exercise.id,
        name: exercise.name,
        orderIndex: prev.length,
      },
    ]);
    setExerciseSearch("");
  };

  const removeExercise = (id: string) => {
    setSelectedExercises((prev) =>
      prev.filter((ex) => ex.id !== id).map((ex, idx) => ({ ...ex, orderIndex: idx }))
    );
  };

  const updateExerciseScheme = (id: string, scheme: string) => {
    setSelectedExercises((prev) =>
      prev.map((ex) => (ex.id === id ? { ...ex, scheme } : ex))
    );
  };

  const handleSave = () => {
    if (!title.trim()) {
      return;
    }
    
    onSave({
      title: title.trim(),
      belt,
      focus,
      scheme,
      notes,
      exercises: selectedExercises,
    });
    
    // Reset form
    setTitle("");
    setBelt("White");
    setFocus([]);
    setScheme("");
    setNotes("");
    setSelectedExercises([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]" data-testid="dialog-block-composer">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {initialData ? "Edit Training Block" : "Create Training Block"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="block-title">Block Title *</Label>
              <Input
                id="block-title"
                data-testid="input-block-title"
                placeholder="e.g., Upper Body Strength, Speed Development"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Belt Level */}
            <div className="space-y-2">
              <Label htmlFor="belt-level">Belt Level *</Label>
              <Select value={belt} onValueChange={setBelt}>
                <SelectTrigger id="belt-level" data-testid="select-belt-level">
                  <SelectValue placeholder="Select belt level" />
                </SelectTrigger>
                <SelectContent>
                  {BELT_LEVELS.map((level) => (
                    <SelectItem key={level} value={level} data-testid={`option-belt-${level.toLowerCase()}`}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Focus Areas */}
            <div className="space-y-2">
              <Label>Focus Areas</Label>
              <div className="flex flex-wrap gap-2">
                {FOCUS_AREAS.map((area) => (
                  <Badge
                    key={area}
                    variant={focus.includes(area) ? "default" : "outline"}
                    className="cursor-pointer hover-elevate active-elevate-2"
                    onClick={() => toggleFocus(area)}
                    data-testid={`badge-focus-${area}`}
                  >
                    {area.toUpperCase()}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Overall Scheme */}
            <div className="space-y-2">
              <Label htmlFor="block-scheme">Overall Scheme</Label>
              <Input
                id="block-scheme"
                data-testid="input-block-scheme"
                placeholder="e.g., 4x6 @ RPE7, 3x8-10"
                value={scheme}
                onChange={(e) => setScheme(e.target.value)}
              />
            </div>

            {/* Exercises */}
            <div className="space-y-4">
              <Label>Exercises ({selectedExercises.length})</Label>
              
              {/* Exercise Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  data-testid="input-exercise-search"
                  placeholder="Search exercises..."
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Search Results */}
              {exerciseSearch && (
                <div className="border rounded-md max-h-48 overflow-auto">
                  {filteredExercises.length > 0 ? (
                    <div className="divide-y">
                      {filteredExercises.slice(0, 10).map((ex) => (
                        <button
                          key={ex.id}
                          data-testid={`button-add-exercise-${ex.id}`}
                          onClick={() => addExercise(ex)}
                          className="w-full flex items-center justify-between p-3 hover-elevate active-elevate-2"
                        >
                          <span className="text-sm text-slate-200">{ex.name}</span>
                          <Plus className="h-4 w-4 text-slate-400" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-sm text-slate-400 text-center">
                      No exercises found
                    </div>
                  )}
                </div>
              )}

              {/* Selected Exercises */}
              {selectedExercises.length > 0 && (
                <div className="space-y-2">
                  {selectedExercises.map((ex) => (
                    <div
                      key={ex.id}
                      data-testid={`exercise-item-${ex.id}`}
                      className="flex items-start gap-3 p-3 bg-ink-2/50 rounded-md border border-ink-3"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-100">{ex.name}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            data-testid={`button-remove-exercise-${ex.id}`}
                            onClick={() => removeExercise(ex.id)}
                            className="h-6 w-6"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <Input
                          data-testid={`input-exercise-scheme-${ex.id}`}
                          placeholder="Scheme (e.g., 3x8, 4x6 @ 75%)"
                          value={ex.scheme || ""}
                          onChange={(e) => updateExerciseScheme(ex.id, e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="block-notes">Coach Notes</Label>
              <Textarea
                id="block-notes"
                data-testid="textarea-block-notes"
                placeholder="Coaching cues, progressions, regressions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-ink-3">
          <Button
            variant="outline"
            data-testid="button-cancel"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            data-testid="button-save-block"
            onClick={handleSave}
            disabled={!title.trim()}
          >
            {initialData ? "Update Block" : "Create Block"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
