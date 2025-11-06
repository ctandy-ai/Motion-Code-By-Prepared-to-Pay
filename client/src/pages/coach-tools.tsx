import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Dumbbell, Tag, Target, Video } from "lucide-react";

interface CoachExercise {
  id: string;
  name: string;
  category: string;
  muscleGroup: string;
  equipment: string;
  difficulty: string;
  tracking?: string;
  tags?: string;
  attributes?: string;
  sets?: number;
  reps?: string;
  intensity?: string;
  beltMin?: string;
  beltMax?: string;
  videoUrl?: string;
  notes?: string;
}

const COACH_EXERCISES: CoachExercise[] = [
  {
    id: "barbell-back-squat",
    name: "Barbell Back Squat",
    category: "Strength",
    muscleGroup: "Legs",
    equipment: "Barbell",
    difficulty: "Intermediate",
    tracking: "1RM",
    tags: "squat|push|free_weight",
    attributes: "Lower Body Push Bilateral",
    sets: 5,
    reps: "3-5",
    intensity: "85-95% 1RM or RPE 8-9",
    beltMin: "White",
    beltMax: "Black",
  },
  {
    id: "trap-bar-deadlift",
    name: "Trap Bar Deadlift",
    category: "Strength",
    muscleGroup: "Legs",
    equipment: "Trap Bar",
    difficulty: "Intermediate",
    tracking: "1RM",
    tags: "hinge|push|free_weight",
    attributes: "Lower Body Push Bilateral",
    sets: 5,
    reps: "3-5",
    intensity: "85-90% 1RM or RPE 8",
    beltMin: "White",
    beltMax: "Black",
  },
  {
    id: "db-split-squat",
    name: "DB Split Squat",
    category: "Strength",
    muscleGroup: "Legs",
    equipment: "Dumbbell",
    difficulty: "Intermediate",
    tracking: "Highest Weight",
    tags: "unilateral|push|free_weight",
    attributes: "Lower Body Push Unilateral",
    sets: 3,
    reps: "8-10",
    intensity: "RPE 7",
    beltMin: "White",
    beltMax: "Black",
  },
  {
    id: "bench-press",
    name: "Bench Press",
    category: "Strength",
    muscleGroup: "Chest",
    equipment: "Barbell",
    difficulty: "Intermediate",
    tracking: "1RM",
    tags: "push|press|free_weight",
    attributes: "Upper Body Push Bilateral",
    sets: 5,
    reps: "3-5",
    intensity: "85-90% 1RM or RPE 8",
    beltMin: "White",
    beltMax: "Black",
  },
  {
    id: "plank",
    name: "Plank",
    category: "Core",
    muscleGroup: "Core",
    equipment: "Bodyweight",
    difficulty: "Beginner",
    tags: "core|bodyweight",
    attributes: "Core: Anti-Extension",
    sets: 3,
    reps: "30-45s",
    intensity: "Bodyweight",
    beltMin: "White",
    beltMax: "Black",
  },
  {
    id: "deadlift",
    name: "Barbell Deadlift",
    category: "Strength",
    muscleGroup: "Back",
    equipment: "Barbell",
    difficulty: "Advanced",
    tracking: "1RM",
    tags: "hinge|pull|free_weight",
    attributes: "Lower Body Pull Bilateral",
    sets: 5,
    reps: "1-5",
    intensity: "85-95% 1RM or RPE 8-9",
    beltMin: "Blue",
    beltMax: "Black",
  },
];

export default function CoachTools() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredExercises = COACH_EXERCISES.filter((exercise) => {
    const matchesSearch =
      exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exercise.muscleGroup.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exercise.tags && exercise.tags.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory =
      selectedCategory === "all" || exercise.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", ...Array.from(new Set(COACH_EXERCISES.map((e) => e.category)))];

  return (
    <div className="space-y-8">
      <div className="bglass rounded-2xl shadow-glass p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg text-slate-100">Coach Tools</h2>
            <p className="text-sm text-slate-400 mt-1">
              Master exercise database and coaching resources
            </p>
          </div>
          <div className="chip">
            {COACH_EXERCISES.length} Exercises
          </div>
        </div>
      </div>

      <div className="bglass rounded-2xl shadow-glass p-5">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search exercises, muscle groups, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-exercises"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                data-testid={`filter-${cat.toLowerCase()}`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredExercises.map((exercise) => (
            <Card
              key={exercise.id}
              className="bglass shadow-glass border-0"
              data-testid={`exercise-card-${exercise.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-semibold text-slate-100 flex-1">
                    {exercise.name}
                  </CardTitle>
                  {exercise.videoUrl && (
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <Video className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs bg-brand-500/20 text-brand-300">
                    <Dumbbell className="h-3 w-3 mr-1" />
                    {exercise.muscleGroup}
                  </Badge>
                  {exercise.difficulty && (
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        exercise.difficulty === "Beginner"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : exercise.difficulty === "Intermediate"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-rose-500/20 text-rose-400"
                      }`}
                    >
                      {exercise.difficulty}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Target className="h-3 w-3" />
                    <span className="text-xs">{exercise.equipment}</span>
                  </div>
                  {exercise.attributes && (
                    <div className="flex items-start gap-2 text-slate-400">
                      <Tag className="h-3 w-3 mt-0.5" />
                      <span className="text-xs">{exercise.attributes}</span>
                    </div>
                  )}
                </div>

                {(exercise.sets || exercise.reps || exercise.intensity) && (
                  <div className="pt-3 border-t border-white/10">
                    <div className="text-xs text-slate-400 mb-2">Suggested Programming</div>
                    <div className="space-y-1 text-xs text-slate-200">
                      {exercise.sets && <div>Sets: {exercise.sets}</div>}
                      {exercise.reps && <div>Reps: {exercise.reps}</div>}
                      {exercise.intensity && <div>Intensity: {exercise.intensity}</div>}
                    </div>
                  </div>
                )}

                {(exercise.beltMin || exercise.beltMax) && (
                  <div className="flex gap-2 text-xs">
                    {exercise.beltMin && (
                      <div className="text-slate-400">
                        Belt: <span className="text-slate-200">{exercise.beltMin}</span>
                        {exercise.beltMax && ` - ${exercise.beltMax}`}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredExercises.length === 0 && (
          <div className="text-center py-12">
            <Dumbbell className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No exercises found matching your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
