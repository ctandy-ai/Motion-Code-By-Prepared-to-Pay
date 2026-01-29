import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Dashboard from "@/pages/dashboard";
import Exercises from "@/pages/exercises";
import Programs from "@/pages/programs";
import ProgramBuilder from "@/pages/program-builder";
import EnhancedProgramBuilder from "@/pages/enhanced-program-builder";
import PlannerPage from "@/pages/planner-page";
import Templates from "@/pages/templates";
import Athletes from "@/pages/athletes";
import AthleteDetail from "@/pages/athlete-detail";
import AthletePortal from "@/pages/athlete-portal";
import LogWorkout from "@/pages/log-workout";
import WellnessSurvey from "@/pages/wellness-survey";
import Workout from "@/pages/workout";
import Calendar from "@/pages/calendar";
import Progress from "@/pages/progress";
import Analytics from "@/pages/analytics";
import Heuristics from "@/pages/heuristics";
import CoachTools from "@/pages/coach-tools";
import AIClassifierTest from "@/pages/ai-classifier-test";
import RMCalculatorPage from "@/pages/rm-calculator-page";
import ValdIntegration from "@/pages/vald-integration";
import AthleteReport from "@/pages/athlete-report";
import AIOnboardingPage from "@/pages/ai-onboarding";
import AICommandCenterPage from "@/pages/ai-command-center";
import CoachMessages from "@/pages/coach-messages";
import AuditLogs from "@/pages/audit-logs";
import NotFound from "@/pages/not-found";
import { AICoachChat } from "@/components/ai-coach-chat";
import MobileHome from "@/pages/mobile/MobileHome";
import MobileWorkout from "@/pages/mobile/MobileWorkout";
import MobileWellness from "@/pages/mobile/MobileWellness";
import MobileMessages from "@/pages/mobile/MobileMessages";
import MobileProfile from "@/pages/mobile/MobileProfile";
import MobileRpe from "@/pages/mobile/MobileRpe";

function DesktopRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/workout" component={Workout} />
      <Route path="/exercises" component={Exercises} />
      <Route path="/programs" component={Programs} />
      <Route path="/programs/:programId" component={EnhancedProgramBuilder} />
      <Route path="/programs/:programId/builder" component={ProgramBuilder} />
      <Route path="/programs/:programId/build" component={EnhancedProgramBuilder} />
      <Route path="/programs/:programId/planner" component={PlannerPage} />
      <Route path="/templates" component={Templates} />
      <Route path="/athletes" component={Athletes} />
      <Route path="/athletes/new/ai" component={AIOnboardingPage} />
      <Route path="/athletes/:athleteId" component={AthleteDetail} />
      <Route path="/athletes/:athleteId/report" component={AthleteReport} />
      <Route path="/athlete/:athleteId/portal" component={AthletePortal} />
      <Route path="/athlete/:athleteId/log-workout" component={LogWorkout} />
      <Route path="/athlete/:athleteId/wellness" component={WellnessSurvey} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/progress" component={Progress} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/heuristics" component={Heuristics} />
      <Route path="/coach-tools" component={CoachTools} />
      <Route path="/ai-classifier" component={AIClassifierTest} />
      <Route path="/rm-calculator" component={RMCalculatorPage} />
      <Route path="/vald" component={ValdIntegration} />
      <Route path="/ai-command-center" component={AICommandCenterPage} />
      <Route path="/coach/messages" component={CoachMessages} />
      <Route path="/audit-logs" component={AuditLogs} />
      <Route component={NotFound} />
    </Switch>
  );
}

function MobileRouter() {
  return (
    <Switch>
      <Route path="/m" component={MobileHome} />
      <Route path="/m/workout" component={MobileWorkout} />
      <Route path="/m/workout/rpe" component={MobileRpe} />
      <Route path="/m/wellness" component={MobileWellness} />
      <Route path="/m/messages" component={MobileMessages} />
      <Route path="/m/profile" component={MobileProfile} />
      <Route path="/m/progress" component={MobileHome} />
      <Route path="/m/notifications" component={MobileHome} />
      <Route path="/m/settings" component={MobileProfile} />
      <Route component={MobileHome} />
    </Switch>
  );
}

function DesktopLayout() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full bg-ink-1">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden pl-5">
          <header className="bglass rounded-2xl shadow-glass px-4 py-3 mr-5 mt-5">
            <SidebarTrigger data-testid="button-sidebar-toggle" className="h-9 w-9 hover-elevate" />
          </header>
          <main className="flex-1 overflow-y-auto p-5 pr-5">
            <DesktopRouter />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  const [location] = useLocation();
  const isMobileRoute = location.startsWith("/m");

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {isMobileRoute ? (
          <MobileRouter />
        ) : (
          <>
            <DesktopLayout />
            <AICoachChat />
          </>
        )}
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
