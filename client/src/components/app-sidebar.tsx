import { Home, Dumbbell, Users, Calendar, TrendingUp, BookOpen, ClipboardCheck, FileText, Wrench, Database, Library, ChevronRight, Wand2, Calculator, BarChart3, Brain, Zap } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";
import p2pLogo from "@assets/download_1762768481735.png";

const mainMenuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Workout",
    url: "/workout",
    icon: ClipboardCheck,
  },
  {
    title: "Programs",
    url: "/programs",
    icon: BookOpen,
  },
  {
    title: "Templates",
    url: "/templates",
    icon: FileText,
  },
  {
    title: "Athletes",
    url: "/athletes",
    icon: Users,
  },
  {
    title: "Calendar",
    url: "/calendar",
    icon: Calendar,
  },
  {
    title: "Progress",
    url: "/progress",
    icon: TrendingUp,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
  },
  {
    title: "AI Command Center",
    url: "/ai-command-center",
    icon: Brain,
  },
];

const coachToolsItems = [
  {
    title: "Master Database",
    url: "/coach-tools",
    icon: Database,
    description: "1,769 TeamBuildr exercises",
    isPro: true,
  },
  {
    title: "Exercise Library",
    url: "/exercises",
    icon: Library,
    description: "Your custom exercises",
  },
  {
    title: "AI Classifier",
    url: "/ai-classifier",
    icon: Wand2,
    description: "Test AI classifications",
    isPro: true,
  },
  {
    title: "RM Calculator",
    url: "/rm-calculator",
    icon: Calculator,
    description: "Calculate 1RM & percentages",
    isPro: true,
  },
  {
    title: "Intelligence Rules",
    url: "/heuristics",
    icon: Brain,
    description: "AI coaching heuristics",
    isPro: true,
  },
  {
    title: "VALD Hub",
    url: "/vald",
    icon: Zap,
    description: "Sync VALD testing data",
    isPro: true,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const [coachToolsOpen, setCoachToolsOpen] = useState(true);

  const isCoachToolsActive = coachToolsItems.some(item => location === item.url);

  return (
    <Sidebar data-testid="app-sidebar" className="!bg-transparent bglass shadow-glass border-0 m-5 rounded-2xl">
      <SidebarHeader className="p-4 border-b border-white/10 !bg-transparent">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <img 
              src={p2pLogo} 
              alt="Prepared to Play" 
              className="h-9 w-auto object-contain"
            />
          </div>
          <div className="flex items-center gap-1.5 pl-1">
            <h2 className="font-bold text-sm">
              <span className="bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">MotionCode</span>
              {" "}
              <span className="bg-gradient-to-r from-pro-gold to-amber-400 bg-clip-text text-transparent">Pro</span>
            </h2>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-4 !bg-transparent">
        <nav className="mt-4 space-y-1">
          {/* Main Menu Items */}
          {mainMenuItems.map((item) => {
            const isActive = location === item.url;
            return (
              <Link 
                key={item.url}
                href={item.url}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl font-medium transition-colors ${
                  isActive 
                    ? 'bg-white/10 text-slate-100' 
                    : 'text-slate-200 hover:bg-white/5'
                }`}
                data-testid={`nav-${item.title.toLowerCase()}`}
              >
                <item.icon className="h-4 w-4" />
                <span className="text-sm">{item.title}</span>
              </Link>
            );
          })}

          {/* Coach Tools Collapsible Section */}
          <Collapsible 
            open={coachToolsOpen} 
            onOpenChange={setCoachToolsOpen}
            className="group/collapsible"
          >
            <CollapsibleTrigger asChild>
              <button
                className={`flex w-full items-center justify-between gap-3 px-3 py-2 rounded-xl font-medium transition-colors ${
                  isCoachToolsActive
                    ? 'bg-white/10 text-slate-100'
                    : 'text-slate-200 hover:bg-white/5'
                }`}
                data-testid="nav-coach-tools"
              >
                <div className="flex items-center gap-3">
                  <Wrench className="h-4 w-4" />
                  <span className="text-sm">Coach Tools</span>
                </div>
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${
                    coachToolsOpen ? 'rotate-90' : ''
                  }`}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1 space-y-0.5">
              {coachToolsItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <Link
                    key={item.url}
                    href={item.url}
                    className={`flex items-start gap-3 pl-10 pr-3 py-2 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-cyan-500/10 text-cyan-400'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <item.icon className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium">{item.title}</span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        </nav>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/10 !bg-transparent">
        <div className="mt-6 p-3 rounded-xl ringify">
          <div className="text-xs text-slate-400 mb-2">Current User</div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-800 flex items-center justify-center font-bold text-white">
              CU
            </div>
            <div>
              <div className="font-semibold text-slate-100">Coach User</div>
              <div className="text-[11px] text-slate-400">Elite · Strength</div>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
