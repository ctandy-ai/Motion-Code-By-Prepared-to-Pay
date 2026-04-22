import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import MovementBlueprint from "@/components/movement-blueprint";
import { TrialBanner } from "@/components/trial-banner";
import { LockedContent } from "@/components/locked-content";
import { 
  Flame, 
  Target, 
  Shield, 
  Award, 
  Trophy, 
  Zap, 
  Play, 
  MapPin, 
  Users, 
  ChevronRight,
  Lock,
  CheckCircle2,
  BookOpen
} from "lucide-react";

interface AthleteProgress {
  readinessScore: number;
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  weeklyCompleted: number;
  weeklyTarget: number;
  weekDays: boolean[];
  currentBelt: string;
  beltProgress: number;
}

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  criteria: string;
  criteriaValue: number;
  tier: string;
  sortOrder: number;
  isActive: boolean;
}

interface UserAchievement {
  id: number;
  userId: string;
  achievementId: number;
  earnedAt: string;
  achievement: Achievement;
}

const ICON_MAP: Record<string, any> = {
  trophy: Trophy,
  flame: Flame,
  target: Target,
  shield: Shield,
  award: Award,
  zap: Zap,
  play: Play,
  "check-circle": CheckCircle2,
  users: Users,
  "book-open": BookOpen,
};

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

function getScoreStroke(score: number): string {
  if (score >= 80) return "#4ade80";
  if (score >= 50) return "#fbbf24";
  return "#f87171";
}

function getScoreBg(score: number): string {
  if (score >= 80) return "from-green-500/20 to-green-600/5";
  if (score >= 50) return "from-amber-500/20 to-amber-600/5";
  return "from-red-500/20 to-red-600/5";
}

function CircularProgress({ score, size = 180 }: { score: number; size?: number }) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const center = size / 2;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={getScoreStroke(score)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-bold ${getScoreColor(score)}`}>
          {score}%
        </span>
        <span className="text-xs text-gray-400 mt-1">Season Readiness</span>
      </div>
    </div>
  );
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const BELT_CONFIG = [
  { key: "white", label: "White", color: "bg-gray-200", textColor: "text-gray-800", borderColor: "border-gray-300" },
  { key: "blue", label: "Blue", color: "bg-blue-500", textColor: "text-white", borderColor: "border-blue-400" },
  { key: "black", label: "Black", color: "bg-gray-900", textColor: "text-white", borderColor: "border-gray-600" },
];

export default function AthleteDashboard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const { data: progress, isLoading: progressLoading } = useQuery<AthleteProgress>({
    queryKey: ["/api/athlete/progress"],
  });

  const { data: allAchievements, isLoading: achievementsLoading } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements"],
  });

  const { data: earnedAchievements } = useQuery<UserAchievement[]>({
    queryKey: ["/api/athlete/achievements"],
  });

  const earnedIds = new Set(earnedAchievements?.map((ea) => ea.achievementId) || []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="flex min-h-screen bg-p2p-dark">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TrialBanner />
        <div className="flex-1 overflow-y-auto p-4 pt-20 md:pt-6 md:p-10">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">{greeting()}</p>
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-white">
                {user?.firstName || "Athlete"}
              </h1>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-full">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="font-bold text-orange-500">{progress?.currentStreak || 0}</span>
              <span className="text-sm text-gray-400">day streak</span>
            </div>
          </div>

          {/* Movement Blueprint — Hero section */}
          <LockedContent requiredTier="season_pass" label="Movement Blueprint — personalised 7-day training plan">
            <MovementBlueprint />
          </LockedContent>

          {progressLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-72 bg-gray-800 rounded-2xl" />
              <Skeleton className="h-72 bg-gray-800 rounded-2xl" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className={`bg-gradient-to-br ${getScoreBg(progress?.readinessScore || 0)} border-gray-800 rounded-2xl`}>
                  <CardContent className="p-6 flex flex-col items-center">
                    <CircularProgress score={progress?.readinessScore || 0} />
                    <div className="grid grid-cols-3 gap-4 mt-6 w-full">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Flame className="w-4 h-4 text-orange-500" />
                          <span className="font-bold text-white">{progress?.currentStreak || 0}</span>
                        </div>
                        <span className="text-xs text-gray-400">Streak</span>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                          <span className="font-bold text-white">{progress?.totalSessions || 0}</span>
                        </div>
                        <span className="text-xs text-gray-400">Total</span>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Shield className="w-4 h-4 text-p2p-electric" />
                          <span className="font-bold text-white capitalize">{progress?.currentBelt || "white"}</span>
                        </div>
                        <span className="text-xs text-gray-400">Belt</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800 rounded-2xl">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="font-heading text-lg font-bold text-white">This Week</h2>
                        <Badge variant="outline" className="text-gray-400 border-gray-700">
                          {progress?.weeklyCompleted || 0} / {progress?.weeklyTarget || 3} sessions
                        </Badge>
                      </div>
                      <div className="grid grid-cols-7 gap-2">
                        {DAY_LABELS.map((day, i) => {
                          const completed = progress?.weekDays?.[i] || false;
                          const now = new Date();
                          const currentDayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
                          const isToday = i === currentDayIndex;

                          return (
                            <div key={i} className="flex flex-col items-center gap-1.5">
                              <span className={`text-xs font-medium ${isToday ? "text-p2p-electric" : "text-gray-500"}`}>
                                {day}
                              </span>
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all
                                  ${completed
                                    ? "bg-green-500/20 border-2 border-green-500"
                                    : isToday
                                      ? "bg-p2p-electric/10 border-2 border-p2p-electric/50"
                                      : "bg-gray-800/50 border border-gray-700"
                                  }`}
                              >
                                {completed && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800 rounded-2xl">
                    <CardContent className="p-6">
                      <h2 className="font-heading text-lg font-bold text-white mb-4">Belt Progression</h2>
                      <div className="flex items-center gap-3 mb-3">
                        {BELT_CONFIG.map((belt, i) => {
                          const isActive = progress?.currentBelt === belt.key;
                          const beltIndex = BELT_CONFIG.findIndex(b => b.key === progress?.currentBelt);
                          const isPast = i < beltIndex;

                          return (
                            <div key={belt.key} className="flex-1 flex flex-col items-center gap-1.5">
                              <div
                                className={`w-full h-3 rounded-full ${
                                  isPast
                                    ? belt.color
                                    : isActive
                                      ? belt.color
                                      : "bg-gray-800"
                                } ${isActive ? `border-2 ${belt.borderColor}` : ""}`}
                                style={isActive ? { 
                                  background: `linear-gradient(90deg, ${belt.key === 'white' ? '#e5e7eb' : belt.key === 'blue' ? '#3b82f6' : '#1f2937'} ${progress?.beltProgress || 0}%, rgba(50,50,50,0.5) ${progress?.beltProgress || 0}%)`
                                } : undefined}
                              />
                              <span className={`text-xs font-medium ${isActive ? "text-white" : isPast ? "text-gray-400" : "text-gray-600"}`}>
                                {belt.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                          {progress?.beltProgress || 0}% to {progress?.currentBelt === "black" ? "mastery" : progress?.currentBelt === "blue" ? "Black belt" : "Blue belt"}
                        </span>
                        <Badge className={`capitalize ${
                          progress?.currentBelt === "black" ? "bg-gray-800 text-white" :
                          progress?.currentBelt === "blue" ? "bg-blue-500/20 text-blue-400" :
                          "bg-gray-200/10 text-gray-300"
                        }`}>
                          {progress?.currentBelt || "white"} belt
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate("/sessions")}
              className="bg-gradient-to-br from-p2p-blue/20 to-p2p-electric/10 border border-p2p-electric/30 rounded-2xl p-5 text-left hover:border-p2p-electric/60 transition-all group"
              data-testid="button-start-session"
            >
              <div className="w-10 h-10 rounded-full bg-p2p-electric/20 flex items-center justify-center mb-3 group-hover:bg-p2p-electric/30 transition-colors">
                <Play className="w-5 h-5 text-p2p-electric" />
              </div>
              <h3 className="font-semibold text-white text-sm mb-0.5">Start Session</h3>
              <p className="text-xs text-gray-400">Today's training</p>
            </button>

            <button
              onClick={() => navigate("/exercises")}
              className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-5 text-left hover:border-gray-700 transition-all group"
              data-testid="link-exercises"
            >
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center mb-3 group-hover:bg-yellow-500/20 transition-colors">
                <Trophy className="w-5 h-5 text-yellow-500" />
              </div>
              <h3 className="font-semibold text-white text-sm mb-0.5">Exercises</h3>
              <p className="text-xs text-gray-400">Movement library</p>
            </button>

            <button
              onClick={() => navigate("/find-clinic")}
              className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-5 text-left hover:border-gray-700 transition-all group"
              data-testid="link-find-clinic"
            >
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mb-3 group-hover:bg-red-500/20 transition-colors">
                <MapPin className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="font-semibold text-white text-sm mb-0.5">Find Clinic</h3>
              <p className="text-xs text-gray-400">Get assessed</p>
            </button>

            <button
              onClick={() => navigate("/community")}
              className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-5 text-left hover:border-gray-700 transition-all group"
              data-testid="link-community"
            >
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center mb-3 group-hover:bg-purple-500/20 transition-colors">
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              <h3 className="font-semibold text-white text-sm mb-0.5">Community</h3>
              <p className="text-xs text-gray-400">Connect & share</p>
            </button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl font-bold text-white">Achievements</h2>
              <span className="text-sm text-gray-400">
                {earnedIds.size} / {allAchievements?.length || 0} earned
              </span>
            </div>
            {achievementsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-32 bg-gray-800 rounded-2xl" />
                ))}
              </div>
            ) : allAchievements && allAchievements.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {allAchievements.map((achievement) => {
                  const isEarned = earnedIds.has(achievement.id);
                  const IconComponent = ICON_MAP[achievement.icon] || Award;

                  return (
                    <Card
                      key={achievement.id}
                      className={`rounded-2xl transition-all ${
                        isEarned
                          ? "bg-gradient-to-br from-p2p-blue/15 to-p2p-electric/5 border-p2p-electric/30"
                          : "bg-gray-900/50 border-gray-800 opacity-50"
                      }`}
                    >
                      <CardContent className="p-4 flex flex-col items-center text-center">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                            isEarned ? "bg-p2p-electric/20" : "bg-gray-800"
                          }`}
                        >
                          {isEarned ? (
                            <IconComponent className="w-6 h-6 text-p2p-electric" />
                          ) : (
                            <Lock className="w-5 h-5 text-gray-600" />
                          )}
                        </div>
                        <h3 className={`text-sm font-semibold mb-0.5 ${isEarned ? "text-white" : "text-gray-500"}`}>
                          {achievement.name}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-2">{achievement.description}</p>
                        <Badge
                          variant="outline"
                          className={`mt-2 text-[10px] ${
                            isEarned ? "border-p2p-electric/30 text-p2p-electric" : "border-gray-700 text-gray-600"
                          }`}
                        >
                          {achievement.category}
                        </Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-gray-900/50 border-gray-800 rounded-2xl">
                <CardContent className="p-8 text-center">
                  <Award className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Complete sessions to unlock achievements</p>
                </CardContent>
              </Card>
            )}
          </div>

          <button
            onClick={() => navigate("/education")}
            className="w-full bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-500/30 rounded-2xl p-6 text-left hover:border-purple-500/50 transition-all"
            data-testid="link-education"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading text-lg font-bold text-white mb-1">
                  Why ACL Prevention Matters
                </h3>
                <p className="text-sm text-gray-400">
                  Learn how these exercises keep you on the court
                </p>
              </div>
              <ChevronRight className="w-6 h-6 text-purple-400" />
            </div>
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
