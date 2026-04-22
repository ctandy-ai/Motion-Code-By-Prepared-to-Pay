import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Lock, Play, ArrowRight, Loader2, RefreshCw } from "lucide-react";

interface BlueprintExercise {
  id: number;
  name: string;
  description: string;
  beltLevel: string;
  setsRange?: string | null;
  repsRange?: string | null;
  restPeriod?: string | null;
  coachingCues: string[];
  whyItWorks?: string | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  isLocked: boolean;
}

interface BlueprintDay {
  dayOfWeek: string;
  dayIndex: number;
  isRestDay: boolean;
  pillar?: string;
  pillarLabel?: string;
  pillarColor?: string;
  pillarBg?: string;
  pillarBorder?: string;
  focus?: string;
  duration?: number;
  beltLevel?: string;
  exercises: BlueprintExercise[];
}

interface BlueprintResponse {
  blueprint: BlueprintDay[];
  whyItWorks: string;
  tier: string;
  belt: string;
}

const BELT_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  white: { label: "White Belt", bg: "bg-white/20", text: "text-white" },
  blue: { label: "Blue Belt", bg: "bg-blue-500/20", text: "text-blue-300" },
  black: { label: "Black Belt", bg: "bg-gray-700", text: "text-gray-200" },
};

export default function MovementBlueprint() {
  const { data, isLoading, error, refetch } = useQuery<BlueprintResponse>({
    queryKey: ["/api/athlete/blueprint"],
  });

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 mb-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#FF6432] animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Building your Movement Blueprint...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 mb-6 text-center">
        <p className="text-gray-400 text-sm mb-3">
          {error?.message?.includes("profile") 
            ? "Complete your athlete profile to generate your Movement Blueprint."
            : "Could not load your Movement Blueprint."}
        </p>
        <button onClick={() => refetch()} className="text-[#FF6432] text-sm hover:underline flex items-center gap-1 mx-auto">
          <RefreshCw className="w-3.5 h-3.5" />
          Try again
        </button>
      </div>
    );
  }

  const { blueprint, whyItWorks, tier, belt } = data;
  const beltStyle = BELT_STYLES[belt] || BELT_STYLES.white;
  const isStarter = tier === "starter";
  const sessionDays = blueprint.filter(d => !d.isRestDay);

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-heading text-2xl font-bold text-white">Your Movement Blueprint</h2>
          <p className="text-gray-400 text-sm mt-0.5">Personalised 7-day training plan for this week</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${beltStyle.bg} ${beltStyle.text}`}>
            {beltStyle.label}
          </span>
        </div>
      </div>

      {/* 7-day grid — horizontal scroll on mobile */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {blueprint.map((day) => (
          <div
            key={day.dayIndex}
            className="flex-shrink-0 w-[160px] sm:flex-1 sm:w-auto"
          >
            {day.isRestDay ? (
              <div className="h-full bg-gray-900/50 border border-gray-800 rounded-xl p-3 flex flex-col items-center justify-center text-center min-h-[140px]">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">{day.dayOfWeek}</p>
                <p className="text-gray-600 text-xs">Rest &<br />Recovery</p>
              </div>
            ) : (
              <div className={`h-full border rounded-xl p-3 flex flex-col min-h-[180px] ${day.pillarBg || "bg-white/5"} ${day.pillarBorder || "border-white/10"}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{day.dayOfWeek}</p>
                  {day.duration && (
                    <span className="text-xs text-gray-500">{day.duration}m</span>
                  )}
                </div>
                <p className={`text-xs font-semibold mb-2 leading-tight ${day.pillarColor || "text-white"}`}>
                  {day.pillarLabel}
                </p>

                {/* Exercise list */}
                <div className="flex-1 space-y-1.5">
                  {day.exercises.slice(0, 4).map((ex, idx) => (
                    <div key={ex.id} className="relative">
                      {ex.isLocked ? (
                        <div className="flex items-center gap-1.5 opacity-50">
                          <Lock className="w-3 h-3 text-gray-500 shrink-0" />
                          <span className="text-gray-500 text-xs truncate">{ex.name}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-current shrink-0" style={{ color: 'inherit' }} />
                          <span className="text-gray-300 text-xs truncate">{ex.name}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {day.exercises.length > 4 && (
                    <p className="text-gray-600 text-xs">+{day.exercises.length - 4} more</p>
                  )}
                </div>

                {/* Start button for unlocked sessions */}
                {!day.exercises.some(e => !e.isLocked) ? null : (
                  <Link href={`/session/${day.exercises.filter(e => !e.isLocked).map(e => e.id).join(",")}`}>
                    <button className={`mt-2 w-full py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-all ${day.pillarBg} border ${day.pillarBorder} ${day.pillarColor} hover:opacity-80`}>
                      <Play className="w-3 h-3" />
                      Start
                    </button>
                  </Link>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Starter upgrade prompt */}
      {isStarter && (
        <div className="mt-4 bg-[#FF6432]/10 border border-[#FF6432]/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-white font-semibold text-sm mb-0.5">Your full program is ready</p>
            <p className="text-gray-400 text-xs">
              {sessionDays.reduce((sum, d) => sum + d.exercises.filter(e => e.isLocked).length, 0)} exercises are locked. 
              Unlock all for $79 — less than one physio session.
            </p>
          </div>
          <Link href="/upgrade">
            <button className="shrink-0 px-4 py-2 bg-[#FF6432] hover:bg-blue-700 text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-all">
              Unlock Season Pass
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      )}

      {/* Why This Works */}
      {whyItWorks && (
        <div className="mt-4 bg-gray-900/60 border border-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Why this works for you</p>
          <p className="text-gray-300 text-sm leading-relaxed">{whyItWorks}</p>
        </div>
      )}
    </div>
  );
}
