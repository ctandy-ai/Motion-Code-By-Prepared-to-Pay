import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "./hooks/useAuth";

// ── Internal coach/admin pages (GitHub MC Pro) ─────────────────────────────
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
import McProPlanner from "@/pages/mc-pro-planner";
import ValdIntegration from "@/pages/vald-integration";
import AthleteReport from "@/pages/athlete-report";
import AIOnboardingPage from "@/pages/ai-onboarding";
import AICommandCenterPage from "@/pages/ai-command-center";
import AuditLogs from "@/pages/audit-logs";
import Leaderboards from "@/pages/leaderboards";
import Noticeboard from "@/pages/noticeboard";
import VideoLibrary from "@/pages/video-library";
import SurveyBuilder from "@/pages/survey-builder";
import TeamTraining from "@/pages/team-training";
import NotFound from "@/pages/not-found";
import { AICoachChat } from "@/components/ai-coach-chat";

// ── Mobile pages (GitHub MC Pro) ───────────────────────────────────────────
import MobileHome from "@/pages/mobile/MobileHome";
import MobileWorkout from "@/pages/mobile/MobileWorkout";
import MobileWellness from "@/pages/mobile/MobileWellness";
import MobileMessages from "@/pages/mobile/MobileMessages";
import MobileProfile from "@/pages/mobile/MobileProfile";
import MobileRpe from "@/pages/mobile/MobileRpe";

// ── Public / consumer-facing pages (Replit athlete app) ───────────────────
import Landing from "./pages/landing";
import MotionCodeLanding from "./pages/motion-code-landing";
import Login from "./pages/login";
import Signup from "./pages/signup";
import ForgotPassword from "./pages/forgot-password";
import ResetPassword from "./pages/reset-password";
import Onboarding from "./pages/onboarding";
import AthleteSetup from "./pages/athlete-setup";
import AthleteDashboard from "./pages/athlete-dashboard";
import CoachDashboard from "./pages/coach-dashboard";
import ClinicianDashboard from "./pages/clinician-dashboard";
import CoachMessages from "./pages/coach-messages";
import FindClinic from "./pages/find-clinic";
import NetballPathway from "./pages/netball-pathway";
import ProgramDetail from "./pages/program-detail";
import Education from "./pages/education";
import Workshops from "./pages/workshops";
import ExerciseDetail from "./pages/exercise-detail";
import ExerciseUpload from "./pages/exercise-upload";
import Settings from "./pages/settings";
import Help from "./pages/help";
import VideoAdmin from "./pages/video-admin";
import VideoMapping from "./pages/video-mapping";
import AdminPanel from "./pages/admin";
import ExerciseAdmin from "./pages/exercise-admin";
import MotionCodePro from "./pages/motion-code-pro";
import Community from "./pages/community";
import EducationModules from "./pages/education-modules";
import NSODashboard from "./pages/nso-dashboard";
import PartnerLanding from "./pages/partner-landing";
import SessionPlayer from "./pages/session-player";
import Upgrade from "./pages/upgrade";
import Pricing from "./pages/pricing";
import UpgradeSuccess from "./pages/upgrade-success";

// ── Protected Route wrapper ────────────────────────────────────────────────
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-white">Loading...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    window.location.href = "/login";
    return null;
  }
  
  return <Component />;
}

// ── Public routes (no sidebar) ─────────────────────────────────────────────
function PublicRouter() {
  return (
    <Switch>
      <Route path="/" component={MotionCodeLanding} />
      <Route path="/preview" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/join/:orgSlug" component={PartnerLanding} />
    </Switch>
  );
}

// ── Desktop authenticated app (with sidebar) ──────────────────────────────
function DesktopRouter() {
  return (
    <Switch>
      {/* Main coach dashboard */}
      <Route path="/app" component={Dashboard} />
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
      <Route path="/leaderboards" component={Leaderboards} />
      <Route path="/noticeboard" component={Noticeboard} />
      <Route path="/video-library" component={VideoLibrary} />
      <Route path="/survey-builder" component={SurveyBuilder} />
      <Route path="/team-training" component={TeamTraining} />
      <Route path="/mc-pro-planner" component={McProPlanner} />

      {/* Athlete-facing protected routes */}
      <Route path="/dashboard">{() => <ProtectedRoute component={Dashboard} />}</Route>
      <Route path="/onboarding">{() => <ProtectedRoute component={Onboarding} />}</Route>
      <Route path="/athlete-setup">{() => <ProtectedRoute component={AthleteSetup} />}</Route>
      <Route path="/athlete">{() => <ProtectedRoute component={AthleteDashboard} />}</Route>
      <Route path="/athlete-dashboard">{() => <ProtectedRoute component={AthleteDashboard} />}</Route>
      <Route path="/coach">{() => <ProtectedRoute component={CoachDashboard} />}</Route>
      <Route path="/clinician">{() => <ProtectedRoute component={ClinicianDashboard} />}</Route>
      <Route path="/find-clinic">{() => <ProtectedRoute component={FindClinic} />}</Route>
      <Route path="/netball-pathway">{() => <ProtectedRoute component={NetballPathway} />}</Route>
      <Route path="/program/:slug">{() => <ProtectedRoute component={ProgramDetail} />}</Route>
      <Route path="/education">{() => <ProtectedRoute component={Education} />}</Route>
      <Route path="/education-modules">{() => <ProtectedRoute component={EducationModules} />}</Route>
      <Route path="/workshops">{() => <ProtectedRoute component={Workshops} />}</Route>
      <Route path="/pro">{() => <ProtectedRoute component={MotionCodePro} />}</Route>
      <Route path="/exercise/:id">{() => <ProtectedRoute component={ExerciseDetail} />}</Route>
      <Route path="/exercise-upload">{() => <ProtectedRoute component={ExerciseUpload} />}</Route>
      <Route path="/settings">{() => <ProtectedRoute component={Settings} />}</Route>
      <Route path="/help">{() => <ProtectedRoute component={Help} />}</Route>
      <Route path="/video-admin">{() => <ProtectedRoute component={VideoAdmin} />}</Route>
      <Route path="/video-mapping">{() => <ProtectedRoute component={VideoMapping} />}</Route>
      <Route path="/admin">{() => <ProtectedRoute component={AdminPanel} />}</Route>
      <Route path="/admin/exercises">{() => <ProtectedRoute component={ExerciseAdmin} />}</Route>
      <Route path="/nso">{() => <ProtectedRoute component={NSODashboard} />}</Route>
      <Route path="/community">{() => <ProtectedRoute component={Community} />}</Route>
      <Route path="/community/:slug">{() => <ProtectedRoute component={Community} />}</Route>
      <Route path="/community/:slug/post/:postId">{() => <ProtectedRoute component={Community} />}</Route>
      <Route path="/session/:exerciseIds">{() => <ProtectedRoute component={SessionPlayer} />}</Route>
      <Route path="/session">{() => <ProtectedRoute component={SessionPlayer} />}</Route>
      <Route path="/upgrade">{() => <ProtectedRoute component={Upgrade} />}</Route>
      <Route path="/upgrade/success">{() => <ProtectedRoute component={UpgradeSuccess} />}</Route>
      <Route path="/messages">{() => <ProtectedRoute component={CoachMessages} />}</Route>

      <Route component={NotFound} />
    </Switch>
  );
}

// ── Mobile router (/m/* routes) ────────────────────────────────────────────
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

// ── Desktop layout with sidebar ────────────────────────────────────────────
const SIDEBAR_STYLE = {
  "--sidebar-width": "16rem",
  "--sidebar-width-icon": "4rem",
} as React.CSSProperties;

function DesktopLayout() {
  return (
    <SidebarProvider style={SIDEBAR_STYLE}>
      <div className="flex h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center px-4 py-3 border-b border-border">
            <SidebarTrigger data-testid="button-sidebar-toggle" className="hover-elevate" />
          </header>
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-[1400px] mx-auto p-6">
              <DesktopRouter />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

// ── Root app — route to correct layout ────────────────────────────────────
export default function App() {
  const [location] = useLocation();
  const isMobileRoute = location.startsWith("/m");
  const isPublicRoute = ["/", "/preview", "/login", "/signup", "/forgot-password", "/reset-password", "/pricing"].some(p => location === p) || location.startsWith("/join/");

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {isMobileRoute ? (
          <MobileRouter />
        ) : isPublicRoute ? (
          <PublicRouter />
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
