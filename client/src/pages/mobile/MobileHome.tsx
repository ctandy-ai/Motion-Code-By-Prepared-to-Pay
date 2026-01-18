import { useQuery } from "@tanstack/react-query";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dumbbell, 
  Heart, 
  Trophy, 
  Flame, 
  ChevronRight, 
  Bell,
  Calendar,
  TrendingUp,
  Zap,
  MessageCircle
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import type { Athlete, ReadinessSurvey, WorkoutLog, Notification } from "@shared/schema";

export default function MobileHome() {
  const { user, isLoading: authLoading } = useAuth();

  const { data: athleteData } = useQuery<{ athlete: Athlete; stats: any }>({
    queryKey: ["/api/mobile/athlete/me"],
    enabled: !!user,
  });

  const { data: todayWorkout } = useQuery({
    queryKey: ["/api/mobile/athlete/today-workout"],
    enabled: !!user,
  });

  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ["/api/mobile/athlete/notifications"],
    enabled: !!user,
  });

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  if (authLoading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </MobileLayout>
    );
  }

  if (!user) {
    return (
      <MobileLayout hideNav>
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center mb-6">
            <Dumbbell className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">MotionCode Pro</h1>
          <p className="text-slate-400 mb-8">Your elite training companion</p>
          <Button asChild size="lg" className="w-full max-w-xs" data-testid="button-login">
            <a href="/api/login?returnTo=/m">Sign In to Continue</a>
          </Button>
        </div>
      </MobileLayout>
    );
  }

  const athlete = athleteData?.athlete;
  const stats = athleteData?.stats;
  const greeting = getGreeting();

  return (
    <MobileLayout>
      <div className="p-4 space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-primary/30">
              <AvatarImage src={user.profileImageUrl || undefined} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {user.firstName?.charAt(0) || user.email?.charAt(0) || "A"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-slate-400">{greeting}</p>
              <h1 className="text-lg font-semibold" data-testid="text-user-name">
                {user.firstName || athlete?.name || "Athlete"}
              </h1>
            </div>
          </div>
          <Link href="/m/notifications">
            <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </Link>
        </header>

        <Card className="bg-gradient-to-br from-primary/20 to-teal-500/20 border-0 overflow-hidden" data-testid="card-today-workout">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Today's Session</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </Badge>
            </div>
            {todayWorkout ? (
              <Link href="/m/workout">
                <Button className="w-full justify-between group" size="lg" data-testid="button-start-workout">
                  <span className="flex items-center gap-2">
                    <Dumbbell className="w-5 h-5" />
                    Start Workout
                  </span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            ) : (
              <div className="text-center py-4">
                <p className="text-slate-400 text-sm">No workout scheduled for today</p>
                <p className="text-xs text-slate-500 mt-1">Rest day or check with your coach</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Link href="/m/wellness">
            <Card className="bglass border-0 hover-elevate cursor-pointer" data-testid="card-wellness">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Daily</p>
                    <p className="font-semibold text-sm">Wellness</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/m/progress">
            <Card className="bglass border-0 hover-elevate cursor-pointer" data-testid="card-progress">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Your</p>
                    <p className="font-semibold text-sm">Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Quick Stats
          </h2>
          <div className="grid grid-cols-3 gap-2">
            <Card className="bglass border-0">
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center mb-1">
                  <Flame className="w-4 h-4 text-orange-400" />
                </div>
                <p className="text-xl font-bold">{stats?.streak || 0}</p>
                <p className="text-[10px] text-slate-500 uppercase">Day Streak</p>
              </CardContent>
            </Card>
            <Card className="bglass border-0">
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center mb-1">
                  <Dumbbell className="w-4 h-4 text-primary" />
                </div>
                <p className="text-xl font-bold">{stats?.workoutsThisWeek || 0}</p>
                <p className="text-[10px] text-slate-500 uppercase">This Week</p>
              </CardContent>
            </Card>
            <Card className="bglass border-0">
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center mb-1">
                  <Zap className="w-4 h-4 text-yellow-400" />
                </div>
                <p className="text-xl font-bold">{stats?.totalPRs || 0}</p>
                <p className="text-[10px] text-slate-500 uppercase">Total PRs</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Link href="/m/messages">
          <Card className="bglass border-0 hover-elevate cursor-pointer" data-testid="card-messages">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Coach Messages</p>
                  <p className="text-xs text-slate-400">Stay connected with your coach</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </MobileLayout>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
