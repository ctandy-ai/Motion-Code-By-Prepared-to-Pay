import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, CheckCircle, ArrowLeft, Award, ChevronRight } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

function renderContent(content: string) {
  const lines = content.split("\n");
  const elements: JSX.Element[] = [];
  let listItems: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key++} className="list-disc list-inside space-y-2 text-gray-300 font-body ml-4 my-4">
          {listItems.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={key++} className="text-xl font-heading font-bold text-white mt-8 mb-3">
          {trimmed.slice(4)}
        </h3>
      );
    } else if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={key++} className="text-2xl font-heading font-bold text-white mt-10 mb-4 pb-2 border-b border-p2p-border">
          {trimmed.slice(3)}
        </h2>
      );
    } else if (trimmed.startsWith("- ")) {
      listItems.push(trimmed.slice(2));
    } else if (trimmed === "") {
      flushList();
    } else {
      flushList();
      elements.push(
        <p key={key++} className="text-gray-300 font-body leading-relaxed my-3">
          {renderInline(trimmed)}
        </p>
      );
    }
  }
  flushList();

  return <div className="space-y-1">{elements}</div>;
}

export default function EducationModules() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const { data: modules = [], isLoading: modulesLoading } = useQuery<any[]>({
    queryKey: ["/api/education/modules"],
  });

  const { data: progress } = useQuery<{ completed: number; total: number }>({
    queryKey: ["/api/education/progress"],
  });

  const { data: selectedModule, isLoading: moduleLoading } = useQuery<any>({
    queryKey: ["/api/education/modules", selectedModuleId],
    enabled: selectedModuleId !== null,
  });

  const completeMutation = useMutation({
    mutationFn: async (moduleId: number) => {
      await apiRequest("POST", `/api/education/modules/${moduleId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/education/modules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/education/progress"] });
      if (selectedModuleId) {
        queryClient.invalidateQueries({ queryKey: ["/api/education/modules", selectedModuleId] });
      }
      toast({ title: "Module completed!", description: "Great work on finishing this module." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to mark module as complete.", variant: "destructive" });
    },
  });

  const filteredModules = categoryFilter === "all"
    ? modules
    : modules.filter((m: any) => m.category === categoryFilter);

  if (selectedModuleId && selectedModule) {
    return (
      <div className="flex min-h-screen bg-p2p-dark">
        <Sidebar user={user} />
        <div className="flex-1 flex flex-col">
          <header className="bg-p2p-darker border-b border-p2p-border px-4 md:px-8 py-6 pt-16 md:pt-6">
            <Button
              variant="ghost"
              onClick={() => setSelectedModuleId(null)}
              className="text-gray-400 hover:text-white mb-4 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Modules
            </Button>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedModule.category === "programming"
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "bg-green-500/20 text-green-400 border border-green-500/30"
                  }`}>
                    {selectedModule.category === "programming" ? "Programming" : "Prevention"}
                  </span>
                  <span className="flex items-center gap-1 text-gray-400 text-sm">
                    <Clock className="w-4 h-4" />
                    {selectedModule.duration} min
                  </span>
                </div>
                <h1 className="font-heading text-2xl md:text-4xl font-bold text-white tracking-tight">
                  {selectedModule.title}
                </h1>
              </div>
              {progress && (
                <div className="flex items-center gap-2 bg-p2p-dark/50 rounded-xl px-4 py-2 border border-p2p-border">
                  <Award className="w-5 h-5 text-p2p-electric" />
                  <span className="text-gray-300 text-sm font-body">
                    {progress.completed} of {progress.total} completed
                  </span>
                </div>
              )}
            </div>
          </header>

          <main className="flex-1 p-4 md:p-8 max-w-4xl">
            {moduleLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-4 bg-p2p-darker rounded w-full" />
                ))}
              </div>
            ) : (
              <>
                <Card className="bg-p2p-darker border-p2p-border rounded-2xl">
                  <CardContent className="p-6 md:p-10">
                    {renderContent(selectedModule.content || "")}
                  </CardContent>
                </Card>

                <div className="mt-8 flex items-center gap-4">
                  {selectedModule.isCompleted ? (
                    <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-xl px-6 py-4">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                      <span className="text-green-400 font-semibold font-body">Module Completed</span>
                    </div>
                  ) : (
                    <Button
                      onClick={() => completeMutation.mutate(selectedModule.id)}
                      disabled={completeMutation.isPending}
                      className="bg-gradient-to-r from-p2p-blue to-p2p-electric hover:shadow-glow text-white font-semibold rounded-xl px-8 py-6 text-base"
                    >
                      {completeMutation.isPending ? "Saving..." : "Mark as Complete"}
                      <CheckCircle className="w-5 h-5 ml-2" />
                    </Button>
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-p2p-dark">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col">
        <header className="bg-p2p-darker border-b border-p2p-border px-4 md:px-8 py-8 md:py-12 pt-20 md:pt-12">
          <div className="flex items-center gap-3 md:gap-4 mb-4">
            <BookOpen className="w-8 h-8 md:w-10 md:h-10 text-p2p-electric" />
            <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
              Coach Education
            </h1>
          </div>
          <p className="text-gray-300 font-body text-lg max-w-4xl leading-relaxed mb-6">
            Deepen your understanding of programming principles, injury prevention, and athletic development through our structured education modules.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-2">
              {["all", "programming", "prevention"].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    categoryFilter === cat
                      ? "bg-p2p-electric/20 text-p2p-electric border border-p2p-electric/40"
                      : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  {cat === "all" ? "All" : cat === "programming" ? "Programming" : "Prevention"}
                </button>
              ))}
            </div>

            {progress && (
              <div className="flex items-center gap-3 bg-p2p-dark/50 rounded-xl px-5 py-3 border border-p2p-border">
                <Award className="w-5 h-5 text-p2p-electric" />
                <span className="text-gray-300 text-sm font-body">
                  <span className="text-white font-semibold">{progress.completed}</span> of{" "}
                  <span className="text-white font-semibold">{progress.total}</span> modules completed
                </span>
                <div className="w-24 h-2 bg-p2p-dark rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-p2p-blue to-p2p-electric rounded-full transition-all"
                    style={{ width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          {modulesLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl">
              {[1, 2, 3].map(i => (
                <Card key={i} className="bg-p2p-darker border-p2p-border rounded-2xl animate-pulse">
                  <CardHeader><div className="h-6 bg-p2p-dark rounded w-3/4" /></CardHeader>
                  <CardContent><div className="h-16 bg-p2p-dark rounded" /></CardContent>
                </Card>
              ))}
            </div>
          ) : filteredModules.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-heading text-white mb-2">No modules found</h3>
              <p className="text-gray-400 font-body">No education modules match the selected filter.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl">
              {filteredModules.map((mod: any) => (
                <Card
                  key={mod.id}
                  className="bg-p2p-darker border-p2p-border rounded-2xl cursor-pointer hover:border-p2p-electric/50 transition-all duration-300 group"
                  onClick={() => setSelectedModuleId(mod.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        mod.category === "programming"
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : "bg-green-500/20 text-green-400 border border-green-500/30"
                      }`}>
                        {mod.category === "programming" ? "Programming" : "Prevention"}
                      </span>
                      {mod.isCompleted && (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                    </div>
                    <CardTitle className="text-white font-heading text-lg group-hover:text-p2p-electric transition-colors leading-tight">
                      {mod.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400 font-body text-sm mb-4 leading-relaxed line-clamp-3">
                      {mod.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-gray-500 text-sm">
                        <Clock className="w-4 h-4" />
                        {mod.duration} min
                      </span>
                      <span className="flex items-center gap-1 text-p2p-electric text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        Read Module
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
