import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { TrialBanner } from "@/components/trial-banner";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users,
  BarChart3,
  AlertTriangle,
  Download,
  Copy,
  CheckCircle,
  Calendar,
  Trophy,
  TrendingDown,
  Plus,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CoachTeam } from "@shared/schema";

interface ComplianceAthlete {
  id: string;
  firstName: string | null;
  lastName: string | null;
  club: string | null;
  beltLevel: string;
  weeklyCompleted: number;
  monthlyCompleted: number[];
  compliancePercent: number;
  status: string;
  lastActive: string | null;
}

interface ComplianceData {
  totalAthletes: number;
  averageCompliance: number;
  atRiskCount: number;
  weekNumber: number;
  totalSessionsThisWeek: number;
  mostActiveAthlete: { name: string; sessions: number } | null;
  leastActiveAthlete: { name: string; sessions: number } | null;
  athletes: ComplianceAthlete[];
}

type TeamWithMembers = CoachTeam & { memberCount: number };

function StatusBadge({ status, compliancePercent }: { status: string; compliancePercent: number }) {
  if (status === "Inactive") {
    return <Badge variant="outline" className="bg-gray-800 text-gray-400 border-gray-600">Inactive</Badge>;
  }
  if (compliancePercent >= 80) {
    return <Badge className="bg-green-900/50 text-green-400 border border-green-700 hover:bg-green-900/50">On Track</Badge>;
  }
  if (compliancePercent >= 50) {
    return <Badge className="bg-amber-900/50 text-amber-400 border border-amber-700 hover:bg-amber-900/50">At Risk</Badge>;
  }
  return <Badge className="bg-red-900/50 text-red-400 border border-red-700 hover:bg-red-900/50">At Risk</Badge>;
}

function WeeklyDots({ monthlyCompleted }: { monthlyCompleted: number[] }) {
  const weeks = monthlyCompleted || [0, 0, 0, 0];
  return (
    <div className="flex items-center gap-1">
      {weeks.map((count, i) => (
        <div key={i} className="flex flex-col items-center gap-0.5">
          <div
            className={`w-3 h-3 rounded-full ${
              count >= 3
                ? "bg-green-500"
                : count >= 1
                ? "bg-amber-500"
                : "bg-gray-700"
            }`}
            title={`Week ${i + 1}: ${count} sessions`}
          />
        </div>
      ))}
    </div>
  );
}

function BeltBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    white: "bg-white/10 text-white border-white/30",
    blue: "bg-blue-900/50 text-blue-400 border-blue-700",
    black: "bg-gray-900 text-gray-300 border-gray-600",
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border capitalize ${colors[level] || colors.white}`}>
      {level}
    </span>
  );
}

export default function CoachDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamSport, setTeamSport] = useState("netball");
  const [teamLevel, setTeamLevel] = useState("community");

  const { data: compliance, isLoading: complianceLoading } = useQuery<ComplianceData>({
    queryKey: ["/api/coach/compliance"],
  });

  const { data: teams, isLoading: teamsLoading } = useQuery<TeamWithMembers[]>({
    queryKey: ["/api/coach/teams"],
  });

  const createTeamMutation = useMutation({
    mutationFn: (data: { name: string; sport: string; level: string }) =>
      apiRequest("POST", "/api/coach/teams", data).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coach/teams"] });
      setCreateTeamOpen(false);
      setTeamName("");
      toast({ title: "Team created!", description: "Share the team code with your athletes to get them tracking." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not create team. Try again.", variant: "destructive" });
    },
  });

  const handleCreateTeam = () => {
    if (!teamName.trim()) return;
    createTeamMutation.mutate({ name: teamName.trim(), sport: teamSport, level: teamLevel });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!", description: `Team code ${code} copied to clipboard` });
  };

  const handleDownloadCSV = () => {
    window.open("/api/coach/report/csv", "_blank");
  };

  return (
    <div className="flex min-h-screen bg-p2p-dark">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TrialBanner />
        <div className="flex-1 overflow-y-auto p-4 pt-20 md:pt-6 md:p-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-white mb-2">
              Coach Compliance Dashboard
            </h1>
            <p className="text-gray-400">
              Monitor your team's training compliance and progress
            </p>
          </div>
          <Button
            className="bg-gradient-to-r from-p2p-blue to-p2p-electric hover:opacity-90"
            onClick={handleDownloadCSV}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Team Overview Header */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800">
            <CardContent className="p-5">
              <Users className="w-8 h-8 text-blue-500 mb-3" />
              {complianceLoading ? (
                <Skeleton className="h-8 w-16 bg-gray-700" />
              ) : (
                <div className="text-2xl font-bold text-white">{compliance?.totalAthletes || 0}</div>
              )}
              <div className="text-sm text-gray-400">Total Athletes</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800">
            <CardContent className="p-5">
              <BarChart3 className="w-8 h-8 text-green-500 mb-3" />
              {complianceLoading ? (
                <Skeleton className="h-8 w-16 bg-gray-700" />
              ) : (
                <div className="text-2xl font-bold text-white">{compliance?.averageCompliance || 0}%</div>
              )}
              <div className="text-sm text-gray-400">Avg Compliance</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800">
            <CardContent className="p-5">
              <AlertTriangle className="w-8 h-8 text-red-500 mb-3" />
              {complianceLoading ? (
                <Skeleton className="h-8 w-16 bg-gray-700" />
              ) : (
                <div className="text-2xl font-bold text-white">{compliance?.atRiskCount || 0}</div>
              )}
              <div className="text-sm text-gray-400">At Risk Athletes</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800">
            <CardContent className="p-5">
              <Calendar className="w-8 h-8 text-purple-500 mb-3" />
              {complianceLoading ? (
                <Skeleton className="h-8 w-16 bg-gray-700" />
              ) : (
                <div className="text-2xl font-bold text-white">Week {compliance?.weekNumber || 0}</div>
              )}
              <div className="text-sm text-gray-400">Current Week</div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Summary Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-blue-500/30">
            <CardContent className="p-6">
              <CheckCircle className="w-10 h-10 text-blue-500 mb-3" />
              <h3 className="font-heading text-lg font-bold text-white mb-1">
                Sessions This Week
              </h3>
              {complianceLoading ? (
                <Skeleton className="h-8 w-12 bg-gray-700" />
              ) : (
                <p className="text-2xl font-bold text-blue-400">{compliance?.totalSessionsThisWeek || 0}</p>
              )}
              <p className="text-sm text-gray-400 mt-1">across all athletes</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/30 to-green-800/20 border-green-500/30">
            <CardContent className="p-6">
              <Trophy className="w-10 h-10 text-green-500 mb-3" />
              <h3 className="font-heading text-lg font-bold text-white mb-1">
                Most Active
              </h3>
              {complianceLoading ? (
                <Skeleton className="h-6 w-32 bg-gray-700" />
              ) : compliance?.mostActiveAthlete ? (
                <>
                  <p className="text-lg font-semibold text-green-400">{compliance.mostActiveAthlete.name}</p>
                  <p className="text-sm text-gray-400">{compliance.mostActiveAthlete.sessions} sessions this week</p>
                </>
              ) : (
                <p className="text-sm text-gray-400">No activity yet</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-900/30 to-red-800/20 border-red-500/30">
            <CardContent className="p-6">
              <TrendingDown className="w-10 h-10 text-red-500 mb-3" />
              <h3 className="font-heading text-lg font-bold text-white mb-1">
                Least Active
              </h3>
              {complianceLoading ? (
                <Skeleton className="h-6 w-32 bg-gray-700" />
              ) : compliance?.leastActiveAthlete ? (
                <>
                  <p className="text-lg font-semibold text-red-400">{compliance.leastActiveAthlete.name}</p>
                  <p className="text-sm text-gray-400">{compliance.leastActiveAthlete.sessions} sessions this week</p>
                </>
              ) : (
                <p className="text-sm text-gray-400">No activity yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Athlete Compliance Table */}
        <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800 mb-8">
          <CardHeader className="border-b border-gray-800">
            <CardTitle className="font-heading text-xl text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-p2p-electric" />
              Athlete Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {complianceLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full bg-gray-800" />
                ))}
              </div>
            ) : !compliance?.athletes || compliance.athletes.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="font-heading text-lg font-bold text-white mb-2">No athletes yet</h3>
                <p className="text-gray-400">
                  Share your team invite code to start tracking compliance
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800 hover:bg-transparent">
                      <TableHead className="text-gray-400">Name</TableHead>
                      <TableHead className="text-gray-400">Club</TableHead>
                      <TableHead className="text-gray-400">Belt</TableHead>
                      <TableHead className="text-gray-400 text-center">This Week</TableHead>
                      <TableHead className="text-gray-400 text-center">Last 4 Weeks</TableHead>
                      <TableHead className="text-gray-400 text-center">Compliance</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {compliance.athletes.map((athlete) => (
                      <TableRow key={athlete.id} className="border-gray-800 hover:bg-gray-800/50">
                        <TableCell className="text-white font-medium">
                          {`${athlete.firstName || ''} ${athlete.lastName || ''}`.trim() || 'Unknown'}
                        </TableCell>
                        <TableCell className="text-gray-400">{athlete.club || '—'}</TableCell>
                        <TableCell><BeltBadge level={athlete.beltLevel} /></TableCell>
                        <TableCell className="text-center">
                          <span className={`font-semibold ${
                            athlete.weeklyCompleted >= 3 ? 'text-green-400' : 
                            athlete.weeklyCompleted >= 1 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {athlete.weeklyCompleted}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <WeeklyDots monthlyCompleted={athlete.monthlyCompleted} />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`font-bold ${
                            athlete.compliancePercent >= 80 ? 'text-green-400' :
                            athlete.compliancePercent >= 50 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {athlete.compliancePercent}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={athlete.status} compliancePercent={athlete.compliancePercent} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Invite Section */}
        <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800">
          <CardHeader className="border-b border-gray-800">
            <div className="flex items-center justify-between">
              <CardTitle className="font-heading text-xl text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-p2p-electric" />
                Your Teams
              </CardTitle>
              <Button
                size="sm"
                className="bg-p2p-blue hover:bg-p2p-electric text-white gap-1.5"
                onClick={() => setCreateTeamOpen(true)}
              >
                <Plus className="w-4 h-4" />
                New Team
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {teamsLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2].map(i => (
                  <Skeleton key={i} className="h-16 w-full bg-gray-800" />
                ))}
              </div>
            ) : !teams || teams.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="font-heading text-lg font-bold text-white mb-2">No teams yet</h3>
                <p className="text-gray-400">Create a team to start managing your athletes</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {teams.map((team) => (
                  <div key={team.id} className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-p2p-blue to-p2p-electric flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{team.name}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                          <span>{team.ageGroup || "All ages"}</span>
                          <span>•</span>
                          <span className="capitalize">{team.level || "Community"}</span>
                          <span>•</span>
                          <span>{team.memberCount} member{team.memberCount !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {team.teamCode && (
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1.5 bg-gray-800 rounded-lg border border-gray-700">
                            <span className="text-sm text-gray-400 mr-1">Code:</span>
                            <span className="text-sm font-mono text-white font-bold">{team.teamCode}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-400 hover:text-white hover:bg-gray-800"
                            onClick={() => handleCopyCode(team.teamCode!)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Team Dialog */}
      <Dialog open={createTeamOpen} onOpenChange={setCreateTeamOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-white">Create a New Team</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-sm">Team name</Label>
              <Input
                placeholder="e.g. U18 Netball Squad"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                onKeyDown={e => e.key === "Enter" && handleCreateTeam()}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-sm">Sport</Label>
              <Select value={teamSport} onValueChange={setTeamSport}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {["netball", "afl", "soccer", "rugby", "basketball", "athletics", "general"].map(s => (
                    <SelectItem key={s} value={s} className="text-white capitalize hover:bg-gray-700">{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-gray-300 text-sm">Level</Label>
              <Select value={teamLevel} onValueChange={setTeamLevel}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {["community", "representative", "elite", "professional"].map(l => (
                    <SelectItem key={l} value={l} className="text-white capitalize hover:bg-gray-700">{l.charAt(0).toUpperCase() + l.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-gray-500">A unique join code will be generated automatically. Share it with your athletes so they can link their account to your team.</p>
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                onClick={() => setCreateTeamOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-p2p-blue hover:bg-p2p-electric text-white"
                disabled={!teamName.trim() || createTeamMutation.isPending}
                onClick={handleCreateTeam}
              >
                {createTeamMutation.isPending ? "Creating…" : "Create Team"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
