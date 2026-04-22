import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Video, 
  Search,
  Link as LinkIcon,
  Check,
  X,
  PlayCircle
} from "lucide-react";

interface Exercise {
  id: number;
  name: string;
  component: string;
  beltLevel: string;
  videoUrl?: string;
  thumbnailUrl?: string;
}

interface VideoFile {
  name: string;
  path: string;
  component?: string;
  beltLevel?: string;
  cleanName: string;
}

export default function VideoMapping() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [mappings, setMappings] = useState<Record<string, number>>({});

  // Get all exercises
  const { data: exercises = [] } = useQuery<Exercise[]>({
    queryKey: ['/api/exercises'],
    enabled: isAuthenticated,
  });

  // Get all videos from storage
  const { data: videos = [], isLoading: isLoadingVideos, isError: isVideosError } = useQuery<VideoFile[]>({
    queryKey: ['/api/storage/videos'],
    enabled: isAuthenticated,
  });

  // Save mapping mutation
  const saveMappingMutation = useMutation({
    mutationFn: async ({ videoPath, exerciseId }: { videoPath: string; exerciseId: number }) => {
      const videoUrl = `/objects/${videoPath}`;
      const thumbnailUrl = `/api/thumbnails/${exerciseId}`;
      
      const response = await fetch(`/api/exercises/${exerciseId}/video-urls`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoUrl, thumbnailUrl })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save mapping');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exercises'] });
      toast({
        title: "Video mapped successfully",
        description: "The exercise video has been connected.",
      });
    },
    onError: () => {
      toast({
        title: "Mapping failed",
        description: "Failed to connect the video. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSaveMapping = async (videoPath: string, exerciseId: number) => {
    await saveMappingMutation.mutateAsync({ videoPath, exerciseId });
    setMappings(prev => ({ ...prev, [videoPath]: exerciseId }));
  };

  const exercisesWithoutVideos = exercises.filter(ex => !ex.videoUrl);
  const exercisesWithVideos = exercises.filter(ex => ex.videoUrl);

  const filteredExercises = exercisesWithoutVideos.filter(ex =>
    searchTerm === "" || ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={user} />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <LinkIcon className="w-6 h-6 text-purple-600" />
                Video Mapping
              </h1>
              <p className="text-gray-600">
                Connect your videos from object storage to exercises
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-green-100 text-green-700 border-green-200">
                {exercisesWithVideos.length} Mapped
              </Badge>
              <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                {exercisesWithoutVideos.length} Unmapped
              </Badge>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Videos List */}
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                  <Video className="w-5 h-5 text-blue-600" />
                  Videos in Storage
                </CardTitle>
                <CardDescription>
                  {videos.length} videos available in object storage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {isVideosError ? (
                    <div className="text-center py-8 text-red-500">
                      <X className="w-12 h-12 mx-auto mb-4" />
                      <p className="text-sm font-medium">Failed to load videos</p>
                      <p className="text-xs text-gray-500 mt-1">Please check object storage configuration</p>
                    </div>
                  ) : isLoadingVideos || videos.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Video className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-sm">{isLoadingVideos ? 'Loading videos from storage...' : 'No videos found'}</p>
                    </div>
                  ) : (
                    videos.map((video) => (
                      <div
                        key={video.path}
                        className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-800 truncate">
                              {video.cleanName}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {video.beltLevel && (
                                <Badge className="text-xs" variant="outline">
                                  {video.beltLevel}
                                </Badge>
                              )}
                              {video.component && (
                                <span className="text-xs text-gray-500 capitalize">
                                  {video.component}
                                </span>
                              )}
                            </div>
                          </div>
                          {mappings[video.path] ? (
                            <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                          ) : (
                            <PlayCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Exercises List */}
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg text-gray-800">
                  Exercises Without Videos
                </CardTitle>
                <CardDescription>
                  {exercisesWithoutVideos.length} exercises need videos
                </CardDescription>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search exercises..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-exercises"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredExercises.map((exercise) => (
                    <div
                      key={exercise.id}
                      className="p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="mb-2">
                        <p className="font-medium text-sm text-gray-800">
                          {exercise.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="text-xs" variant="outline">
                            {exercise.beltLevel}
                          </Badge>
                          <span className="text-xs text-gray-500 capitalize">
                            {exercise.component}
                          </span>
                        </div>
                      </div>
                      <Select
                        onValueChange={(videoPath) => {
                          handleSaveMapping(videoPath, exercise.id);
                        }}
                      >
                        <SelectTrigger className="w-full" data-testid={`select-video-${exercise.id}`}>
                          <SelectValue placeholder="Select video..." />
                        </SelectTrigger>
                        <SelectContent>
                          {videos.map((video) => (
                            <SelectItem key={video.path} value={video.path}>
                              {video.cleanName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <Card className="mt-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-900">
                    Progress: {Object.keys(mappings).length} videos mapped in this session
                  </p>
                  <p className="text-sm text-blue-700">
                    Total: {exercisesWithVideos.length} of {exercises.length} exercises have videos
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}