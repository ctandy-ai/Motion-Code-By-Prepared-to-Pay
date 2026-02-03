import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Video,
  Search,
  Play,
  Link as LinkIcon,
  Filter,
  Grid3X3,
  List,
  Loader2,
  ExternalLink,
  Dumbbell,
} from "lucide-react";
import type { Exercise } from "@shared/schema";

export default function VideoLibrary() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [videoUrl, setVideoUrl] = useState("");

  const { data: exercises = [], isLoading, error } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });

  const updateVideoMutation = useMutation({
    mutationFn: async ({ id, videoUrl }: { id: string; videoUrl: string }) => {
      const response = await apiRequest("PATCH", `/api/exercises/${id}`, {
        videoUrl: videoUrl || null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      toast({ title: "Video updated successfully" });
      setSelectedExercise(null);
      setVideoUrl("");
    },
    onError: () => {
      toast({ title: "Failed to update video", variant: "destructive" });
    },
  });

  const categories = Array.from(new Set(exercises.map((e) => e.category))).sort();
  const muscleGroups = Array.from(new Set(exercises.map((e) => e.muscleGroup))).sort();

  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch =
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exercise.muscleGroup?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || exercise.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const exercisesWithVideos = filteredExercises.filter((e) => e.videoUrl);
  const exercisesWithoutVideos = filteredExercises.filter((e) => !e.videoUrl);

  const handleEditVideo = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setVideoUrl(exercise.videoUrl || "");
  };

  const handleSaveVideo = () => {
    if (!selectedExercise) return;
    updateVideoMutation.mutate({
      id: selectedExercise.id,
      videoUrl: videoUrl.trim(),
    });
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    if (url.includes("youtube.com/watch?v=")) {
      const videoId = url.split("v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes("vimeo.com/")) {
      const videoId = url.split("vimeo.com/")[1]?.split("?")[0];
      return `https://player.vimeo.com/video/${videoId}`;
    }
    return url;
  };

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>Failed to load exercises. Please try again.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="video-library-page">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30">
            <Video className="h-6 w-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Video Library</h1>
            <p className="text-sm text-slate-400">
              {exercisesWithVideos.length} exercises with videos • {exercisesWithoutVideos.length} without
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("grid")}
            data-testid="button-view-grid"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
            data-testid="button-view-list"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-600"
            data-testid="input-search"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px] bg-slate-800/50 border-slate-600" data-testid="select-category">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : filteredExercises.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="h-12 w-12 text-slate-500 mb-4" />
            <p className="text-slate-400 text-lg">No exercises found</p>
            <p className="text-slate-500 text-sm">Try adjusting your search or filter</p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredExercises.map((exercise) => (
            <ExerciseVideoCard
              key={exercise.id}
              exercise={exercise}
              onEdit={() => handleEditVideo(exercise)}
              getEmbedUrl={getEmbedUrl}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredExercises.map((exercise) => (
            <ExerciseVideoRow
              key={exercise.id}
              exercise={exercise}
              onEdit={() => handleEditVideo(exercise)}
            />
          ))}
        </div>
      )}

      <Dialog open={!!selectedExercise} onOpenChange={(open) => !open && setSelectedExercise(null)}>
        <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-100">
              Edit Video - {selectedExercise?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video URL</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="videoUrl"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="pl-10 bg-slate-800 border-slate-600"
                  data-testid="input-video-url"
                />
              </div>
              <p className="text-xs text-slate-500">
                Supports YouTube, Vimeo, or direct video URLs
              </p>
            </div>

            {videoUrl && getEmbedUrl(videoUrl) && (
              <div className="aspect-video rounded-lg overflow-hidden bg-slate-800">
                <iframe
                  src={getEmbedUrl(videoUrl) || ""}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="ghost"
                onClick={() => setSelectedExercise(null)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveVideo}
                disabled={updateVideoMutation.isPending}
                data-testid="button-save-video"
              >
                {updateVideoMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Save Video
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ExerciseVideoCardProps {
  exercise: Exercise;
  onEdit: () => void;
  getEmbedUrl: (url: string) => string | null;
}

function ExerciseVideoCard({ exercise, onEdit, getEmbedUrl }: ExerciseVideoCardProps) {
  const embedUrl = exercise.videoUrl ? getEmbedUrl(exercise.videoUrl) : null;

  return (
    <Card
      className="bg-slate-800/50 border-slate-700 overflow-hidden group"
      data-testid={`video-card-${exercise.id}`}
    >
      <div className="aspect-video relative bg-slate-900">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <Dumbbell className="h-12 w-12 text-slate-600 mb-2" />
            <p className="text-xs text-slate-500">No video</p>
          </div>
        )}
        <Button
          variant="secondary"
          size="sm"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onEdit}
          data-testid={`button-edit-video-${exercise.id}`}
        >
          <LinkIcon className="h-3 w-3 mr-1" />
          {exercise.videoUrl ? "Edit" : "Add"}
        </Button>
      </div>
      <CardContent className="p-3">
        <h3 className="font-medium text-sm text-slate-100 truncate" data-testid={`text-exercise-name-${exercise.id}`}>
          {exercise.name}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs">
            {exercise.category}
          </Badge>
          <span className="text-xs text-slate-500">{exercise.muscleGroup}</span>
        </div>
      </CardContent>
    </Card>
  );
}

interface ExerciseVideoRowProps {
  exercise: Exercise;
  onEdit: () => void;
}

function ExerciseVideoRow({ exercise, onEdit }: ExerciseVideoRowProps) {
  return (
    <Card
      className="bg-slate-800/50 border-slate-700"
      data-testid={`video-row-${exercise.id}`}
    >
      <CardContent className="p-3 flex items-center gap-4">
        <div className="w-10 h-10 rounded bg-slate-700 flex items-center justify-center flex-shrink-0">
          {exercise.videoUrl ? (
            <Play className="h-4 w-4 text-green-400" />
          ) : (
            <Video className="h-4 w-4 text-slate-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-slate-100 truncate">
            {exercise.name}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className="text-xs">
              {exercise.category}
            </Badge>
            <span className="text-xs text-slate-500">{exercise.muscleGroup}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {exercise.videoUrl && (
            <a
              href={exercise.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-200"
              data-testid={`link-open-video-${exercise.id}`}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            data-testid={`button-edit-video-${exercise.id}`}
          >
            <LinkIcon className="h-4 w-4 mr-1" />
            {exercise.videoUrl ? "Edit" : "Add"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
