import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, 
  X, Award, Loader2
} from "lucide-react";
import type { Exercise } from "@shared/schema";

const BELT_STYLES: Record<string, string> = {
  white: "bg-white/20 text-white",
  blue: "bg-blue-500/20 text-blue-300 border border-blue-500/40",
  black: "bg-gray-700 text-gray-200",
};

export default function SessionPlayer() {
  const params = useParams<{ exerciseIds: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [rating, setRating] = useState(0);
  const [showInjuryModal, setShowInjuryModal] = useState(false);
  const [injuryBodyPart, setInjuryBodyPart] = useState("");
  const [injuryPain, setInjuryPain] = useState(0);
  const [injuryNotes, setInjuryNotes] = useState("");
  const [injurySubmitted, setInjurySubmitted] = useState(false);
  const [injuryShouldRefer, setInjuryShouldRefer] = useState(false);
  const [newAchievements, setNewAchievements] = useState<any[]>([]);

  const exerciseIds = params.exerciseIds?.split(",").map(Number).filter(Boolean) || [];

  const { data: exercises, isLoading } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises/session", params.exerciseIds],
    queryFn: async () => {
      const results = await Promise.all(
        exerciseIds.map(id =>
          fetch(`/api/exercises/${id}`, { credentials: "include" }).then(r => r.json())
        )
      );
      return results.filter(Boolean);
    },
    enabled: exerciseIds.length > 0,
  });

  const injuryMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/injury/report", {
        bodyPart: injuryBodyPart,
        painRating: injuryPain,
        notes: injuryNotes || undefined,
        sessionExerciseIds: exerciseIds.map(String),
      });
      return res.json();
    },
    onSuccess: (data) => {
      setInjurySubmitted(true);
      setInjuryShouldRefer(data.shouldRefer);
    },
    onError: () => {
      toast({ title: "Could not save report", description: "Please try again.", variant: "destructive" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async ({ rating }: { rating: number }) => {
      const res = await apiRequest("POST", "/api/session/complete", {
        exerciseIds,
        rating,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/athlete/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/athlete/blueprint"] });
      queryClient.invalidateQueries({ queryKey: ["/api/athlete/achievements"] });
      if (data.newAchievements?.length) {
        setNewAchievements(data.newAchievements);
      }
    },
  });

  if (isLoading || !exercises) {
    return (
      <div className="min-h-screen bg-p2p-dark flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#FF6432] animate-spin mx-auto mb-3" />
          <p className="text-gray-400">Loading your session...</p>
        </div>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="min-h-screen bg-p2p-dark flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">No exercises found for this session.</p>
          <Button onClick={() => navigate("/athlete")} variant="outline" className="border-gray-700 text-gray-300">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const current = exercises[currentIndex];
  const progress = ((currentIndex + 1) / exercises.length) * 100;
  const isLast = currentIndex === exercises.length - 1;

  if (completed && newAchievements.length > 0) {
    return (
      <div className="min-h-screen bg-p2p-dark flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-24 h-24 bg-[#FF6432]/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Award className="w-12 h-12 text-[#FF6432]" />
          </div>
          <h2 className="font-heading text-3xl font-bold text-white mb-2">Achievement Unlocked!</h2>
          {newAchievements.map((a: any) => (
            <div key={a.id} className="bg-[#FF6432]/10 border border-[#FF6432]/30 rounded-xl p-4 mb-3">
              <p className="text-white font-semibold">{a.name}</p>
              <p className="text-gray-400 text-sm">{a.description}</p>
            </div>
          ))}
          <Button onClick={() => navigate("/athlete")} className="bg-[#FF6432] hover:bg-blue-700 text-white mt-4 w-full">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-p2p-dark flex items-center justify-center p-4">
        <div className="max-w-sm w-full">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-white mb-2">Session Complete</h2>
            <p className="text-gray-400 text-sm mb-6">
              {exercises.length} exercise{exercises.length !== 1 ? "s" : ""} completed. Great work!
            </p>

            <div className="mb-6">
              <p className="text-gray-400 text-sm mb-3">How did you feel?</p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-2xl transition-all ${rating >= star ? "text-yellow-400 scale-110" : "text-gray-600 hover:text-gray-400"}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={() => completeMutation.mutate({ rating })}
              disabled={completeMutation.isPending || rating === 0}
              className="w-full bg-[#FF6432] hover:bg-blue-700 text-white mb-3"
            >
              {completeMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</>
              ) : (
                "Mark Complete"
              )}
            </Button>
            {completeMutation.isSuccess && (
              <Button onClick={() => navigate("/athlete")} variant="outline" className="w-full border-gray-700 text-gray-300">
                Back to Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-p2p-dark flex flex-col">
      {/* Header */}
      <div className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/athlete")} className="p-1.5 text-gray-400 hover:text-white rounded-lg">
          <X className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <Progress value={progress} className="h-1.5 bg-gray-700" />
        </div>
        <span className="text-gray-400 text-xs shrink-0">
          {currentIndex + 1} / {exercises.length}
        </span>
        <button
          onClick={() => setShowInjuryModal(true)}
          className="px-2.5 py-1.5 bg-red-900/30 border border-red-500/40 text-red-400 text-xs rounded-lg flex items-center gap-1 hover:bg-red-900/50 transition-all"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Something's Wrong
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">
        {/* Exercise name and belt */}
        <div className="flex items-start justify-between mb-4 mt-2">
          <div>
            <h1 className="font-heading text-2xl font-bold text-white leading-tight">{current.name}</h1>
            <p className="text-gray-400 text-sm mt-1">{current.category}</p>
          </div>
          <Badge className={`shrink-0 ml-3 capitalize ${BELT_STYLES[current.beltLevel] || "bg-gray-700 text-gray-300"}`}>
            {current.beltLevel} belt
          </Badge>
        </div>

        {/* Video */}
        {current.videoUrl && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-4 aspect-video flex items-center justify-center">
            {current.videoUrl.includes("youtube") || current.videoUrl.includes("youtu.be") ? (
              <iframe
                src={current.videoUrl.replace("watch?v=", "embed/")}
                className="w-full h-full"
                allowFullScreen
              />
            ) : (
              <video
                src={current.videoUrl}
                controls
                className="w-full h-full object-contain"
              />
            )}
          </div>
        )}

        {/* Sets / Reps / Rest */}
        {(current.setsRange || current.repsRange || current.restPeriod) && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            {current.setsRange && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
                <p className="text-white font-bold text-lg">{current.setsRange}</p>
                <p className="text-gray-500 text-xs">Sets</p>
              </div>
            )}
            {current.repsRange && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
                <p className="text-white font-bold text-lg">{current.repsRange}</p>
                <p className="text-gray-500 text-xs">Reps</p>
              </div>
            )}
            {current.restPeriod && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
                <p className="text-white font-bold text-sm">{current.restPeriod}</p>
                <p className="text-gray-500 text-xs">Rest</p>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
          <p className="text-gray-300 text-sm leading-relaxed">{current.description}</p>
        </div>

        {/* Coaching Cues */}
        {current.coachingCues?.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
            <h3 className="text-white font-semibold text-sm mb-3">Coaching Cues</h3>
            <ul className="space-y-2">
              {current.coachingCues.map((cue, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
                  <div className="w-5 h-5 bg-[#FF6432]/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[#FF6432] text-xs font-bold">{i + 1}</span>
                  </div>
                  {cue}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Why It Works */}
        {(current.whyItWorks || current.programmingGuide) && (
          <div className="bg-[#FF6432]/10 border border-[#FF6432]/20 rounded-xl p-4 mb-6">
            <h3 className="text-[#FF6432] font-semibold text-xs uppercase tracking-wider mb-2">Why this works</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              {current.whyItWorks || current.programmingGuide}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="bg-gray-900/80 backdrop-blur-md border-t border-gray-800 p-4 flex gap-3">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="border-gray-700 text-gray-300 flex-1"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        {isLast ? (
          <Button
            onClick={() => setCompleted(true)}
            className="bg-green-600 hover:bg-green-700 text-white flex-1"
          >
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Finish Session
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentIndex(i => Math.min(exercises.length - 1, i + 1))}
            className="bg-[#FF6432] hover:bg-blue-700 text-white flex-1"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Injury Modal */}
      {showInjuryModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h3 className="text-white font-bold">Something's Wrong?</h3>
              <button onClick={() => { setShowInjuryModal(false); setInjurySubmitted(false); setInjuryBodyPart(""); setInjuryPain(0); setInjuryNotes(""); }} className="ml-auto text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {injurySubmitted ? (
              <div>
                <div className="bg-green-900/30 border border-green-500/40 rounded-xl p-4 mb-4">
                  <p className="text-green-300 text-sm font-medium mb-1">Report saved</p>
                  <p className="text-gray-400 text-xs">Your coaching team has been notified.</p>
                </div>
                {injuryShouldRefer && (
                  <div className="bg-red-900/30 border border-red-500/40 rounded-xl p-4 mb-4">
                    <p className="text-red-300 text-sm font-medium mb-1">Pain level is high</p>
                    <p className="text-gray-400 text-xs mb-3">We recommend stopping and seeing a Prepared to Play physiotherapist for an assessment.</p>
                    <a href="/find-clinic" className="block w-full py-2.5 bg-[#FF6432] hover:bg-blue-700 text-white text-sm font-semibold rounded-xl text-center transition-all">
                      Find a P2P Clinic
                    </a>
                  </div>
                )}
                <div className="space-y-2 mt-2">
                  <button onClick={() => { setShowInjuryModal(false); navigate("/athlete"); }} className="block w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-xl text-center">
                    End Session & Go Home
                  </button>
                  {!injuryShouldRefer && (
                    <button onClick={() => { setShowInjuryModal(false); setInjurySubmitted(false); }} className="block w-full py-2 text-gray-500 text-sm text-center">
                      Continue session
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-400 text-sm mb-4">Tell us what's happening so we can help.</p>

                <div className="mb-4">
                  <p className="text-gray-300 text-xs font-semibold mb-2 uppercase tracking-wider">Where does it hurt?</p>
                  <div className="grid grid-cols-3 gap-2">
                    {["Knee", "Ankle", "Hip", "Back", "Shoulder", "Hamstring", "Calf", "Groin", "Other"].map(part => (
                      <button
                        key={part}
                        onClick={() => setInjuryBodyPart(part.toLowerCase())}
                        className={`py-2 rounded-xl text-sm font-medium transition-all ${injuryBodyPart === part.toLowerCase() ? "bg-red-500/20 border border-red-500/60 text-red-300" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
                      >
                        {part}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-300 text-xs font-semibold mb-2 uppercase tracking-wider">Pain level (1–10)</p>
                  <div className="flex gap-1.5">
                    {[1,2,3,4,5,6,7,8,9,10].map(n => (
                      <button
                        key={n}
                        onClick={() => setInjuryPain(n)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${injuryPain >= n ? (n >= 6 ? "bg-red-500 text-white" : "bg-amber-500 text-white") : "bg-gray-800 text-gray-500"}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-300 text-xs font-semibold mb-2 uppercase tracking-wider">Notes (optional)</p>
                  <textarea
                    value={injuryNotes}
                    onChange={e => setInjuryNotes(e.target.value)}
                    placeholder="Describe what happened..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-gray-300 text-sm resize-none h-20 focus:outline-none focus:border-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => injuryMutation.mutate()}
                    disabled={!injuryBodyPart || !injuryPain || injuryMutation.isPending}
                    className="block w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl text-center transition-all"
                  >
                    {injuryMutation.isPending ? "Saving..." : "Submit Report"}
                  </button>
                  <button onClick={() => setShowInjuryModal(false)} className="block w-full py-2 text-gray-500 text-sm text-center">
                    I'm fine — continue
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
