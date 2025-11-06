import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { StrideLogo } from "@/components/stride-logo";
import Dashboard from "@/pages/dashboard";
import Exercises from "@/pages/exercises";
import Programs from "@/pages/programs";
import ProgramBuilder from "@/pages/program-builder";
import Templates from "@/pages/templates";
import Athletes from "@/pages/athletes";
import AthleteDetail from "@/pages/athlete-detail";
import Workout from "@/pages/workout";
import Calendar from "@/pages/calendar";
import Progress from "@/pages/progress";
import NotFound from "@/pages/not-found";
import { AICoachChat } from "@/components/ai-coach-chat";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/workout" component={Workout} />
      <Route path="/exercises" component={Exercises} />
      <Route path="/programs" component={Programs} />
      <Route path="/programs/:programId/builder" component={ProgramBuilder} />
      <Route path="/templates" component={Templates} />
      <Route path="/athletes" component={Athletes} />
      <Route path="/athletes/:athleteId" component={AthleteDetail} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/progress" component={Progress} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full bg-ink-1">
            <AppSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <header className="bglass rounded-2xl shadow-glass px-5 py-4 flex items-center justify-between mx-5 mt-5">
                <div className="flex items-center gap-3">
                  <SidebarTrigger data-testid="button-sidebar-toggle" className="h-9 w-9" />
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center shadow-lg p-2">
                      <StrideLogo className="h-full w-full text-white" />
                    </div>
                    <div>
                      <h1 className="font-heading text-base font-bold text-slate-100">
                        StrideCode <span className="text-brand-300">Pro</span>
                      </h1>
                      <p className="text-[11px] text-slate-400">Design Programs · Track Progress</p>
                    </div>
                  </div>
                </div>
                <ThemeToggle />
              </header>
              <main className="flex-1 overflow-y-auto p-5">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <AICoachChat />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
