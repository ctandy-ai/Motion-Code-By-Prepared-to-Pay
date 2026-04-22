import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { VideoUpload } from "@/components/video-upload";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Video, 
  Search, 
  Filter,
  Target,
  Users,
  Trophy,
  Clock,
  Play,
  AlertTriangle
} from "lucide-react";

interface Exercise {
  id: number;
  name: string;
  description: string;
  category: string;
  component: 'acceleration' | 'deceleration' | 'change-direction' | 'top-speed';
  beltLevel: 'white' | 'blue' | 'black';
  duration: string | null;
  equipment: string;
  coachingCues: string[];
  isCustom: boolean;
  createdAt: Date | null;
  videoUrl?: string;
  thumbnailUrl?: string;
}

const qualityConfig = {
  acceleration: {
    title: "Starting & Acceleration",
    color: "blue",
    icon: Target,
    description: "First step quickness, acceleration mechanics"
  },
  deceleration: {
    title: "Stopping & Deceleration", 
    color: "red",
    icon: Users,
    description: "Safe stopping mechanics, force absorption"
  },
  "change-direction": {
    title: "Direction Changes",
    color: "green",
    icon: Trophy,
    description: "Agility patterns, cutting mechanics"
  },
  "top-speed": {
    title: "Maximum Speed",
    color: "purple", 
    icon: Clock,
    description: "Advanced speed mechanics"
  }
};

export default function VideoAdmin() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [beltFilter, setBeltFilter] = useState("all");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const { data: exercises = [], isLoading: isLoadingExercises, refetch: refetchExercises } = useQuery<Exercise[]>({
    queryKey: ['/api/exercises'],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-lg mx-auto p-8 text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Professional Access Required
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Only coaches and administrators can manage exercise videos.
          </p>
        </div>
      </div>
    );
  }

  const isCoachOrAdmin = (user as any)?.role === "coach" || (user as any)?.role === "admin";

  if (!isCoachOrAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-lg mx-auto p-8 text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Coach Access Required
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Only coaches and administrators can manage exercise videos.
          </p>
        </div>
      </div>
    );
  }

  // Calculate video statistics
  const exercisesWithVideo = exercises.filter(ex => ex.videoUrl);
  const exercisesWithoutVideo = exercises.filter(ex => !ex.videoUrl);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={user} />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <Video className="w-6 h-6 text-purple-600" />
                Video Management
              </h1>
              <p className="text-gray-600">
                Upload and manage exercise demonstration videos
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-green-100 text-green-700 border-green-200">
                {exercisesWithVideo.length} Videos
              </Badge>
              <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                {exercisesWithoutVideo.length} Missing
              </Badge>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Exercise List */}
            <div className="lg:col-span-2 space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white border border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-600" />
                      Total Exercises
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{exercises.length}</div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                      <Play className="w-5 h-5 text-green-600" />
                      With Videos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{exercisesWithVideo.length}</div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      Missing Videos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{exercisesWithoutVideo.length}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Search and Filters */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search exercises..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-admin"
                    />
                  </div>
                  <Select value={beltFilter} onValueChange={setBeltFilter}>
                    <SelectTrigger className="w-40">
                      <Filter className="w-4 h-4 mr-2 text-gray-400" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="white">White Belt</SelectItem>
                      <SelectItem value="blue">Blue Belt</SelectItem>
                      <SelectItem value="black">Black Belt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Exercise List */}
              <div className="space-y-3">
                {exercises
                  .filter(exercise => 
                    (beltFilter === "all" || exercise.beltLevel === beltFilter) &&
                    (searchTerm === "" || exercise.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  )
                  .map((exercise) => (
                    <Card 
                      key={exercise.id} 
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedExercise?.id === exercise.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedExercise(exercise)}
                      data-testid={`card-admin-exercise-${exercise.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-800 mb-1">{exercise.name}</h3>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={`text-xs ${
                                exercise.beltLevel === "white" 
                                  ? "bg-gray-100 text-gray-700" 
                                  : exercise.beltLevel === "blue"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-800 text-white"
                              }`}>
                                {exercise.beltLevel}
                              </Badge>
                              <span className="text-xs text-gray-500 capitalize">{exercise.component}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {exercise.videoUrl ? (
                              <Badge className="bg-green-100 text-green-700 text-xs">
                                <Play className="w-3 h-3 mr-1" />
                                Video
                              </Badge>
                            ) : (
                              <Badge className="bg-orange-100 text-orange-700 text-xs">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                No Video
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>

            {/* Video Upload Panel */}
            <div className="lg:col-span-1">
              {selectedExercise ? (
                <div className="sticky top-6">
                  <VideoUpload 
                    exercise={selectedExercise} 
                    onVideoUploaded={() => {
                      refetchExercises();
                      setSelectedExercise(null);
                    }}
                  />
                </div>
              ) : (
                <Card className="bg-white border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-800">
                      Select an Exercise
                    </CardTitle>
                    <CardDescription>
                      Choose an exercise from the list to upload or manage its video
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <Video className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-sm">Click on an exercise to get started</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}