import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
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
import {
  Building2,
  Users,
  BarChart3,
  TrendingUp,
  Download,
  MapPin,
  Activity,
  ArrowUpDown,
  FileSpreadsheet,
} from "lucide-react";

interface StateData {
  state: string;
  athleteCount: number;
  activeCount: number;
  activePercent: number;
  avgSessionsWeek: number;
  topClub: string;
}

interface WeeklyTrend {
  week: string;
  compliance: number;
}

interface NSOAnalytics {
  totalAthletes: number;
  activeThisWeek: number;
  averageCompliance: number;
  totalSessionsMonth: number;
  byState: StateData[];
  weeklyTrend: WeeklyTrend[];
}

type SortKey = keyof StateData;
type SortDir = "asc" | "desc";

export default function NSODashboard() {
  const { user } = useAuth();
  const [sortKey, setSortKey] = useState<SortKey>("athleteCount");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const { data: analytics, isLoading } = useQuery<NSOAnalytics>({
    queryKey: ["/api/nso/analytics"],
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortedStates = analytics?.byState
    ? [...analytics.byState].sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
      })
    : [];

  const maxCompliance = analytics?.weeklyTrend
    ? Math.max(...analytics.weeklyTrend.map((t) => t.compliance), 1)
    : 100;

  const handleExportCSV = () => {
    window.open("/api/nso/export/csv", "_blank");
  };

  const handleExportBoard = () => {
    window.open("/api/nso/export/csv", "_blank");
  };

  if (user?.role !== "nso_admin" && user?.role !== "admin") {
    return (
      <div className="flex min-h-screen bg-p2p-dark">
        <Sidebar user={user} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-heading font-bold text-white mb-2">Access Restricted</h2>
            <p className="text-gray-400">This dashboard is only available to NSO administrators.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-p2p-dark">
      <Sidebar user={user} />
      <div className="flex-1 overflow-y-auto p-4 pt-20 md:pt-6 md:p-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-8 h-8 text-p2p-electric" />
              <h1 className="font-heading text-3xl md:text-4xl font-bold text-white">
                NSO Analytics Dashboard
              </h1>
            </div>
            <p className="text-gray-400">
              Platform-wide metrics for National Sporting Organisation administrators
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              className="bg-gradient-to-r from-p2p-blue to-p2p-electric hover:opacity-90"
              onClick={handleExportCSV}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button
              variant="outline"
              className="border-p2p-border text-gray-300 hover:bg-white/5 hover:text-white"
              onClick={handleExportBoard}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export for Board Report
            </Button>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800">
            <CardContent className="p-5">
              <Users className="w-8 h-8 text-blue-500 mb-3" />
              {isLoading ? (
                <Skeleton className="h-8 w-16 bg-gray-700" />
              ) : (
                <div className="text-2xl font-bold text-white">{analytics?.totalAthletes || 0}</div>
              )}
              <div className="text-sm text-gray-400">Total Registered Athletes</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800">
            <CardContent className="p-5">
              <Activity className="w-8 h-8 text-green-500 mb-3" />
              {isLoading ? (
                <Skeleton className="h-8 w-16 bg-gray-700" />
              ) : (
                <div className="text-2xl font-bold text-white">{analytics?.activeThisWeek || 0}</div>
              )}
              <div className="text-sm text-gray-400">Active This Week</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800">
            <CardContent className="p-5">
              <BarChart3 className="w-8 h-8 text-purple-500 mb-3" />
              {isLoading ? (
                <Skeleton className="h-8 w-16 bg-gray-700" />
              ) : (
                <div className="text-2xl font-bold text-white">{analytics?.averageCompliance || 0}%</div>
              )}
              <div className="text-sm text-gray-400">Average Compliance Rate</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800">
            <CardContent className="p-5">
              <TrendingUp className="w-8 h-8 text-amber-500 mb-3" />
              {isLoading ? (
                <Skeleton className="h-8 w-16 bg-gray-700" />
              ) : (
                <div className="text-2xl font-bold text-white">{analytics?.totalSessionsMonth || 0}</div>
              )}
              <div className="text-sm text-gray-400">Total Sessions This Month</div>
            </CardContent>
          </Card>
        </div>

        {/* Compliance Trend */}
        <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800 mb-8">
          <CardHeader className="border-b border-gray-800">
            <CardTitle className="font-heading text-xl text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-p2p-electric" />
              Weekly Compliance Trend (Last 8 Weeks)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex items-end gap-3 h-48">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="flex-1 bg-gray-700" style={{ height: `${Math.random() * 60 + 40}%` }} />
                ))}
              </div>
            ) : (
              <div className="flex items-end gap-3 h-48">
                {analytics?.weeklyTrend.map((week, i) => {
                  const height = maxCompliance > 0 ? (week.compliance / maxCompliance) * 100 : 0;
                  const barColor =
                    week.compliance >= 70
                      ? "from-green-500 to-green-600"
                      : week.compliance >= 40
                      ? "from-amber-500 to-amber-600"
                      : "from-red-500 to-red-600";

                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <span className="text-xs text-gray-400 font-medium">{week.compliance}%</span>
                      <div className="w-full flex-1 flex items-end">
                        <div
                          className={`w-full rounded-t-lg bg-gradient-to-t ${barColor} transition-all duration-500 min-h-[4px]`}
                          style={{ height: `${Math.max(height, 2)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{week.week}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Regional Breakdown Table */}
        <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800 mb-8">
          <CardHeader className="border-b border-gray-800">
            <CardTitle className="font-heading text-xl text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-p2p-electric" />
              Regional Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full bg-gray-800" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800 hover:bg-transparent">
                      <TableHead
                        className="text-gray-400 cursor-pointer hover:text-white transition-colors"
                        onClick={() => handleSort("state")}
                      >
                        <div className="flex items-center gap-1">
                          State
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-gray-400 cursor-pointer hover:text-white transition-colors text-center"
                        onClick={() => handleSort("athleteCount")}
                      >
                        <div className="flex items-center gap-1 justify-center">
                          Registered Athletes
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-gray-400 cursor-pointer hover:text-white transition-colors text-center"
                        onClick={() => handleSort("activePercent")}
                      >
                        <div className="flex items-center gap-1 justify-center">
                          Active %
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-gray-400 cursor-pointer hover:text-white transition-colors text-center"
                        onClick={() => handleSort("avgSessionsWeek")}
                      >
                        <div className="flex items-center gap-1 justify-center">
                          Avg Sessions/Week
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </TableHead>
                      <TableHead
                        className="text-gray-400 cursor-pointer hover:text-white transition-colors"
                        onClick={() => handleSort("topClub")}
                      >
                        <div className="flex items-center gap-1">
                          Top Club
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedStates.map((stateData) => (
                      <TableRow key={stateData.state} className="border-gray-800 hover:bg-gray-800/50">
                        <TableCell className="text-white font-medium">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="bg-p2p-blue/10 text-p2p-electric border-p2p-blue/30 font-mono"
                            >
                              {stateData.state}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-white font-semibold">
                          {stateData.athleteCount}
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`font-semibold ${
                              stateData.activePercent >= 70
                                ? "text-green-400"
                                : stateData.activePercent >= 40
                                ? "text-amber-400"
                                : "text-red-400"
                            }`}
                          >
                            {stateData.activePercent}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-gray-300">
                          {stateData.avgSessionsWeek}
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {stateData.topClub}
                        </TableCell>
                      </TableRow>
                    ))}
                    {sortedStates.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-400">No regional data available yet</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Export Section */}
        <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-800">
          <CardHeader className="border-b border-gray-800">
            <CardTitle className="font-heading text-xl text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-p2p-electric" />
              Export Data
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-p2p-blue to-p2p-electric flex items-center justify-center">
                    <Download className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-white">Export Report</h3>
                    <p className="text-sm text-gray-400">Download full analytics as CSV</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Includes overview metrics, regional breakdown, and weekly compliance trend data.
                </p>
                <Button
                  className="w-full bg-gradient-to-r from-p2p-blue to-p2p-electric hover:opacity-90"
                  onClick={handleExportCSV}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV
                </Button>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-white">Export for Board Report</h3>
                    <p className="text-sm text-gray-400">Formatted data for board presentations</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Same analytics data formatted for use in board reports and stakeholder presentations.
                </p>
                <Button
                  variant="outline"
                  className="w-full border-purple-500/50 text-purple-300 hover:bg-purple-500/10 hover:text-purple-200"
                  onClick={handleExportBoard}
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Download Board Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
