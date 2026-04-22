import { useEffect } from "react";
import { useLocation } from "wouter";
import { CheckCircle, Zap, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useTier } from "@/hooks/useTier";
import { queryClient } from "@/lib/queryClient";

export default function UpgradeSuccess() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { effectiveTier } = useTier();

  useEffect(() => {
    // Refresh user and billing status after payment
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/billing/status"] });
    }, 2000);
  }, []);

  const isPro = effectiveTier === "pro";
  const role = user?.role;

  return (
    <div className="min-h-screen bg-[#0A0C12] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 rounded-full bg-[#FF6432]/10 border-4 border-[#FF6432]/30 flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-[#FF6432]" />
          </div>
        </div>

        <h1 className="text-4xl font-extrabold uppercase tracking-tight text-[#EEF2F6] mb-3">
          You're in.
        </h1>
        <div className="inline-flex items-center gap-2 mb-4">
          {isPro ? <Star className="w-5 h-5 text-amber-400" /> : <Zap className="w-5 h-5 text-[#FF6432]" />}
          <span className={`font-bold text-lg uppercase tracking-wide ${isPro ? "text-amber-400" : "text-[#FF6432]"}`}>
            {isPro ? "Pro Activated" : "Season Pass Activated"}
          </span>
        </div>

        <p className="text-[#6A8499] text-base mb-8">
          {isPro
            ? "Your Pro subscription is live. The program builder, team management, and all coach tools are now unlocked."
            : "Your Season Pass is active. Your personalised Movement Blueprint is ready — let's go."}
        </p>

        <div className="bg-[#132130] border border-[#1A2D3F] rounded-xl p-6 mb-8 text-left">
          <p className="text-[#EEF2F6] font-semibold mb-4">What's unlocked:</p>
          <ul className="space-y-2">
            {isPro ? [
              "Enhanced program builder — 52-week periodization",
              "Phase & wave week load budgets",
              "Team management & athlete roster",
              "Coach messaging centre",
              "Compliance dashboard",
              "CPD certificates",
              "Wellness check-in tracking",
            ] : [
              "Movement Blueprint — your personalised 7-day plan",
              "All sessions with the full session player",
              "Complete exercise library (White, Blue & Black belt)",
              "ACL prevention education hub",
              "Community — post and connect",
              "Find a Clinic directory",
            ]}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          {role === "coach" || isPro ? (
            <Button
              className="w-full bg-[#FF6432] hover:bg-[#FF7A52] text-white font-bold uppercase tracking-wide"
              onClick={() => navigate("/coach")}
            >
              Go to Coach Dashboard <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          ) : (
            <Button
              className="w-full bg-[#FF6432] hover:bg-[#FF7A52] text-white font-bold uppercase tracking-wide"
              onClick={() => navigate("/athlete")}
            >
              View My Movement Blueprint <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            className="w-full text-[#6A8499] hover:text-[#EEF2F6]"
            onClick={() => navigate("/settings")}
          >
            Manage subscription in Settings
          </Button>
        </div>

        <p className="text-[#6A8499] text-xs mt-6">
          A confirmation email has been sent to {user?.email}
        </p>
      </div>
    </div>
  );
}
