import { Home, Dumbbell, Users, Calendar, TrendingUp, BookOpen, ClipboardCheck, FileText } from "lucide-react";
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
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { StrideLogo } from "@/components/stride-logo";

const menuItems = [
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
    title: "Exercises",
    url: "/exercises",
    icon: Dumbbell,
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
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar data-testid="app-sidebar" className="!bg-transparent bglass shadow-glass border-0 m-5 rounded-2xl">
      <SidebarHeader className="p-4 border-b border-white/10 !bg-transparent">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand-600 flex items-center justify-center font-extrabold text-white p-2">
            <StrideLogo className="h-full w-full text-white" />
          </div>
          <div>
            <h2 className="font-bold -mb-0.5 text-slate-100">
              StrideCode <span className="text-brand-300">Pro</span>
            </h2>
            <p className="text-[11px] text-slate-400">Design Programs · Track Progress</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-4 !bg-transparent">
        <nav className="mt-4 space-y-1">
          {menuItems.map((item) => {
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
