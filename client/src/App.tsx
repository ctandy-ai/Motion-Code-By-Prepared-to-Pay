import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import Dashboard from "@/pages/dashboard";
import Exercises from "@/pages/exercises";
import Programs from "@/pages/programs";
import Athletes from "@/pages/athletes";
import Calendar from "@/pages/calendar";
import Progress from "@/pages/progress";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/exercises" component={Exercises} />
      <Route path="/programs" component={Programs} />
      <Route path="/athletes" component={Athletes} />
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
              <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background px-6">
                <SidebarTrigger data-testid="button-sidebar-toggle" className="h-9 w-9" />
                <ThemeToggle />
              </header>
              <main className="flex-1 overflow-y-auto">
                <div className="container mx-auto p-6 max-w-7xl">
                  <Router />
                </div>
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
