import { useLocation, Link } from "wouter";
import { Home, Dumbbell, Heart, MessageCircle, User } from "lucide-react";

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { path: "/m", label: "Home", icon: <Home className="w-5 h-5" /> },
  { path: "/m/workout", label: "Workout", icon: <Dumbbell className="w-5 h-5" /> },
  { path: "/m/wellness", label: "Wellness", icon: <Heart className="w-5 h-5" /> },
  { path: "/m/messages", label: "Messages", icon: <MessageCircle className="w-5 h-5" /> },
  { path: "/m/profile", label: "Profile", icon: <User className="w-5 h-5" /> },
];

export function MobileBottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-ink-1/95 backdrop-blur-lg border-t border-ink-3 safe-area-pb" data-testid="mobile-bottom-nav">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location === item.path || 
            (item.path !== "/m" && location.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-slate-400 active:text-slate-200"
              }`}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <div className={`transition-transform ${isActive ? 'scale-110' : ''}`}>
                {item.icon}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
