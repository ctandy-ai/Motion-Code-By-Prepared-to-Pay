import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { User, Dumbbell, Stethoscope, ArrowRight, Check, Star } from "lucide-react";

type Role = "athlete" | "coach" | "clinician";
type Step = "role" | "sport-confirm";

interface PartnerOrgInfo {
  name: string;
  slug: string;
  sport: string;
  welcomeMessage: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
}

export default function Onboarding() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [step, setStep] = useState<Step>("role");
  const [isLoading, setIsLoading] = useState(false);
  const [partnerOrg, setPartnerOrg] = useState<PartnerOrgInfo | null>(null);

  const searchParams = new URLSearchParams(searchString);
  const sportParam = searchParams.get("sport");
  const orgParam = searchParams.get("org");

  useEffect(() => {
    if (orgParam) {
      fetch(`/api/partner-orgs/validate/${encodeURIComponent(orgParam)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => { if (data) setPartnerOrg(data); })
        .catch(() => {});
    }
  }, [orgParam]);

  async function handleContinue() {
    if (!selectedRole) {
      toast({ title: "Please select a role", variant: "destructive" });
      return;
    }

    // Athletes: show netball confirmation step first
    if (selectedRole === "athlete" && step === "role") {
      setStep("sport-confirm");
      return;
    }

    try {
      setIsLoading(true);
      const res = await apiRequest("PATCH", "/api/auth/user/role", { role: selectedRole });
      const result = await res.json();

      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        toast({ title: "Welcome to Motion Code!", description: `Your dashboard is ready` });

        if (selectedRole === "athlete") {
          const params = new URLSearchParams();
          if (sportParam) params.set("sport", sportParam || "netball");
          if (orgParam) params.set("org", orgParam);
          const queryStr = params.toString();
          navigate(`/athlete-setup${queryStr ? `?${queryStr}` : "?sport=netball"}`);
        } else if (selectedRole === "coach") {
          navigate("/coach");
        } else if (selectedRole === "clinician") {
          navigate("/clinician");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error: any) {
      toast({ title: "Something went wrong", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  // ── Step 2: Netball ACL confirmation for athletes ──
  if (step === "sport-confirm") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ background: "#0C1A27" }}>
        <div className="w-full max-w-xl text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center text-3xl"
            style={{ background: "rgba(232,96,28,0.12)", border: "1px solid rgba(232,96,28,0.3)" }}>
            🏐
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 text-xs font-semibold uppercase tracking-wide"
            style={{ background: "rgba(232,96,28,0.1)", color: "#E8601C", border: "1px solid rgba(232,96,28,0.2)" }}>
            <Star className="w-3 h-3" />
            Evidence-Based ACL Prevention
          </div>

          <h2 className="text-3xl font-extrabold text-white mb-4 leading-tight">
            You're about to start the only program<br />
            <span style={{ color: "#E8601C" }}>built specifically for netball.</span>
          </h2>

          <div className="rounded-2xl p-6 mb-6 text-left space-y-4"
            style={{ background: "#0f2233", border: "1px solid rgba(255,255,255,0.08)" }}>
            {[
              { stat: "8 weeks", label: "Progressive training program" },
              { stat: "20 min", label: "Per session — fits around training" },
              { stat: "50%", label: "ACL risk reduction with high compliance" },
              { stat: "Zero", label: "Equipment needed to get started" },
            ].map((item) => (
              <div key={item.stat} className="flex items-center gap-4">
                <div className="text-2xl font-extrabold w-20 shrink-0" style={{ color: "#E8601C" }}>
                  {item.stat}
                </div>
                <div className="text-sm" style={{ color: "#94a3b8" }}>{item.label}</div>
              </div>
            ))}
          </div>

          <p className="text-sm mb-8" style={{ color: "#64748b" }}>
            Backed by research from the British Journal of Sports Medicine.
            The same science used by elite netball programs — now available to every player.
          </p>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleContinue}
              disabled={isLoading}
              className="w-full h-12 text-base font-bold"
              style={{ background: "#E8601C", color: "#0C1A27" }}
              data-testid="button-start-netball"
            >
              {isLoading ? "Setting up..." : "Start My Program"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <button
              onClick={() => setStep("role")}
              className="text-sm py-2 transition-colors"
              style={{ color: "#64748b" }}
            >
              ← Back to role selection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 1: Role selection ──
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: "#0C1A27" }}>
      <div className="w-full max-w-4xl">

        {partnerOrg?.welcomeMessage && (
          <div className="mb-6 rounded-xl border p-4 text-center"
            style={{ borderColor: "rgba(232,96,28,0.4)", background: "rgba(232,96,28,0.05)" }}>
            <p className="text-white text-lg font-semibold">{partnerOrg.welcomeMessage}</p>
            <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>
              via <span style={{ color: "#E8601C" }}>{partnerOrg.name}</span>
            </p>
          </div>
        )}

        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2.5 mb-5">
            <div className="w-8 h-8 flex items-center justify-center font-extrabold text-xs"
              style={{ background: "#E8601C", color: "#0C1A27" }}>MC</div>
            <span className="font-bold tracking-wide text-white text-lg">Motion Code</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
            Who are you?
          </h1>
          <p className="text-base" style={{ color: "#64748b" }}>
            We'll personalise your experience from day one.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-10">

          {/* Athlete — featured */}
          <button
            onClick={() => setSelectedRole("athlete")}
            className="relative p-6 rounded-2xl text-left transition-all duration-200 md:col-span-1"
            style={{
              border: selectedRole === "athlete"
                ? "2px solid #E8601C"
                : "2px solid rgba(232,96,28,0.25)",
              background: selectedRole === "athlete"
                ? "rgba(232,96,28,0.08)"
                : "rgba(232,96,28,0.04)",
              transform: selectedRole === "athlete" ? "scale(1.02)" : "scale(1)",
            }}
            data-testid="role-athlete"
          >
            {/* Featured badge */}
            <div className="absolute -top-3 left-6 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
              style={{ background: "#E8601C", color: "#0C1A27" }}>
              <Star className="w-3 h-3" />
              Featured
            </div>

            {selectedRole === "athlete" && (
              <div className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: "#E8601C" }}>
                <Check className="w-4 h-4" style={{ color: "#0C1A27" }} />
              </div>
            )}

            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 mt-2"
              style={{ background: "rgba(232,96,28,0.15)" }}>
              <User className="w-7 h-7" style={{ color: "#E8601C" }} />
            </div>

            <h3 className="text-xl font-bold text-white mb-2">I'm an Athlete</h3>
            <p className="text-sm mb-4" style={{ color: "#94a3b8" }}>
              Get the evidence-based ACL prevention program built for your sport.
            </p>

            <ul className="space-y-2">
              {[
                "🏐 Netball ACL prevention program",
                "Daily 15–20 min guided sessions",
                "Track progress & streaks",
                "Pre-season ready in 8 weeks",
              ].map((f) => (
                <li key={f} className="text-sm flex items-center gap-2" style={{ color: "#cbd5e1" }}>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#E8601C" }} />
                  {f}
                </li>
              ))}
            </ul>
          </button>

          {/* Coach */}
          <button
            onClick={() => setSelectedRole("coach")}
            className="relative p-6 rounded-2xl text-left transition-all duration-200"
            style={{
              border: selectedRole === "coach" ? "2px solid #3b82f6" : "2px solid rgba(255,255,255,0.08)",
              background: selectedRole === "coach" ? "rgba(59,130,246,0.08)" : "#0f2233",
              transform: selectedRole === "coach" ? "scale(1.02)" : "scale(1)",
            }}
            data-testid="role-coach"
          >
            {selectedRole === "coach" && (
              <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="w-14 h-14 rounded-xl bg-blue-500/15 flex items-center justify-center mb-4">
              <Dumbbell className="w-7 h-7 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">I'm a Coach</h3>
            <p className="text-sm mb-4" style={{ color: "#94a3b8" }}>
              Manage your team with evidence-based programs and compliance tracking.
            </p>
            <ul className="space-y-2">
              {[
                "Assign programs to athletes",
                "Track team compliance",
                "AI coaching assistant",
                "VALD testing integration",
              ].map((f) => (
                <li key={f} className="text-sm flex items-center gap-2" style={{ color: "#cbd5e1" }}>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-blue-400" />
                  {f}
                </li>
              ))}
            </ul>
          </button>

          {/* Clinician */}
          <button
            onClick={() => setSelectedRole("clinician")}
            className="relative p-6 rounded-2xl text-left transition-all duration-200"
            style={{
              border: selectedRole === "clinician" ? "2px solid #a855f7" : "2px solid rgba(255,255,255,0.08)",
              background: selectedRole === "clinician" ? "rgba(168,85,247,0.08)" : "#0f2233",
              transform: selectedRole === "clinician" ? "scale(1.02)" : "scale(1)",
            }}
            data-testid="role-clinician"
          >
            {selectedRole === "clinician" && (
              <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="w-14 h-14 rounded-xl bg-purple-500/15 flex items-center justify-center mb-4">
              <Stethoscope className="w-7 h-7 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">I'm a Clinician / S&C</h3>
            <p className="text-sm mb-4" style={{ color: "#94a3b8" }}>
              Clinical-grade programming and return-to-play progressions.
            </p>
            <ul className="space-y-2">
              {[
                "Full exercise library",
                "RTP criteria & progressions",
                "Create treatment plans",
                "Provider directory",
              ].map((f) => (
                <li key={f} className="text-sm flex items-center gap-2" style={{ color: "#cbd5e1" }}>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-purple-400" />
                  {f}
                </li>
              ))}
            </ul>
          </button>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handleContinue}
            disabled={!selectedRole || isLoading}
            className="px-10 h-12 text-base font-bold disabled:opacity-40"
            style={{
              background: selectedRole === "athlete" ? "#E8601C" : selectedRole ? "#3b82f6" : "#374151",
              color: selectedRole === "athlete" ? "#0C1A27" : "white",
            }}
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
