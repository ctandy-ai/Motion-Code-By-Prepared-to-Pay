import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sidebar } from "@/components/sidebar";
import { motion } from "framer-motion";
import { Search, Play, Clock, Target } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// Video preview component with autoplay fallback
function VideoPreview({ src, className }: { src: string; className: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playFailed, setPlayFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handleCanPlay = () => {
      video.play().catch(() => setPlayFailed(true));
    };
    
    video.addEventListener('canplay', handleCanPlay);
    if (video.readyState >= 3) handleCanPlay();
    
    return () => video.removeEventListener('canplay', handleCanPlay);
  }, [src]);

  return (
    <>
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        className={className}
      />
      {playFailed && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            videoRef.current?.play().then(() => setPlayFailed(false));
          }}
          className="absolute inset-0 flex items-center justify-center bg-black/30 z-10"
          aria-label="Play video preview"
          data-testid="button-play-preview"
        >
          <Play className="w-12 h-12 text-white opacity-75" />
        </button>
      )}
    </>
  );
}

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
  acceleration: { title: "Starting (Acceleration)", color: "blue" },
  deceleration: { title: "Stopping (Deceleration)", color: "red" },
  "change-direction": { title: "Stepping (Change of Direction)", color: "green" },
  "top-speed": { title: "Sprinting (Top Speed)", color: "purple" }
};

const beltOrder = ['white', 'blue', 'black'] as const;

export default function ExerciseLibrary() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuality, setSelectedQuality] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);

  // Read component from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const component = params.get('component');
    if (component && ['acceleration', 'deceleration', 'change-direction', 'top-speed'].includes(component)) {
      setSelectedQuality(component);
    }
  }, []);

  const { data: exercises = [], isLoading: isLoadingExercises } = useQuery<Exercise[]>({
    queryKey: ['/api/exercises'],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-p2p-dark">
        <div className="animate-spin w-8 h-8 border-4 border-p2p-electric border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-p2p-dark flex items-center justify-center">
        <div className="max-w-lg mx-auto p-8 text-center">
          <h2 className="text-xl font-heading text-white mb-4">Professional Access Required</h2>
          <p className="text-gray-400 font-body mb-8 leading-relaxed">Sign in to view evidence-based training protocols.</p>
          <Button 
            onClick={() => window.location.href = "/login"}
            className="bg-gradient-to-r from-p2p-blue to-p2p-electric hover:shadow-glow text-white px-8 py-3 text-lg font-semibold"
          >
            Professional Sign In
          </Button>
        </div>
      </div>
    );
  }

  // Filter exercises
  const filteredExercises = exercises.filter(exercise =>
    (selectedQuality === null || exercise.component === selectedQuality) &&
    (searchTerm === "" || exercise.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group by quality and belt
  const groupedExercises = filteredExercises.reduce((acc, exercise) => {
    if (!acc[exercise.component]) acc[exercise.component] = {};
    if (!acc[exercise.component][exercise.beltLevel]) acc[exercise.component][exercise.beltLevel] = [];
    acc[exercise.component][exercise.beltLevel].push(exercise);
    return acc;
  }, {} as Record<string, Record<string, Exercise[]>>);

  return (
    <div className="flex min-h-screen bg-p2p-dark">
      <Sidebar user={user} />
      
      <div className="flex-1 flex flex-col">
        {/* Hero */}
        <section className="relative h-[35vh] md:h-[50vh] flex items-center justify-center pt-16 md:pt-0">
          <VideoPreview 
            src="/objects/Videos/Videos/Stepping - white belt/Lateral Jimmy Jumps.MP4"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/90" />
          <div className="relative text-center px-4 max-w-full">
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="font-heading text-3xl sm:text-4xl md:text-8xl font-bold text-white tracking-tight break-words"
            >
              Movement Library
            </motion.h1>
          </div>
        </section>

        {/* Quality Filter Pills */}
        <div className="bg-gray-900 border-b border-gray-800 px-4 md:px-6 py-4 md:py-6">
          <div className="flex flex-wrap gap-2 md:gap-3 items-center justify-center mb-4">
            <button
              onClick={() => setSelectedQuality(null)}
              className={`px-6 py-2 rounded-full font-semibold text-sm uppercase tracking-wide transition-all ${
                selectedQuality === null
                  ? 'bg-gradient-to-r from-p2p-blue to-p2p-electric text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              All Qualities
            </button>
            {Object.entries(qualityConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setSelectedQuality(key)}
                className={`px-6 py-2 rounded-full font-semibold text-sm uppercase tracking-wide transition-all ${
                  selectedQuality === key
                    ? 'bg-gradient-to-r from-p2p-blue to-p2p-electric text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {config.title.split(' ')[0]}
              </button>
            ))}
          </div>
          
          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search exercises..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-p2p-surface border-p2p-border text-white focus:border-p2p-electric rounded-full"
            />
          </div>
        </div>

        {/* Exercise Grid by Quality & Belt */}
        <main className="flex-1 p-4 md:p-6 lg:p-10">
          {Object.entries(groupedExercises).map(([quality, beltGroups]) => (
            <section key={quality} className="mb-12 md:mb-16">
              {/* Quality Title */}
              <div className="mb-6 md:mb-8">
                <h2 className="font-heading text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-2 tracking-tight">
                  {qualityConfig[quality as keyof typeof qualityConfig]?.title}
                </h2>
                <div className="h-1 w-24 bg-gradient-to-r from-p2p-blue to-p2p-electric rounded-full" />
              </div>

              {/* Belt Sections */}
              {beltOrder.map(belt => {
                const beltExercises = beltGroups[belt];
                if (!beltExercises || beltExercises.length === 0) return null;

                return (
                  <div key={belt} className="mb-10">
                    {/* Belt Header */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-full backdrop-blur-sm">
                        <span className="text-xl">🥋</span>
                        <div className={`w-3 h-3 rounded-full ${
                          belt === 'white' ? 'bg-white' :
                          belt === 'blue' ? 'bg-blue-400' :
                          'bg-gray-500 border border-gray-400'
                        }`}></div>
                        <span className={`font-semibold text-sm uppercase tracking-wide ${
                          belt === 'white' ? 'text-white' :
                          belt === 'blue' ? 'text-blue-300' :
                          'text-gray-300'
                        }`}>
                          {belt} Belt
                        </span>
                      </div>
                      <div className="flex-1 h-px bg-gradient-to-r from-gray-700 to-transparent" />
                    </div>

                    {/* Exercise Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {beltExercises.map((exercise) => (
                        <div
                          key={exercise.id}
                          className="group relative bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-3xl shadow-glow overflow-hidden hover:border-p2p-electric/50 transition-all duration-300 cursor-pointer"
                          onClick={() => {
                            if (exercise.videoUrl) {
                              setSelectedExercise(exercise);
                              setIsVideoDialogOpen(true);
                            }
                          }}
                        >
                          {/* Video Preview */}
                          <div className="relative aspect-video w-full bg-[#0C1A27] overflow-hidden">
                            {exercise.videoUrl ? (
                              <>
                                <VideoPreview 
                                  src={exercise.videoUrl} 
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                  <Play className="w-16 h-16 text-white drop-shadow-lg" />
                                </div>
                              </>
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-br from-p2p-blue to-p2p-electric flex items-center justify-center">
                                <Play className="w-12 h-12 text-white opacity-80" />
                              </div>
                            )}
                          </div>

                          {/* Exercise Info */}
                          <div className="p-6">
                            <h3 className="font-heading text-2xl font-bold text-white mb-3 tracking-tight group-hover:text-p2p-electric transition-colors">
                              {exercise.name}
                            </h3>
                            <p className="text-gray-400 font-body text-sm mb-4 line-clamp-2">
                              {exercise.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{exercise.duration || "Variable"}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                <span>{exercise.equipment}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </section>
          ))}

          {filteredExercises.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-400 font-body text-lg">No exercises found</p>
            </div>
          )}
        </main>
      </div>

      {/* Video Player Dialog */}
      <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-p2p-darker border-2 border-p2p-electric/40 p-0 rounded-3xl shadow-2xl">
          {/* Enhanced Header with Gradient */}
          <DialogHeader className="sticky top-0 z-10 px-6 md:px-8 pt-6 md:pt-8 pb-4 md:pb-6 bg-gradient-to-r from-p2p-blue/30 to-p2p-electric/30 border-b-2 border-p2p-electric/40 backdrop-blur-sm">
            <DialogTitle className="text-3xl md:text-4xl font-heading font-bold text-white mb-3 tracking-tight pr-8">
              {selectedExercise?.name}
            </DialogTitle>
            <p className="text-gray-200 font-body text-base leading-relaxed">
              {selectedExercise?.description}
            </p>
            
            {/* Belt Level Badge */}
            {selectedExercise?.beltLevel && (
              <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-p2p-dark border border-p2p-electric/50 rounded-full">
                <div className={`w-3 h-3 rounded-full ${
                  selectedExercise.beltLevel === 'white' ? 'bg-white' :
                  selectedExercise.beltLevel === 'blue' ? 'bg-blue-400' :
                  'bg-gray-800 border border-gray-500'
                }`}></div>
                <span className={`font-semibold text-sm uppercase tracking-wide ${
                  selectedExercise.beltLevel === 'white' ? 'text-white' :
                  selectedExercise.beltLevel === 'blue' ? 'text-blue-300' :
                  'text-gray-300'
                }`}>
                  {selectedExercise.beltLevel} Belt
                </span>
              </div>
            )}
          </DialogHeader>
          
          <div className="px-6 md:px-8 pb-6 md:pb-8 pt-4 md:pt-6">
            {/* Video Section */}
            {selectedExercise?.videoUrl ? (
              <div className="bg-p2p-dark rounded-2xl overflow-hidden mb-6 border border-p2p-electric/30">
                <video 
                  controls 
                  autoPlay
                  className="w-full aspect-video"
                >
                  <source src={selectedExercise.videoUrl} type="video/mp4" />
                  <source src={selectedExercise.videoUrl} type="video/quicktime" />
                </video>
              </div>
            ) : (
              <div className="bg-p2p-dark border border-p2p-border rounded-2xl p-12 text-center mb-6">
                <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 font-body">No video available</p>
              </div>
            )}

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Details Card */}
              <div className="bg-p2p-dark border border-p2p-electric/30 rounded-2xl p-5">
                <h4 className="text-base font-heading font-bold text-p2p-electric mb-4 uppercase tracking-wide flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Dosage & Details
                </h4>
                <div className="space-y-3 font-body">
                  {selectedExercise?.duration && (
                    <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-p2p-blue/20 to-p2p-electric/20 rounded-xl border-2 border-p2p-electric/60">
                      <Target className="w-5 h-5 text-p2p-electric mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-p2p-electric uppercase tracking-wide mb-1 font-bold">Dosage</p>
                        <p className="text-white font-bold text-lg">{selectedExercise.duration}</p>
                      </div>
                    </div>
                  )}
                  {selectedExercise?.equipment && (
                    <div className="flex items-start gap-3 p-3 bg-p2p-darker rounded-xl border border-p2p-border">
                      <Target className="w-5 h-5 text-p2p-electric mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Equipment</p>
                        <p className="text-white font-semibold text-base">{selectedExercise.equipment}</p>
                      </div>
                    </div>
                  )}
                  {selectedExercise?.component && (
                    <div className="flex items-start gap-3 p-3 bg-p2p-darker rounded-xl border border-p2p-border">
                      <Play className="w-5 h-5 text-p2p-electric mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Movement Quality</p>
                        <p className="text-white font-semibold text-base capitalize">
                          {selectedExercise.component.replace('-', ' ')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Coaching Cues Card */}
              {selectedExercise?.coachingCues && selectedExercise.coachingCues.length > 0 && (
                <div className="bg-p2p-dark border border-p2p-electric/30 rounded-2xl p-5">
                  <h4 className="text-base font-heading font-bold text-p2p-electric mb-4 uppercase tracking-wide flex items-center gap-2">
                    <Play className="w-5 h-5" />
                    Coaching Cues
                  </h4>
                  <ul className="space-y-2 font-body">
                    {selectedExercise.coachingCues.map((cue, index) => (
                      <li key={index} className="flex items-start gap-3 p-3 bg-p2p-darker rounded-xl border border-p2p-border">
                        <span className="text-p2p-electric font-bold text-base mt-0.5">•</span>
                        <span className="text-white leading-relaxed text-sm">{cue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
