import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Edit, Trash2 } from "lucide-react";
import { Exercise } from "@shared/schema";

interface ExerciseCardProps {
  exercise: Exercise;
  onEdit?: (exercise: Exercise) => void;
  onDelete?: (id: string) => void;
  onViewVideo?: (exercise: Exercise) => void;
}

export function ExerciseCard({ exercise, onEdit, onDelete, onViewVideo }: ExerciseCardProps) {
  return (
    <Card 
      className="overflow-hidden bglass shadow-glass border-0 magnetic-hover transition-all duration-300 group"
      data-testid={`exercise-card-${exercise.id}`}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {exercise.thumbnailUrl ? (
          <img 
            src={exercise.thumbnailUrl} 
            alt={exercise.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-xp/10 to-info/10">
            <Play className="h-12 w-12 text-xp group-hover:scale-110 transition-transform breathe" />
          </div>
        )}
        {exercise.videoUrl && (
          <Button
            size="icon"
            variant="secondary"
            className="absolute bottom-2 right-2 h-10 w-10 rounded-full"
            onClick={() => onViewVideo?.(exercise)}
            data-testid={`button-play-${exercise.id}`}
          >
            <Play className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading text-lg font-semibold text-slate-100 line-clamp-1">
            {exercise.name}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs text-slate-100">
            {exercise.category}
          </Badge>
          <Badge variant="outline" className="text-xs text-slate-200">
            {exercise.muscleGroup}
          </Badge>
          <Badge 
            variant="outline" 
            className={`text-xs ${
              exercise.difficulty === "Beginner" ? "border-emerald-500/50 text-emerald-400" :
              exercise.difficulty === "Intermediate" ? "border-amber-500/50 text-amber-400" :
              "border-rose-500/50 text-rose-400"
            }`}
          >
            {exercise.difficulty}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <p className="text-sm text-slate-400 line-clamp-2">
          {exercise.instructions}
        </p>
        <p className="text-xs text-slate-400 mt-2">
          Equipment: {exercise.equipment}
        </p>
      </CardContent>

      {(onEdit || onDelete) && (
        <CardFooter className="gap-2 border-t border-slate-700/30 pt-3">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-slate-200"
              onClick={() => onEdit(exercise)}
              data-testid={`button-edit-${exercise.id}`}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              className="text-slate-200"
              onClick={() => onDelete(exercise.id)}
              data-testid={`button-delete-${exercise.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
