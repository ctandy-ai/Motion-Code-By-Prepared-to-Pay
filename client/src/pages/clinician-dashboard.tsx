import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  FileText, 
  Activity, 
  MapPin, 
  LogOut,
  Settings,
  BookOpen,
  ClipboardList,
  TrendingUp,
  Building2
} from "lucide-react";
import preparedToPlayLogo from "@/assets/p2p-logo-white.svg";
import { apiRequest, queryClient } from "@/lib/queryClient";

type User = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
};

export default function ClinicianDashboard() {
  const [, navigate] = useLocation();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-p2p-dark flex items-center justify-center">
        <div className="animate-pulse text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-p2p-dark to-p2p-surface">
      <header className="bg-p2p-surface/90 border-b border-p2p-border sticky top-0 z-50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={preparedToPlayLogo} alt="Prepared to Play" className="h-10" />
            <div>
              <h1 className="text-lg font-bold text-white">Motion Code</h1>
              <p className="text-xs text-p2p-muted">Clinician Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/settings")}
              className="text-p2p-muted hover:text-white hover:bg-p2p-surface"
              data-testid="button-settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-p2p-muted hover:text-white hover:bg-p2p-surface"
              data-testid="button-logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">
            Welcome, {user?.firstName || "Clinician"}
          </h2>
          <p className="text-p2p-muted">Access clinical tools and patient resources</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-p2p-surface2/50 border-p2p-border text-center p-4">
            <Users className="h-6 w-6 mx-auto mb-2 text-blue-400" />
            <div className="text-2xl font-bold text-white">24</div>
            <div className="text-xs text-p2p-muted">Active Patients</div>
          </Card>
          <Card className="bg-p2p-surface2/50 border-p2p-border text-center p-4">
            <FileText className="h-6 w-6 mx-auto mb-2 text-green-400" />
            <div className="text-2xl font-bold text-white">8</div>
            <div className="text-xs text-p2p-muted">Treatment Plans</div>
          </Card>
          <Card className="bg-p2p-surface2/50 border-p2p-border text-center p-4">
            <Activity className="h-6 w-6 mx-auto mb-2 text-yellow-400" />
            <div className="text-2xl font-bold text-white">92%</div>
            <div className="text-xs text-p2p-muted">Avg Compliance</div>
          </Card>
          <Card className="bg-p2p-surface2/50 border-p2p-border text-center p-4">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-purple-400" />
            <div className="text-2xl font-bold text-white">18</div>
            <div className="text-xs text-p2p-muted">RTP This Month</div>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-p2p-surface2/50 border-p2p-border">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-400" />
                Exercise Library
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-p2p-muted mb-4">
                Full access to the P2P exercise library with clinical language, 
                progressions, and RTP criteria.
              </p>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => navigate("/exercises")}
                data-testid="button-exercise-library"
              >
                Browse Exercises
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-p2p-surface2/50 border-p2p-border">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-green-400" />
                Treatment Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-p2p-muted mb-4">
                Create and export treatment plans using evidence-based protocols
                and Rehab Bond integration.
              </p>
              <Button 
                variant="outline" 
                className="w-full border-p2p-border text-white hover:bg-p2p-border"
                data-testid="button-treatment-plans"
              >
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-p2p-surface2/50 border-p2p-border mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-orange-400" />
              Clinic Listing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-p2p-muted mb-2">
                  Manage your clinic's directory listing and service offerings.
                </p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="border-green-500 text-green-400">
                    Triple Hop Provider
                  </Badge>
                  <Badge variant="outline" className="border-blue-500 text-blue-400">
                    Movement Screening
                  </Badge>
                </div>
              </div>
              <Button 
                variant="outline"
                onClick={() => navigate("/find-clinic")}
                className="border-p2p-border text-white hover:bg-p2p-border"
                data-testid="button-manage-listing"
              >
                <MapPin className="h-4 w-4 mr-2" />
                View Directory
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Activity className="h-10 w-10 text-purple-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-white mb-1">Rehab Bond Integration</h3>
                <p className="text-sm text-slate-300">
                  Connect with the Rehab Bond analytics platform for advanced patient 
                  tracking, RTP protocols, and outcome measurement.
                </p>
                <Button variant="link" className="text-purple-400 p-0 h-auto mt-2" data-testid="link-rehab-bond">
                  Learn more about Rehab Bond →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
