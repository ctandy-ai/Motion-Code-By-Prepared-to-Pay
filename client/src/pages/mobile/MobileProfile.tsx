import { useQuery } from "@tanstack/react-query";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  LogOut, 
  Settings, 
  Trophy, 
  Dumbbell, 
  Flame,
  Calendar,
  ChevronRight,
  Shield,
  Award,
  TrendingUp,
  Target
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import type { Athlete, AthleteBeltClassification } from "@shared/schema";

export default function MobileProfile() {
  const { user, logout, isLoggingOut } = useAuth();

  const { data: athleteData } = useQuery<{ athlete: Athlete; stats: any }>({
    queryKey: ["/api/mobile/athlete/me"],
    enabled: !!user,
  });

  const { data: beltClassification } = useQuery<AthleteBeltClassification>({
    queryKey: ["/api/mobile/athlete/belt"],
    enabled: !!user,
  });

  const athlete = athleteData?.athlete;
  const stats = athleteData?.stats || {};

  const getBeltColor = (belt: string | undefined) => {
    switch (belt) {
      case "WHITE": return "bg-slate-200 text-slate-800";
      case "BLUE": return "bg-primary/90 text-primary-foreground";
      case "BLACK": return "bg-slate-900 text-slate-100 border border-amber-500";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getBeltIcon = (belt: string | undefined) => {
    switch (belt) {
      case "WHITE": return <Shield className="w-4 h-4" />;
      case "BLUE": return <Award className="w-4 h-4" />;
      case "BLACK": return <Trophy className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <MobileLayout>
      <div className="p-4 space-y-6">
        <header className="text-center pt-4">
          <Avatar className="h-24 w-24 mx-auto ring-4 ring-primary/30 mb-4">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-2xl">
              {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "A"}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-xl font-bold" data-testid="text-profile-name">
            {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-sm text-slate-400">{athlete?.team || "Athlete"}</p>
          {athlete?.position && (
            <Badge variant="secondary" className="mt-2">{athlete.position}</Badge>
          )}
        </header>

        {beltClassification && (
          <Card className="bglass border-0" data-testid="card-belt">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl ${getBeltColor(beltClassification.belt)} flex items-center justify-center`}>
                    {getBeltIcon(beltClassification.belt)}
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Current Belt</p>
                    <p className="font-bold">{beltClassification.belt} BELT</p>
                  </div>
                </div>
                <Badge variant="outline">{beltClassification.confidence}% confidence</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Card className="bglass border-0">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center mx-auto mb-2">
                <Flame className="w-5 h-5 text-orange-400" />
              </div>
              <p className="text-2xl font-bold">{stats.streak || 0}</p>
              <p className="text-xs text-slate-500">Day Streak</p>
            </CardContent>
          </Card>
          <Card className="bglass border-0">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center mx-auto mb-2">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-2xl font-bold">{stats.totalPRs || 0}</p>
              <p className="text-xs text-slate-500">Total PRs</p>
            </CardContent>
          </Card>
          <Card className="bglass border-0">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-2">
                <Dumbbell className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl font-bold">{stats.totalWorkouts || 0}</p>
              <p className="text-xs text-slate-500">Workouts</p>
            </CardContent>
          </Card>
          <Card className="bglass border-0">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-5 h-5 text-teal-400" />
              </div>
              <p className="text-2xl font-bold">{stats.level || 1}</p>
              <p className="text-xs text-slate-500">Level</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-2">
          <Link href="/m/progress">
            <Card className="bglass border-0 hover-elevate cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-primary" />
                  <span className="font-medium">View Progress</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/m/settings">
            <Card className="bglass border-0 hover-elevate cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-slate-400" />
                  <span className="font-medium">Settings</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </CardContent>
            </Card>
          </Link>
        </div>

        <Button 
          variant="outline" 
          className="w-full text-red-400 border-red-400/30 hover:bg-red-400/10"
          onClick={() => logout()}
          disabled={isLoggingOut}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {isLoggingOut ? "Signing out..." : "Sign Out"}
        </Button>
      </div>
    </MobileLayout>
  );
}
