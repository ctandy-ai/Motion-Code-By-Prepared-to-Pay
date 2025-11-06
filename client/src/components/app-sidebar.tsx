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
    <Sidebar data-testid="app-sidebar" className="bglass shadow-glass border-0 m-5 rounded-2xl">
      <SidebarHeader className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand-600 flex items-center justify-center font-extrabold text-white p-2">
            <StrideLogo className="h-full w-full" />
          </div>
          <div>
            <h2 className="font-heading text-base font-bold text-slate-100">
              StrideCode <span className="text-brand-300">Pro</span>
            </h2>
            <p className="text-[11px] text-slate-400">Design Programs · Track Progress</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-4">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location === item.url;
            return (
              <Link 
                key={item.url}
                href={item.url}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-white/10 text-slate-100' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
                data-testid={`nav-${item.title.toLowerCase()}`}
              >
                <item.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white font-semibold text-sm">
            C
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-100 truncate">Coach User</p>
            <p className="text-xs text-slate-400 truncate">coach@elite.com</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
