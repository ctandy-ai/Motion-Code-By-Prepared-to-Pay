import { Link, useLocation } from "wouter";
import { useState } from "react";
import { 
  LayoutDashboard, 
  BookOpen, 
  Target, 
  Settings, 
  MessageCircle,
  MessageSquare,
  Layers,
  LogOut,
  User,
  X,
  Calendar,
  Menu,
  Shield,
  Sparkles,
  Users,
  Building2,
  MapPin,
  HelpCircle,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import logoImage from "@assets/download_1753006535107.png";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { usePartnerOrg } from "@/hooks/usePartnerOrg";

interface SidebarProps {
  user?: any;
}

export function Sidebar({ user }: SidebarProps) {
  const [location, navigate] = useLocation();
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { partnerOrg, isWhiteLabel, primaryColor } = usePartnerOrg();

  const isAdmin = user?.role === 'admin';
  const isCoach = ['coach', 'clinician', 'admin'].includes(user?.role || '');
  const isNSOAdmin = user?.role === 'nso_admin' || user?.role === 'admin';

  // Grouped navigation structure
  const navGroups = [
    {
      label: null,
      items: [
        {
          href: "/dashboard",
          icon: LayoutDashboard,
          label: "Dashboard",
          active: location === "/dashboard" || location === "/",
        },
      ],
    },
    {
      label: "Learn",
      items: [
        {
          href: "/exercises",
          icon: Target,
          label: "Movement Library",
          active: location === "/exercises",
        },
        {
          href: "/education",
          icon: BookOpen,
          label: "Education Hub",
          active: location === "/education",
        },
        ...(isCoach ? [{
          href: "/education-modules",
          icon: BookOpen,
          label: "Coach Education",
          active: location === "/education-modules",
        }] : []),
        {
          href: "/workshops",
          icon: Calendar,
          label: "Workshops",
          active: location === "/workshops",
        },
      ],
    },
    {
      label: "Community",
      items: [
        {
          href: "/community",
          icon: Users,
          label: "Discussion Boards",
          active: location.startsWith("/community"),
        },
        {
          href: "/find-clinic",
          icon: MapPin,
          label: "Find a Clinic",
          active: location === "/find-clinic",
        },
        {
          href: "/messages",
          icon: MessageSquare,
          label: "Messages",
          active: location === "/messages",
        },
      ],
    },
    ...(isCoach ? [{
      label: "Coach Tools",
      items: [
        {
          href: "/program-builder",
          icon: Layers,
          label: "Program Builder",
          active: location === "/program-builder",
          badge: "Pro",
        },
      ],
    }] : []),
    ...(isNSOAdmin || isAdmin ? [{
      label: "Admin",
      items: [
        ...(isNSOAdmin ? [{
          href: "/nso",
          icon: Building2,
          label: "NSO Dashboard",
          active: location === "/nso",
        }] : []),
        ...(isAdmin ? [{
          href: "/admin",
          icon: Shield,
          label: "Admin Panel",
          active: location === "/admin",
        }] : []),
      ],
    }] : []),
    {
      label: null,
      items: [
        {
          href: "/pro",
          icon: Sparkles,
          label: "Motion Code Pro",
          active: location === "/pro",
          badge: "Soon",
        },
      ],
    },
  ];

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
    } catch {}
    queryClient.clear();
    document.cookie = "connect.sid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.replace("/login");
  };

  const NavItem = ({ item }: { item: typeof navGroups[0]["items"][0] }) => {
    const Icon = item.icon;
    const isActive = item.active;
    return (
      <Link
        to={item.href}
        onClick={() => setMobileMenuOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
          isActive
            ? isWhiteLabel
              ? "text-white shadow-sm"
              : "bg-gradient-to-r from-p2p-blue to-p2p-electric text-white shadow-sm"
            : "text-gray-400 hover:text-white hover:bg-white/5"
        }`}
        style={isActive && isWhiteLabel ? { background: primaryColor } : undefined}
        data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <Icon className={`w-4 h-4 shrink-0 ${isActive ? "opacity-100" : "opacity-60 group-hover:opacity-100"}`} />
        <span className="flex-1 font-body">{item.label}</span>
        {(item as any).badge && (
          <span className="px-1.5 py-0.5 bg-p2p-electric/15 text-p2p-electric text-[10px] font-bold rounded border border-p2p-electric/20 leading-none">
            {(item as any).badge}
          </span>
        )}
        {isActive && (
          <ChevronRight className="w-3 h-3 opacity-60" />
        )}
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div className="px-6 py-5 border-b border-p2p-border">
        {isWhiteLabel && partnerOrg ? (
          <div>
            {partnerOrg.logoUrl && (
              <img src={partnerOrg.logoUrl} alt={partnerOrg.name} className="h-8 mb-2 object-contain" />
            )}
            <div className="flex items-baseline gap-2">
              <h1 className="font-heading text-lg font-bold text-white">{partnerOrg.name}</h1>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Powered by Prepared to Play</p>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="Prepared to Play" className="h-8 w-8 object-contain rounded" />
            <div>
              <h1 className="font-heading text-base font-bold text-white leading-tight">Motion Code</h1>
              <p className="text-[11px] text-gray-500">Prepared to Play</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-5 overflow-y-auto">
        {navGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            {group.label && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem key={item.href} item={item} />
              ))}
            </div>
          </div>
        ))}

        {/* Help & Support */}
        <div>
          <div className="space-y-0.5">
            <button
              onClick={() => { setShowChatDialog(true); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-150 group"
              data-testid="nav-help-and-support"
            >
              <HelpCircle className="w-4 h-4 shrink-0 opacity-60 group-hover:opacity-100" />
              <span className="font-body">Help & Support</span>
            </button>
            <Link
              to="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                location === "/settings"
                  ? "bg-white/8 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
              data-testid="nav-settings"
            >
              <Settings className={`w-4 h-4 shrink-0 ${location === "/settings" ? "opacity-100" : "opacity-60 group-hover:opacity-100"}`} />
              <span className="font-body">Settings</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* User profile + logout */}
      <div className="px-4 pb-4 pt-3 border-t border-p2p-border">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 mb-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isWhiteLabel ? "" : "bg-gradient-to-br from-p2p-blue to-p2p-electric"}`}
            style={isWhiteLabel ? { background: primaryColor } : undefined}
          >
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate leading-tight">
              {user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user?.email || "User"}
            </p>
            <p className="text-[11px] text-gray-500 capitalize leading-tight mt-0.5">
              {user?.role || "Member"}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-white hover:bg-white/5 transition-all duration-150 group"
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 shrink-0 opacity-60 group-hover:opacity-100" />
          <span className="font-body">Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2.5 bg-p2p-darker border border-p2p-border rounded-lg text-white hover:bg-white/5 transition-all"
        data-testid="button-mobile-menu"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-p2p-darker border-r border-p2p-border
        flex flex-col h-screen
        transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Mobile Close Button */}
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden absolute top-4 right-4 p-1.5 text-gray-500 hover:text-white transition-colors rounded"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>

        <SidebarContent />
      </div>

      {/* Help & Support Dialog */}
      <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
        <DialogContent className="sm:max-w-[460px] bg-p2p-darker border-p2p-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading text-white">Help & Support</DialogTitle>
            <DialogDescription className="text-gray-400">
              Get assistance with Motion Code
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-p2p-dark border border-p2p-border rounded-xl p-5 space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wide">Contact Us</h3>
                <div className="space-y-2">
                  <a
                    href="mailto:ctandy@preparedtoplay.com.au"
                    className="flex items-center gap-2.5 text-sm text-gray-300 hover:text-p2p-electric transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 text-p2p-electric shrink-0" />
                    ctandy@preparedtoplay.com.au
                  </a>
                  <a
                    href="tel:+61423538819"
                    className="flex items-center gap-2.5 text-sm text-gray-300 hover:text-p2p-electric transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 text-p2p-electric shrink-0" />
                    0423 538 819
                  </a>
                </div>
              </div>

              <div className="pt-3 border-t border-p2p-border">
                <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wide">Quick Links</h3>
                <div className="space-y-1.5">
                  {[
                    { href: "/education", label: "Education Resources" },
                    { href: "/exercises", label: "Movement Library" },
                    { href: "/find-clinic", label: "Find a Clinic" },
                  ].map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-2 text-sm text-gray-400 hover:text-p2p-electric transition-colors py-1"
                      onClick={() => setShowChatDialog(false)}
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
