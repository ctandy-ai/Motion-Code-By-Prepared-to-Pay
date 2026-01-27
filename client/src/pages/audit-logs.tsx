import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Activity, Clock, User, Filter, RefreshCw } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface AuditLog {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userRole: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  resourceName: string | null;
  details: string | null;
  success: number;
  errorMessage: string | null;
  createdAt: string;
}

interface AuditSummary {
  totalActions: number;
  byAction: Record<string, number>;
  byResourceType: Record<string, number>;
  recentActivity: AuditLog[];
}

const actionColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  CREATE: "default",
  READ: "outline",
  UPDATE: "secondary",
  DELETE: "destructive",
  LOGIN: "default",
  LOGOUT: "outline",
  ASSIGN_PROGRAM: "default",
  BULK_ASSIGN: "default",
  BROADCAST_MESSAGE: "secondary",
  AI_QUERY: "secondary",
  AI_UPDATE: "default",
};

export default function AuditLogs() {
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [resourceFilter, setResourceFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: logs, isLoading: logsLoading, refetch } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit-logs", { limit: 200 }],
  });

  const { data: summary, isLoading: summaryLoading } = useQuery<AuditSummary>({
    queryKey: ["/api/audit-logs/summary", { days: 7 }],
  });

  const filteredLogs = logs?.filter(log => {
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesResource = resourceFilter === "all" || log.resourceType === resourceFilter;
    const matchesSearch = !searchQuery || 
      log.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resourceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAction && matchesResource && matchesSearch;
  });

  const uniqueActions = Array.from(new Set(logs?.map(l => l.action) || []));
  const uniqueResources = Array.from(new Set(logs?.map(l => l.resourceType) || []));

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-8">
      <div className="bglass rounded-2xl shadow-glass p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-4xl font-bold text-slate-100 flex items-center gap-3">
            <Shield className="h-8 w-8 text-brand-500" />
            Audit Logs
          </h1>
          <p className="text-slate-400 mt-2">
            Track all system activity for enterprise compliance
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => refetch()}
          data-testid="button-refresh-logs"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="bglass border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Total Actions (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-brand-400">
              {summaryLoading ? "..." : summary?.totalActions || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bglass border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Top Action</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-slate-100">
              {summary && Object.keys(summary.byAction).length > 0
                ? Object.entries(summary.byAction).sort((a, b) => b[1] - a[1])[0][0]
                : "N/A"}
            </div>
          </CardContent>
        </Card>

        <Card className="bglass border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Top Resource</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-slate-100">
              {summary && Object.keys(summary.byResourceType).length > 0
                ? Object.entries(summary.byResourceType).sort((a, b) => b[1] - a[1])[0][0]
                : "N/A"}
            </div>
          </CardContent>
        </Card>

        <Card className="bglass border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-400">Actions Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-100">
              {summary ? Object.keys(summary.byAction).length : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bglass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-brand-500" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs bg-white/5 border-white/10"
              data-testid="input-search-logs"
            />
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-40 bg-white/5 border-white/10" data-testid="select-action-filter">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={resourceFilter} onValueChange={setResourceFilter}>
              <SelectTrigger className="w-40 bg-white/5 border-white/10" data-testid="select-resource-filter">
                <SelectValue placeholder="Resource" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Resources</SelectItem>
                {uniqueResources.map(resource => (
                  <SelectItem key={resource} value={resource}>{resource}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bglass border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-brand-500" />
            Activity Log
          </CardTitle>
          <CardDescription>
            {filteredLogs?.length || 0} entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 rounded-lg bglass animate-shimmer" />
              ))}
            </div>
          ) : filteredLogs && filteredLogs.length > 0 ? (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-lg bglass border border-white/5 hover-elevate"
                  data-testid={`audit-log-${log.id}`}
                >
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <Badge variant={actionColors[log.action] || "secondary"}>
                      {log.action}
                    </Badge>
                    <Badge variant="outline">{log.resourceType}</Badge>
                    {log.success === 0 && (
                      <Badge variant="destructive">Failed</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                    {log.userEmail && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {log.userEmail}
                      </span>
                    )}
                    {log.resourceName && (
                      <span className="text-slate-300">
                        Resource: {log.resourceName}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(log.createdAt)}
                    </span>
                  </div>
                  {log.details && (
                    <p className="text-xs text-slate-500 mt-2 truncate">
                      {log.details}
                    </p>
                  )}
                  {log.errorMessage && (
                    <p className="text-xs text-red-400 mt-1">
                      Error: {log.errorMessage}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No audit logs found</p>
              <p className="text-sm mt-1">Activity will appear here as actions are performed</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
