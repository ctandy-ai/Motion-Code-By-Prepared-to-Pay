import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/ui/EmptyState";
import { Plus, Calendar, Activity } from "lucide-react";

export default function Programs() {
  const { data: programs = [], isLoading, isError, error } = useQuery<any[]>({
    queryKey: ['/api/programs'],
    retry: false,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-p2p-blue border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <h2 className="font-heading text-xl text-red-400 mb-2">Unable to load programs</h2>
            <p className="font-body text-gray-400">{error?.message || "Please check your subscription status"}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-3xl bg-gradient-to-r from-p2p-blue to-p2p-electric bg-clip-text text-transparent">Programs</h1>
        <Button 
          onClick={() => alert("Create Program feature coming soon - contact support@preparedtoplay.com")}
          className="bg-gradient-to-r from-p2p-blue to-p2p-electric rounded-2xl"
          data-testid="button-new-program"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Program
        </Button>
      </div>

      {programs.length === 0 ? (
        <EmptyState 
          title="No programs yet." 
          action="+ Create Program" 
          onAction={() => alert("Create Program feature coming soon - contact support@preparedtoplay.com")}
        />
      ) : (
        <div className="grid gap-4">
          {programs.map(p => (
            <div 
              key={p.id} 
              className="bg-white/5 p-6 rounded-2xl flex justify-between items-center shadow-glow border border-p2p-border hover:border-p2p-electric transition-all"
              data-testid={`program-card-${p.id}`}
            >
              <div>
                <h2 className="font-heading text-xl text-white mb-2">{p.name}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-400 font-body">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {p.totalWeeks} weeks
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="w-4 h-4" />
                    {p.sessionsPerWeek} sessions/week
                  </div>
                </div>
              </div>
              <Button 
                variant="secondary" 
                onClick={() => alert(`View program: ${p.name}`)}
                className="rounded-2xl"
                data-testid={`button-view-program-${p.id}`}
              >
                View
              </Button>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
