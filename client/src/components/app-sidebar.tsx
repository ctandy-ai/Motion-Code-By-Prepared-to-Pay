import {
  Home,
  Users,
  Calendar,
  BookOpen,
  FileText,
  Wrench,
  Database,
  Library,
  ChevronRight,
  Wand2,
  Calculator,
  BarChart3,
  Brain,
  Zap,
  MessageSquare,
  Shield,
  Trophy,
  Megaphone,
  Video,
  ClipboardList,
  Users2,
  SlidersHorizontal,
} from "lucide-react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import p2pLogo from "@assets/download_1762768481735.png";

const coreItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Athletes", url: "/athletes", icon: Users },
  { title: "Programs", url: "/programs", icon: BookOpen },
  { title: "Templates", url: "/templates", icon: FileText },
  { title: "Exercises", url: "/exercises", icon: Library },
];

const planItems = [
  { title: "Calendar", url: "/calendar", icon: Calendar },
  { title: "Team Training", url: "/team-training", icon: Users2 },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Leaderboards", url: "/leaderboards", icon: Trophy },
];

const communicationItems = [
  { title: "Messages", url: "/coach/messages", icon: MessageSquare },
  { title: "Noticeboard", url: "/noticeboard", icon: Megaphone },
  { title: "Video Library", url: "/video-library", icon: Video },
];

const toolsItems = [
  { title: "AI Command Center", url: "/ai-command-center", icon: Brain },
  { title: "Master Database", url: "/coach-tools", icon: Database },
  { title: "AI Classifier", url: "/ai-classifier", icon: Wand2 },
  { title: "RM Calculator", url: "/rm-calculator", icon: Calculator },
  { title: "Coaching Rules", url: "/heuristics", icon: SlidersHorizontal },
  { title: "VALD Hub", url: "/vald", icon: Zap },
  { title: "Survey Builder", url: "/survey-builder", icon: ClipboardList },
  { title: "Audit Logs", url: "/audit-logs", icon: Shield },
];

interface NavGroupProps {
  label: string;
  items: { title: string; url: string; icon: any }[];
  location: string;
}

function NavGroup({ label, items, location }: NavGroupProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                asChild
                isActive={location === item.url}
                data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function CollapsibleNavGroup({
  label,
  items,
  location,
  icon: GroupIcon,
}: NavGroupProps & { icon: any }) {
  const isActive = items.some((item) => location === item.url);
  const [open, setOpen] = useState(isActive);

  return (
    <SidebarGroup>
      <Collapsible open={open} onOpenChange={setOpen}>
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger
            className="flex w-full items-center gap-2"
            data-testid={`nav-group-${label.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <GroupIcon className="h-4 w-4" />
            {label}
            <ChevronRight
              className={`ml-auto h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`}
            />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </Collapsible>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar data-testid="app-sidebar">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <img
              src={p2pLogo}
              alt="Prepared to Play"
              className="h-9 w-auto object-contain"
            />
          </div>
          <div className="flex items-center gap-1.5 pl-1">
            <h2 className="font-bold text-sm text-sidebar-foreground">
              MotionCode{" "}
              <span className="text-amber-500">Pro</span>
            </h2>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavGroup label="Core" items={coreItems} location={location} />
        <NavGroup label="Plan & Track" items={planItems} location={location} />
        <NavGroup
          label="Communication"
          items={communicationItems}
          location={location}
        />
        <CollapsibleNavGroup
          label="Tools & Admin"
          items={toolsItems}
          location={location}
          icon={Wrench}
        />
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
            CU
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-sidebar-foreground truncate">
              Coach User
            </div>
            <div className="text-xs text-muted-foreground">Strength Coach</div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
