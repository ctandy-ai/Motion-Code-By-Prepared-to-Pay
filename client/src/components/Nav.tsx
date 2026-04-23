import { LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import preparedToPlayLogo from "@/assets/p2p-logo-white.svg";
import { Link, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Nav() {
  const [, navigate] = useLocation();

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
    } catch (error) {
      console.error("Logout failed:", error);
    }
    
    // Clear query cache to prevent stale auth state
    queryClient.clear();
    // Clear the session cookie from browser (after server cleanup)
    document.cookie = "connect.sid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
    // Hard redirect to login page
    window.location.replace("/login");
  };

  return (
    <nav className="bg-p2p-dark/95 backdrop-blur-lg border-b border-p2p-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <img 
              src={preparedToPlayLogo} 
              alt="Prepared to Play" 
              className="h-12 w-auto"
            />
            <div className="flex flex-col">
              <h1 className="text-lg font-heading bg-gradient-to-r from-p2p-blue to-p2p-electric bg-clip-text text-transparent leading-tight">Motion Code</h1>
              <span className="text-xs font-body text-gray-400 leading-tight">by Prepared to Play</span>
            </div>
          </Link>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="hover:bg-p2p-surface rounded-xl"
              onClick={() => navigate('/settings')}
              data-testid="button-settings"
            >
              <Settings className="h-5 w-5 text-gray-400" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="hover:bg-p2p-surface rounded-xl"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="h-5 w-5 text-gray-400" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
