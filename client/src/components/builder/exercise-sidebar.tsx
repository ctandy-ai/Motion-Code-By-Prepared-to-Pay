import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Dumbbell, GripVertical, Filter, ChevronDown, ChevronUp } from "lucide-react";
import type { Exercise } from "@shared/schema";

interface ExerciseSidebarProps {
  onExerciseSelect?: (exercise: Exercise) => void;
  budgetWarnings?: {
    plyoOverBudget?: boolean;
    setsOverBudget?: boolean;
  };
}

export function ExerciseSidebar({ onExerciseSelect, budgetWarnings }: ExerciseSidebarProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const { data: exercises = [], isLoading } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });

  const categories = useMemo(() => {
    const cats = new Set<string>();
    exercises.forEach((e) => {
      if (e.category) cats.add(e.category);
    });
    return Array.from(cats).sort();
  }, [exercises]);

  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      const matchesSearch = !search || 
        exercise.name.toLowerCase().includes(search.toLowerCase()) ||
        exercise.category?.toLowerCase().includes(search.toLowerCase());
      
      const matchesCategory = categoryFilter === "all" || exercise.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    }).slice(0, 50);
  }, [exercises, search, categoryFilter]);

  const handleDragStart = (e: React.DragEvent, exercise: Exercise) => {
    e.dataTransfer.setData("application/json", JSON.stringify(exercise));
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <div className="h-full flex flex-col bg-slate-900/50 border-r border-slate-700/50" data-testid="exercise-sidebar">
      <div className="p-3 border-b border-slate-700/50 space-y-2">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-brand-400" />
          <span className="text-sm font-semibold text-slate-200">Exercise Library</span>
          <Badge className="bg-slate-700 text-slate-300 text-[10px] ml-auto">
            {exercises.length}
          </Badge>
        </div>
        
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <Input
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs bg-slate-800/50 border-slate-600"
            data-testid="exercise-search"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-300 w-full"
        >
          <Filter className="h-3 w-3" />
          Filters
          {showFilters ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
        </button>

        {showFilters && (
          <div className="space-y-2 pt-1">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-7 text-xs bg-slate-800/50 border-slate-600">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {budgetWarnings?.plyoOverBudget && (
        <div className="px-3 py-2 bg-amber-500/10 border-b border-amber-500/20">
          <p className="text-[10px] text-amber-400">Plyo budget exceeded - consider lower intensity</p>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-slate-800/50 rounded animate-pulse" />
              ))}
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No exercises found
            </div>
          ) : (
            filteredExercises.map((exercise) => (
              <div
                key={exercise.id}
                draggable
                onDragStart={(e) => handleDragStart(e, exercise)}
                onClick={() => onExerciseSelect?.(exercise)}
                className="group flex items-center gap-2 p-2 rounded-md cursor-grab active:cursor-grabbing transition-all border border-transparent bg-slate-800/30 hover:bg-slate-800/60 hover:border-slate-600"
                data-testid={`exercise-item-${exercise.id}`}
              >
                <GripVertical className="h-3 w-3 text-slate-600 group-hover:text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate text-slate-200">
                    {exercise.name}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {exercise.category}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-2 border-t border-slate-700/50 text-center">
        <p className="text-[10px] text-slate-500">
          Drag exercises to add
        </p>
      </div>
    </div>
  );
}
