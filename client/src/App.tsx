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
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <header className="flex h-20 shrink-0 items-center justify-between gap-4 border-b bg-card px-8 shadow-sm">
                <div className="flex items-center gap-4">
                  <SidebarTrigger data-testid="button-sidebar-toggle" className="h-9 w-9" />
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg p-2">
                      <StrideLogo className="h-full w-full text-white" />
                    </div>
                    <div>
                      <h1 className="font-heading text-lg font-bold text-foreground">
                        StrideCode <span className="text-primary">Pro</span>
                      </h1>
                      <p className="text-xs text-muted-foreground">Train Smarter · Perform Better</p>
                    </div>
                  </div>
                </div>
                <ThemeToggle />
              </header>
              <main className="flex-1 overflow-y-auto bg-background">
                <div className="container mx-auto p-8 max-w-7xl">
                  <Router />
                </div>
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
