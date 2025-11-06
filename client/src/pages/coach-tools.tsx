import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Dumbbell, Tag, Target, Video, Filter } from "lucide-react";

interface TeamBuildrExercise {
  id: string;
  name: string;
  tracking: string;
  tags: string;
  attributes: string;
  variables_default: {
    sets: number;
    reps: string;
    intensity: string;
  };
  belt_min: string;
  belt_max: string;
  notes: string;
}

export default function CoachTools() {
  const [searchQuery, setSearchQuery] = useState("");
  const [trackingFilter, setTrackingFilter] = useState("all");
  const [beltFilter, setBeltFilter] = useState("all");

  const { data: exercises = [], isLoading } = useQuery<TeamBuildrExercise[]>({
    queryKey: ["/master_exercises.json"],
    queryFn: async () => {
      const response = await fetch("/master_exercises.json");
      if (!response.ok) throw new Error("Failed to load exercises");
      return response.json();
    },
  });

  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      const matchesSearch =
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (exercise.tags && exercise.tags.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (exercise.attributes && exercise.attributes.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesTracking =
        trackingFilter === "all" || 
        (trackingFilter === "1rm" && exercise.tracking === "1RM") ||
        (trackingFilter === "weight" && exercise.tracking === "Highest Weight") ||
        (trackingFilter === "none" && !exercise.tracking);
      
      const matchesBelt =
        beltFilter === "all" || exercise.belt_min === beltFilter;

      return matchesSearch && matchesTracking && matchesBelt;
    });
  }, [exercises, searchQuery, trackingFilter, beltFilter]);

  const trackingTypes = ["all", "1rm", "weight", "none"];
  const beltLevels = ["all", "White", "Blue", "Black"];

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
            {isLoading ? "Loading..." : `${exercises.length} Exercises`}
          </div>
        </div>
      </div>

      <div className="bglass rounded-2xl shadow-glass p-5">
        <div className="space-y-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search exercises, tags, attributes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-exercises"
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-400">Tracking:</span>
              {trackingTypes.map((type) => (
                <Button
                  key={type}
                  variant={trackingFilter === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTrackingFilter(type)}
                  data-testid={`filter-tracking-${type}`}
                >
                  {type === "1rm" ? "1RM" : type === "weight" ? "Weight" : type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Belt:</span>
              {beltLevels.map((belt) => (
                <Button
                  key={belt}
                  variant={beltFilter === belt ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBeltFilter(belt)}
                  data-testid={`filter-belt-${belt.toLowerCase()}`}
                >
                  {belt}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="text-sm text-slate-400">
            Showing {filteredExercises.length} of {exercises.length} exercises
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bglass shadow-glass border-0">
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredExercises.slice(0, 100).map((exercise) => (
              <Card
                key={exercise.id}
                className="bglass shadow-glass border-0"
                data-testid={`exercise-card-${exercise.id}`}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-slate-100">
                    {exercise.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    {exercise.tracking && (
                      <Badge variant="secondary" className="text-xs bg-brand-500/20 text-brand-300">
                        <Target className="h-3 w-3 mr-1" />
                        {exercise.tracking}
                      </Badge>
                    )}
                    {exercise.belt_min && (
                      <Badge variant="secondary" className="text-xs bg-slate-500/20 text-slate-300">
                        {exercise.belt_min}
                        {exercise.belt_max && exercise.belt_max !== exercise.belt_min && ` - ${exercise.belt_max}`}
                      </Badge>
                    )}
                  </div>

                  {exercise.attributes && (
                    <div className="flex items-start gap-2 text-slate-400">
                      <Tag className="h-3 w-3 mt-0.5 shrink-0" />
                      <span className="text-xs">{exercise.attributes}</span>
                    </div>
                  )}

                  {exercise.tags && (
                    <div className="flex items-start gap-2 text-slate-400">
                      <Dumbbell className="h-3 w-3 mt-0.5 shrink-0" />
                      <span className="text-xs">{exercise.tags}</span>
                    </div>
                  )}

                  {exercise.variables_default && (
                    <div className="pt-3 border-t border-white/10">
                      <div className="text-xs text-slate-400 mb-2">Suggested Programming</div>
                      <div className="space-y-1 text-xs text-slate-200">
                        <div>Sets: {exercise.variables_default.sets}</div>
                        <div>Reps: {exercise.variables_default.reps}</div>
                        <div>Intensity: {exercise.variables_default.intensity}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && filteredExercises.length === 0 && (
          <div className="text-center py-12">
            <Dumbbell className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No exercises found matching your search</p>
          </div>
        )}

        {!isLoading && filteredExercises.length > 100 && (
          <div className="text-center pt-6">
            <p className="text-sm text-slate-400">
              Showing first 100 of {filteredExercises.length} results. Refine your search to see more.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
