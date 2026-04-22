import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { User, Dumbbell, Stethoscope, ArrowRight, Check } from "lucide-react";

type Role = "athlete" | "coach" | "clinician";

interface RoleOption {
  id: Role;
  title: string;
  description: string;
  icon: typeof User;
  features: string[];
  color: string;
}

interface PartnerOrgInfo {
  name: string;
  slug: string;
  sport: string;
  welcomeMessage: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
}

const roleOptions: RoleOption[] = [
  {
    id: "athlete",
    title: "I'm an Athlete",
    description: "Get personalised training sessions to move better and stay injury-free",
    icon: User,
    features: [
      "Daily 10-20 minute guided sessions",
      "Track your progress and streaks",
      "ACL & injury prevention exercises",
      "Pre-season ready programs"
    ],
    color: "from-green-500 to-emerald-600"
  },
  {
    id: "coach",
    title: "I'm a Coach",
    description: "Equip your team with evidence-based warm-ups and training protocols",
    icon: Dumbbell,
    features: [
      "Ready-to-use warm-up blocks",
      "Share sessions with your team",
      "Track team compliance",
      "Connect to provider network"
    ],
    color: "from-blue-500 to-indigo-600"
  },
  {
    id: "clinician",
    title: "I'm a Clinician / S&C",
    description: "Access clinical-grade programming and connect with the provider network",
    icon: Stethoscope,
    features: [
      "Full P2P exercise library",
      "RTP criteria & progressions",
      "Create treatment plans",
      "Join the provider directory"
    ],
    color: "from-purple-500 to-violet-600"
  }
];

export default function Onboarding() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [partnerOrg, setPartnerOrg] = useState<PartnerOrgInfo | null>(null);

  const searchParams = new URLSearchParams(searchString);
  const sportParam = searchParams.get("sport");
  const orgParam = searchParams.get("org");

  useEffect(() => {
    if (orgParam) {
      fetch(`/api/partner-orgs/validate/${encodeURIComponent(orgParam)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setPartnerOrg(data);
        })
        .catch(() => {});
    }
  }, [orgParam]);

  async function handleContinue() {
    if (!selectedRole) {
      toast({
        title: "Please select a role",
        description: "Choose how you'll be using MotionCode",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      const res = await apiRequest("PATCH", "/api/auth/user/role", { role: selectedRole });
      const result = await res.json();

      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        toast({
          title: "Welcome to MotionCode!",
          description: `Your ${selectedRole} dashboard is ready`
        });
        
        if (selectedRole === "athlete") {
          const params = new URLSearchParams();
          if (sportParam) params.set("sport", sportParam);
          if (orgParam) params.set("org", orgParam);
          const queryStr = params.toString();
          navigate(`/athlete-setup${queryStr ? `?${queryStr}` : ""}`);
        } else if (selectedRole === "coach") {
          navigate("/coach");
        } else if (selectedRole === "clinician") {
          navigate("/clinician");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error: any) {
      toast({
        title: "Something went wrong",
        description: error.message || "Could not update your profile",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-p2p-dark flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {partnerOrg && partnerOrg.welcomeMessage && (
          <div
            className="mb-6 rounded-xl border p-4 text-center border-p2p-orange/40 bg-p2p-orange/5"
          >
            <p className="text-white text-lg font-semibold">{partnerOrg.welcomeMessage}</p>
            <p className="text-gray-400 text-sm mt-1">
              via <span className="text-p2p-orange">{partnerOrg.name}</span>
            </p>
          </div>
        )}

        <div className="text-center mb-10">
          <h1 className="font-heading text-3xl md:text-5xl font-bold text-white mb-3">
            Welcome to Motion Code
          </h1>
          <p className="text-gray-400 text-lg">
            Tell us how you'll be using the platform so we can personalise your experience
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {roleOptions.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            
            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`relative p-6 rounded-2xl border-2 transition-all duration-300 text-left
                  ${isSelected 
                    ? "border-p2p-electric bg-gradient-to-br from-p2p-blue/20 to-p2p-electric/10 scale-[1.02]" 
                    : "border-gray-800 bg-gradient-to-br from-gray-900 to-black hover:border-gray-700"
                  }`}
                data-testid={`role-${role.id}`}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-p2p-electric flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                
                <h3 className="font-heading text-xl font-bold text-white mb-2">
                  {role.title}
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {role.description}
                </p>
                
                <ul className="space-y-2">
                  {role.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-p2p-electric" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handleContinue}
            disabled={!selectedRole || isLoading}
            className="px-8 py-6 text-lg bg-gradient-to-r from-p2p-blue to-p2p-electric hover:opacity-90 disabled:opacity-50"
            data-testid="button-continue"
          >
            {isLoading ? "Setting up..." : "Continue"}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
