import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ChevronRight, Trophy, Shield, Target, Zap, Clock, CheckCircle, Lock } from "lucide-react";

type MicroSession = {
  id: number;
  name: string;
  description: string | null;
  duration: number;
  sessionType: string | null;
  targetArea: string | null;
  difficulty: string | null;
  sport: string | null;
  phase: string | null;
  isNetballProgram: boolean | null;
  weekNumber: number | null;
  dayOfWeek: number | null;
};

const PROGRAM_WEEKS = [
  { week: 1, title: "Foundation Week", focus: "Landing Fundamentals", description: "Master the basics of safe landing and knee control" },
  { week: 2, title: "Balance & Stability", focus: "Single-Leg Control", description: "Build unilateral strength for court movements" },
  { week: 3, title: "Deceleration", focus: "Stopping Safely", description: "Learn to absorb force when stopping quickly" },
  { week: 4, title: "Power Introduction", focus: "Jump Training", description: "Begin progressive plyometric development" },
  { week: 5, title: "Reactive Strength", focus: "Quick Contacts", description: "Develop elastic spring for faster movements" },
  { week: 6, title: "Direction Change", focus: "Cutting Mechanics", description: "Safe movement pattern for changing direction" },
  { week: 7, title: "Integration", focus: "Combined Skills", description: "Link movements into game-like sequences" },
  { week: 8, title: "Pre-Season Ready", focus: "Testing Week", description: "Complete readiness assessment" },
];

export default function NetballPathway() {
  const [, navigate] = useLocation();
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  const { data: user } = useQuery<{ id: string; firstName: string | null; role: string }>({
    queryKey: ["/api/auth/user"],
  });

  const { data: sessions = [] } = useQuery<MicroSession[]>({
    queryKey: ["/api/sessions", { isNetballProgram: true }],
  });

  const completedWeeks = 2;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-slate-900">
      <header className="bg-blue-900/50 border-b border-blue-700/50 sticky top-0 z-50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/athlete-dashboard")}
              className="text-white hover:bg-blue-800"
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">Netball Preseason Ready</h1>
                <Badge variant="outline" className="border-yellow-500 text-yellow-400 text-xs">
                  OFFICIAL PROGRAM
                </Badge>
              </div>
              <p className="text-sm text-blue-200">8-Week ACL Prevention Pathway</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <img 
              src="https://www.netball.com.au/sites/default/files/2024-04/Primary%20Logo.png" 
              alt="Netball Australia" 
              className="h-10 object-contain opacity-80"
              data-testid="img-netball-logo"
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 mb-6 text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Trophy className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Your Progress</h2>
                <p className="text-blue-100">Week {completedWeeks} of 8 Complete</p>
              </div>
            </div>
            <Progress value={(completedWeeks / 8) * 100} className="h-3 bg-white/20" />
            <div className="flex justify-between mt-2 text-sm text-blue-100">
              <span>Foundation</span>
              <span>Pre-Season Ready</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/10 border-white/20 text-white text-center p-4">
            <Shield className="h-6 w-6 mx-auto mb-2 text-green-400" />
            <div className="text-2xl font-bold">73%</div>
            <div className="text-xs text-blue-200">Injury Risk Reduction</div>
          </Card>
          <Card className="bg-white/10 border-white/20 text-white text-center p-4">
            <Target className="h-6 w-6 mx-auto mb-2 text-yellow-400" />
            <div className="text-2xl font-bold">12</div>
            <div className="text-xs text-blue-200">Sessions Completed</div>
          </Card>
          <Card className="bg-white/10 border-white/20 text-white text-center p-4">
            <Clock className="h-6 w-6 mx-auto mb-2 text-blue-400" />
            <div className="text-2xl font-bold">2.5h</div>
            <div className="text-xs text-blue-200">Total Training Time</div>
          </Card>
          <Card className="bg-white/10 border-white/20 text-white text-center p-4">
            <Zap className="h-6 w-6 mx-auto mb-2 text-orange-400" />
            <div className="text-2xl font-bold">7</div>
            <div className="text-xs text-blue-200">Day Streak</div>
          </Card>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-1">Program Overview</h3>
          <p className="text-blue-200 text-sm">
            This evidence-based program reduces ACL injury risk by up to 73%. Complete 3 sessions per week for 8 weeks.
          </p>
        </div>

        <div className="space-y-3">
          {PROGRAM_WEEKS.map((week) => {
            const isCompleted = week.week <= completedWeeks;
            const isCurrent = week.week === completedWeeks + 1;
            const isLocked = week.week > completedWeeks + 1;

            const weekSessions = sessions.filter(s => s.weekNumber === week.week);

            return (
              <Card 
                key={week.week}
                className={`
                  transition-all cursor-pointer
                  ${isCompleted ? 'bg-green-900/30 border-green-500/50' : ''}
                  ${isCurrent ? 'bg-blue-900/50 border-blue-400 ring-2 ring-blue-400/50' : ''}
                  ${isLocked ? 'bg-slate-800/50 border-slate-700 opacity-60' : ''}
                  ${!isLocked && !isCompleted && !isCurrent ? 'bg-slate-800/50 border-slate-600' : ''}
                `}
                onClick={() => !isLocked && setSelectedWeek(selectedWeek === week.week ? null : week.week)}
                data-testid={`card-week-${week.week}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg
                        ${isCompleted ? 'bg-green-500 text-white' : ''}
                        ${isCurrent ? 'bg-blue-500 text-white' : ''}
                        ${isLocked ? 'bg-slate-700 text-slate-400' : ''}
                        ${!isLocked && !isCompleted && !isCurrent ? 'bg-slate-700 text-slate-300' : ''}
                      `}>
                        {isCompleted ? <CheckCircle className="h-6 w-6" /> : isLocked ? <Lock className="h-5 w-5" /> : week.week}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white flex items-center gap-2">
                          {week.title}
                          {isCurrent && (
                            <Badge className="bg-blue-500 text-white text-xs">CURRENT</Badge>
                          )}
                        </h4>
                        <p className="text-sm text-blue-200">{week.focus}</p>
                      </div>
                    </div>
                    <ChevronRight className={`h-5 w-5 text-slate-400 transition-transform ${selectedWeek === week.week ? 'rotate-90' : ''}`} />
                  </div>

                  {selectedWeek === week.week && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-sm text-blue-100 mb-3">{week.description}</p>
                      <div className="space-y-2">
                        {weekSessions.length > 0 ? weekSessions.map((session) => (
                          <div key={session.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                            <div>
                              <span className="text-white text-sm font-medium">{session.name}</span>
                              <span className="text-blue-300 text-xs ml-2">{session.duration} min</span>
                            </div>
                            <Button size="sm" variant="secondary" data-testid={`button-start-session-${session.id}`}>
                              Start
                            </Button>
                          </div>
                        )) : (
                          <div className="text-sm text-blue-300 text-center py-4">
                            {isLocked ? "Complete previous weeks to unlock" : "Sessions for this week"}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-6 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-yellow-500/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Shield className="h-10 w-10 text-yellow-500 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-white mb-1">ACL Prevention Research</h3>
                <p className="text-sm text-blue-100">
                  This program is based on the FIFA 11+ and NetballSmart warm-up protocols. 
                  Research shows up to 73% reduction in knee injuries when completed consistently.
                </p>
                <Button variant="link" className="text-yellow-400 p-0 h-auto mt-2" data-testid="link-learn-more">
                  Learn more about the science →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
