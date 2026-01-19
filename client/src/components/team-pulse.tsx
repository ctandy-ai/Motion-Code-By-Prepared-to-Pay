import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, CheckCircle, XCircle, Zap, Heart, Calendar } from "lucide-react";
import { Link } from "wouter";

interface AthletePulse {
  id: string;
  name: string;
  team: string;
  position: string;
  belt: string;
  overallStatus: 'green' | 'yellow' | 'red';
  readinessScore: number;
  readinessStatus: 'good' | 'moderate' | 'low' | 'unknown';
  workoutsThisWeek: number;
  complianceStatus: 'high' | 'moderate' | 'low';
  sorenessAlert: boolean;
  missedWorkouts: boolean;
  hasProgram: boolean;
  lastWellnessDate: string | null;
  lastWorkoutDate: string | null;
}

interface TeamPulseData {
  athletes: AthletePulse[];
  summary: {
    total: number;
    green: number;
    yellow: number;
    red: number;
    avgReadiness: number;
    sorenessAlerts: number;
    missedWorkouts: number;
  };
}

export function TeamPulse() {
  const { data, isLoading } = useQuery<TeamPulseData>({
    queryKey: ["/api/team-pulse"],
  });

  if (isLoading) {
    return (
      <Card className="bglass shadow-glass border-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Activity className="h-4 w-4 text-brand-400" />
            Team Pulse
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-slate-700/50 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const summary = data?.summary;
  const athletes = data?.athletes || [];

  const statusColor = (status: 'green' | 'yellow' | 'red') => {
    switch (status) {
      case 'green': return 'bg-emerald-500';
      case 'yellow': return 'bg-amber-500';
      case 'red': return 'bg-red-500';
    }
  };

  const statusBg = (status: 'green' | 'yellow' | 'red') => {
    switch (status) {
      case 'green': return 'bg-emerald-500/10 border-emerald-500/20';
      case 'yellow': return 'bg-amber-500/10 border-amber-500/20';
      case 'red': return 'bg-red-500/10 border-red-500/20';
    }
  };

  return (
    <Card className="bglass shadow-glass border-0" data-testid="team-pulse-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Activity className="h-4 w-4 text-brand-400" />
            Team Pulse
          </CardTitle>
          {summary && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-400">{summary.green}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-xs text-slate-400">{summary.yellow}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-xs text-slate-400">{summary.red}</span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {summary && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-2 rounded-lg bg-slate-800/50 text-center">
              <div className="text-lg font-semibold text-slate-100">{summary.avgReadiness || '-'}</div>
              <div className="text-xs text-slate-400">Avg Readiness</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-800/50 text-center">
              <div className="text-lg font-semibold text-amber-400">{summary.sorenessAlerts}</div>
              <div className="text-xs text-slate-400">Soreness Alerts</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-800/50 text-center">
              <div className="text-lg font-semibold text-red-400">{summary.missedWorkouts}</div>
              <div className="text-xs text-slate-400">Missed Training</div>
            </div>
          </div>
        )}

        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
          {athletes.length === 0 ? (
            <div className="text-center py-6 text-slate-400">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No athletes to display</p>
            </div>
          ) : (
            athletes.map((athlete) => (
              <Link
                key={athlete.id}
                href={`/athletes/${athlete.id}`}
                className="block"
              >
                <div
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover-elevate cursor-pointer ${statusBg(athlete.overallStatus)}`}
                  data-testid={`pulse-athlete-${athlete.id}`}
                >
                  <div className={`h-3 w-3 rounded-full ${statusColor(athlete.overallStatus)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-100 truncate">
                        {athlete.name}
                      </span>
                      {athlete.belt !== 'unclassified' && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {athlete.belt}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {athlete.readinessScore > 0 ? athlete.readinessScore : '-'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {athlete.workoutsThisWeek}/wk
                      </span>
                      {!athlete.hasProgram && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <Calendar className="h-3 w-3" />
                          No program
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {athlete.sorenessAlert && (
                      <div className="p-1 rounded-full bg-amber-500/20" title="High soreness reported">
                        <AlertTriangle className="h-3 w-3 text-amber-400" />
                      </div>
                    )}
                    {athlete.missedWorkouts && (
                      <div className="p-1 rounded-full bg-red-500/20" title="Missed workouts">
                        <XCircle className="h-3 w-3 text-red-400" />
                      </div>
                    )}
                    {athlete.overallStatus === 'green' && !athlete.sorenessAlert && (
                      <div className="p-1 rounded-full bg-emerald-500/20">
                        <CheckCircle className="h-3 w-3 text-emerald-400" />
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
