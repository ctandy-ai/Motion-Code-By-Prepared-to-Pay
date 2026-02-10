import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Athlete, PersonalRecord, AthleteProgram, Program, Exercise } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  Flame, 
  Trophy, 
  Zap, 
  Target, 
  Calendar,
  TrendingUp,
  Dumbbell,
  Medal,
  Star,
  Settings,
  ChevronRight,
  Edit,
  ClipboardList,
  MessageSquare,
  Heart
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AthleteStats {
  athleteId: string;
  totalWorkouts: number;
  totalSets: number;
  totalPRs: number;
  xp: number;
  level: number;
}

const BELT_COLORS = {
  white: { bg: "bg-slate-200", border: "border-slate-300", text: "text-slate-700", glow: "shadow-slate-200/50" },
  blue: { bg: "bg-blue-500", border: "border-blue-400", text: "text-blue-100", glow: "shadow-blue-500/50" },
  black: { bg: "bg-slate-900", border: "border-slate-700", text: "text-slate-100", glow: "shadow-slate-900/50" },
};

function BeltProgressRing({ level, xp }: { level: number; xp: number }) {
  const xpForNextLevel = Math.pow((level + 1) - 1, 2) * 100;
  const xpForCurrentLevel = Math.pow(level - 1, 2) * 100;
  const progressInLevel = xp - xpForCurrentLevel;
  const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel;
  const progressPercent = Math.min((progressInLevel / xpNeededForLevel) * 100, 100);
  
  const beltLevel = level <= 10 ? "white" : level <= 25 ? "blue" : "black";
  const beltStyle = BELT_COLORS[beltLevel];
  
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-ink-3"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(200, 95%, 50%)" />
            <stop offset="100%" stopColor="hsl(175, 70%, 50%)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-display font-bold text-slate-100">{level}</span>
        <span className="text-xs text-slate-400 uppercase tracking-wider">Level</span>
      </div>
      <div className={`absolute -bottom-1 px-3 py-0.5 rounded-full text-xs font-semibold ${beltStyle.bg} ${beltStyle.text} ${beltStyle.border} border shadow-lg ${beltStyle.glow}`}>
        {beltLevel.toUpperCase()} BELT
      </div>
    </div>
  );
}

function XPBar({ xp, level }: { xp: number; level: number }) {
  const xpForNextLevel = Math.pow((level + 1) - 1, 2) * 100;
  const xpForCurrentLevel = Math.pow(level - 1, 2) * 100;
  const progressInLevel = xp - xpForCurrentLevel;
  const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel;
  const progressPercent = Math.min((progressInLevel / xpNeededForLevel) * 100, 100);

  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-400">XP Progress</span>
        <span className="font-display text-slate-300">{progressInLevel.toLocaleString()} / {xpNeededForLevel.toLocaleString()}</span>
      </div>
      <div className="h-2 bg-ink-3 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full bg-gradient-to-r from-[hsl(200,95%,50%)] to-[hsl(175,70%,50%)] transition-all duration-1000 ease-out relative"
          style={{ width: `${progressPercent}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function StreakCounter({ workouts }: { workouts: number }) {
  const streak = Math.min(workouts, 30);
  const isHot = streak >= 7;
  
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${isHot ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30' : 'bg-ink-3/50'}`}>
      <Flame className={`w-5 h-5 ${isHot ? 'text-orange-400 animate-pulse' : 'text-slate-500'}`} />
      <span className={`font-display font-bold text-lg ${isHot ? 'text-orange-300' : 'text-slate-400'}`}>{streak}</span>
      <span className="text-xs text-slate-500 uppercase">Day Streak</span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, suffix, color }: { 
  icon: any; 
  label: string; 
  value: number; 
  suffix?: string;
  color: string;
}) {
  return (
    <Card className="border-0 hover-elevate group">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="font-display text-2xl font-bold text-slate-100">
            {value.toLocaleString()}{suffix && <span className="text-sm text-slate-400 ml-1">{suffix}</span>}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function PRShowcase({ prs, exercises }: { prs: PersonalRecord[]; exercises: Exercise[] }) {
  const recentPRs = prs.slice(0, 4);
  
  const getExerciseName = (exerciseId: string) => {
    const exercise = exercises.find(e => e.id === exerciseId);
    return exercise?.name || 'Unknown Exercise';
  };
  
  if (recentPRs.length === 0) {
    return (
      <Card className="border-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="w-5 h-5 text-amber-400" />
            Personal Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500">No PRs yet. Keep training!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="w-5 h-5 text-amber-400" />
          Personal Records
          <Badge variant="secondary" className="ml-auto">{prs.length} Total</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-ink-3">
          {recentPRs.map((pr, index) => (
            <div 
              key={pr.id} 
              className="flex items-center gap-4 p-4 hover:bg-ink-3/30 transition-colors"
              data-testid={`pr-item-${pr.id}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500' :
                'bg-gradient-to-br from-amber-600 to-amber-800'
              }`}>
                <Medal className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-100 truncate">{getExerciseName(pr.exerciseId)}</p>
                <p className="text-xs text-slate-500">
                  {pr.achievedAt ? new Date(pr.achievedAt).toLocaleDateString() : 'Recently'}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
                  {pr.maxWeight}kg
                </p>
                <p className="text-xs text-slate-500">{pr.reps} rep{pr.reps !== 1 ? 's' : ''}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TodaysWorkout({ programs, allPrograms }: { programs: AthleteProgram[]; allPrograms: Program[] }) {
  const activePrograms = programs.filter(p => p.status === 'active');
  
  if (activePrograms.length === 0) {
    return (
      <Card className="border-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Dumbbell className="w-5 h-5 text-primary" />
            Today's Training
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 mb-4">No active program assigned</p>
            <p className="text-xs text-slate-600">Ask your coach to assign a training program</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Dumbbell className="w-5 h-5 text-primary" />
          Active Programs
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-ink-3">
          {activePrograms.map((ap) => {
            const program = allPrograms.find(p => p.id === ap.programId);
            const startDate = new Date(ap.startDate);
            const weeksIn = Math.floor((Date.now() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
            
            return (
              <div 
                key={ap.id} 
                className="p-4 hover:bg-ink-3/30 transition-colors cursor-pointer group"
                data-testid={`active-program-${ap.id}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-100 group-hover:text-primary transition-colors">
                    {program?.name || 'Unknown Program'}
                  </h4>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-primary transition-colors" />
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Week {weeksIn} of {program?.duration || '?'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {program?.duration || 0} weeks total
                  </span>
                </div>
                <div className="mt-3 h-1.5 bg-ink-3 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                    style={{ width: `${Math.min((weeksIn / (program?.duration || 1)) * 100, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AthletePortal() {
  const { athleteId } = useParams<{ athleteId: string }>();
  const [, setLocation] = useLocation();

  const { data: athlete, isLoading: loadingAthlete } = useQuery<Athlete>({
    queryKey: ["/api/athletes", athleteId],
    queryFn: async () => {
      const response = await fetch(`/api/athletes/${athleteId}`);
      if (!response.ok) throw new Error("Failed to fetch athlete");
      return response.json();
    },
  });

  const { data: stats } = useQuery<AthleteStats>({
    queryKey: ["/api/athletes", athleteId, "stats"],
    queryFn: async () => {
      const response = await fetch(`/api/athletes/${athleteId}/stats`);
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
    enabled: !!athleteId,
  });

  const { data: prs = [] } = useQuery<PersonalRecord[]>({
    queryKey: ["/api/personal-records", athleteId],
    queryFn: async () => {
      const response = await fetch(`/api/personal-records?athleteId=${athleteId}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!athleteId,
  });

  const { data: athletePrograms = [] } = useQuery<AthleteProgram[]>({
    queryKey: ["/api/athletes", athleteId, "programs"],
    queryFn: async () => {
      const response = await fetch(`/api/athletes/${athleteId}/programs`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!athleteId,
  });

  const { data: allPrograms = [] } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });

  const { data: exercises = [] } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });

  if (loadingAthlete) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/30 rounded-full animate-spin border-t-primary" />
          <Zap className="absolute inset-0 m-auto w-6 h-6 text-primary animate-pulse" />
        </div>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
        <div className="w-20 h-20 rounded-full bg-ink-3 flex items-center justify-center">
          <Target className="w-10 h-10 text-slate-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-300">Athlete not found</h2>
        <Button onClick={() => setLocation("/athletes")} data-testid="button-back-to-athletes">
          Back to Athletes
        </Button>
      </div>
    );
  }

  const initials = athlete.name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/athletes")}
          data-testid="button-back"
          className="hover-elevate"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span className="text-sm text-slate-500">Athlete Portal</span>
      </div>

      <Card className="border-0 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <CardContent className="relative p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <Avatar className="w-24 h-24 border-4 border-ink-3 shadow-xl">
              <AvatarImage src={athlete.avatarUrl || undefined} alt={athlete.name} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-heading font-bold text-slate-100 mb-1" data-testid="text-athlete-name">
                {athlete.name}
              </h1>
              <p className="text-slate-400 mb-3">
                {athlete.team && athlete.position 
                  ? `${athlete.team} • ${athlete.position}` 
                  : athlete.team || athlete.position || 'Elite Athlete'}
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <Badge variant="secondary" className="bg-ink-3">
                  <Star className="w-3 h-3 mr-1" />
                  {athlete.status || 'Active'}
                </Badge>
                {athlete.team && (
                  <Badge variant="outline" className="border-primary/30 text-primary">
                    {athlete.team}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <BeltProgressRing level={stats?.level || 1} xp={stats?.xp || 0} />
              <div className="w-48">
                <XPBar xp={stats?.xp || 0} level={stats?.level || 1} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <StreakCounter workouts={stats?.totalWorkouts || 0} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="hover-elevate" data-testid="button-coach-menu">
              <Settings className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Coach Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => setLocation(`/athletes/${athleteId}`)}
              data-testid="menu-manage-programs"
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              Manage Programs
            </DropdownMenuItem>
            <DropdownMenuItem data-testid="menu-edit-athlete">
              <Edit className="w-4 h-4 mr-2" />
              Edit Athlete
            </DropdownMenuItem>
            <DropdownMenuItem data-testid="menu-add-note">
              <MessageSquare className="w-4 h-4 mr-2" />
              Add Coach Note
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          icon={Dumbbell} 
          label="Workouts" 
          value={stats?.totalWorkouts || 0}
          color="bg-gradient-to-br from-primary to-blue-600"
        />
        <StatCard 
          icon={Target} 
          label="Total Sets" 
          value={stats?.totalSets || 0}
          color="bg-gradient-to-br from-accent to-teal-600"
        />
        <StatCard 
          icon={Trophy} 
          label="PRs Achieved" 
          value={stats?.totalPRs || 0}
          color="bg-gradient-to-br from-amber-500 to-orange-600"
        />
        <StatCard 
          icon={Zap} 
          label="Total XP" 
          value={stats?.xp || 0}
          color="bg-gradient-to-br from-purple-500 to-pink-600"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <TodaysWorkout programs={athletePrograms} allPrograms={allPrograms} />
        <PRShowcase prs={prs} exercises={exercises} />
      </div>

      <Card className="border-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button 
              variant="default" 
              className="h-auto py-4 flex-col gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
              onClick={() => setLocation(`/athlete/${athleteId}/log-workout`)}
              data-testid="button-log-workout"
            >
              <Dumbbell className="w-6 h-6 text-white" />
              <span className="text-xs text-white font-medium">Log Workout</span>
            </Button>
            <Button 
              variant="default" 
              className="h-auto py-4 flex-col gap-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:opacity-90"
              onClick={() => setLocation(`/athlete/${athleteId}/wellness`)}
              data-testid="button-wellness-check"
            >
              <Heart className="w-6 h-6 text-white" />
              <span className="text-xs text-white font-medium">Wellness Check</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2 hover-elevate"
              onClick={() => setLocation("/progress")}
              data-testid="button-view-progress"
            >
              <TrendingUp className="w-6 h-6 text-green-400" />
              <span className="text-xs">View Progress</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2 hover-elevate"
              onClick={() => setLocation("/calendar")}
              data-testid="button-calendar"
            >
              <Calendar className="w-6 h-6 text-accent" />
              <span className="text-xs">Calendar</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
