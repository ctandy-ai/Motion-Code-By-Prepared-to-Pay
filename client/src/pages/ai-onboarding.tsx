import { useLocation } from "wouter";
import { AIOnboardingChat } from "@/components/ai-onboarding-chat";

export default function AIOnboardingPage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-200 mb-2">Add New Athlete</h1>
          <p className="text-slate-400">
            Describe your athlete naturally and I'll help you create their profile and recommend appropriate programs.
          </p>
        </div>
        
        <AIOnboardingChat 
          onAthleteCreated={(athleteId) => {
            setTimeout(() => {
              navigate(`/athletes/${athleteId}`);
            }, 2000);
          }}
          onClose={() => navigate("/athletes")}
        />
      </div>
    </div>
  );
}
