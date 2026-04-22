import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowRight, ArrowLeft, Check, Flame } from "lucide-react";

interface SetupData {
  age: number | null;
  sport: string;
  playingLevel: string;
  position: string;
  injuryHistory: string[];
  trainingFrequency: number;
  seasonPhase: string;
  state: string;
  club: string;
}

const sports = [
  { id: "netball", name: "Netball", icon: "🏐" },
  { id: "basketball", name: "Basketball", icon: "🏀" },
  { id: "football", name: "Football", icon: "⚽" },
  { id: "afl", name: "AFL", icon: "🏉" },
  { id: "rugby", name: "Rugby", icon: "🏈" },
  { id: "hockey", name: "Hockey", icon: "🏑" },
  { id: "other", name: "Other", icon: "🎯" }
];

const netballPositions = ["GS", "GA", "WA", "C", "WD", "GD", "GK"];

const levels = [
  { id: "community", name: "Community / Social", desc: "Play for fun and fitness" },
  { id: "club", name: "Club / Association", desc: "Regular competition level" },
  { id: "representative", name: "Representative", desc: "State or regional level" },
  { id: "elite", name: "Elite / Professional", desc: "National or higher level" }
];

const injuries = [
  { id: "none", name: "No injuries", icon: "✓" },
  { id: "acl", name: "ACL injury", icon: "🦵" },
  { id: "ankle", name: "Ankle sprain", icon: "🦶" },
  { id: "knee", name: "Other knee injury", icon: "🦿" },
  { id: "hamstring", name: "Hamstring injury", icon: "💪" },
  { id: "back", name: "Back pain", icon: "🔙" }
];

const phases = [
  { id: "preseason", name: "Pre-Season", desc: "Getting ready for the season", icon: "🏋️" },
  { id: "in-season", name: "In-Season", desc: "Currently playing matches", icon: "🏆" },
  { id: "off-season", name: "Off-Season", desc: "Between seasons", icon: "🌴" }
];

const australianStates = [
  { id: "NSW", name: "New South Wales" },
  { id: "VIC", name: "Victoria" },
  { id: "QLD", name: "Queensland" },
  { id: "SA", name: "South Australia" },
  { id: "WA", name: "Western Australia" },
  { id: "TAS", name: "Tasmania" },
  { id: "NT", name: "Northern Territory" },
  { id: "ACT", name: "Australian Capital Territory" },
];

export default function AthleteSetup() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const searchParams = new URLSearchParams(searchString);
  const sportParam = searchParams.get("sport");
  const orgParam = searchParams.get("org");
  
  const [data, setData] = useState<SetupData>({
    age: null,
    sport: sportParam || "netball",
    playingLevel: "",
    position: "",
    injuryHistory: [],
    trainingFrequency: 3,
    seasonPhase: "",
    state: "",
    club: "",
  });

  useEffect(() => {
    if (sportParam && sportParam !== data.sport) {
      setData((prev) => ({ ...prev, sport: sportParam }));
    }
  }, [sportParam]);

  const totalSteps = 5;

  function handleBack() {
    if (step > 1) setStep(step - 1);
  }

  function handleNext() {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  }

  function toggleInjury(id: string) {
    if (id === "none") {
      setData({ ...data, injuryHistory: ["none"] });
    } else {
      const newHistory = data.injuryHistory.filter(i => i !== "none");
      if (newHistory.includes(id)) {
        setData({ ...data, injuryHistory: newHistory.filter(i => i !== id) });
      } else {
        setData({ ...data, injuryHistory: [...newHistory, id] });
      }
    }
  }

  async function handleComplete() {
    try {
      setIsLoading(true);

      if (data.state) {
        await apiRequest("PATCH", "/api/auth/user/location", {
          state: data.state,
          region: "",
          club: data.club,
        });
      }

      const res = await apiRequest("POST", "/api/athlete/profile", {
        age: data.age,
        sport: data.sport,
        playingLevel: data.playingLevel,
        position: data.position,
        injuryHistory: data.injuryHistory,
        trainingFrequency: data.trainingFrequency,
        seasonPhase: data.seasonPhase,
        onboardingCompleted: true,
      });
      const result = await res.json();

      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        toast({
          title: "You're all set!",
          description: "Your personalised program is ready"
        });
        navigate("/athlete");
      }
    } catch (error: any) {
      toast({
        title: "Something went wrong",
        description: error.message || "Could not save your profile",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  function canContinue() {
    switch (step) {
      case 1: return data.sport && data.playingLevel;
      case 2: return data.sport !== "netball" || data.position;
      case 3: return data.injuryHistory.length > 0;
      case 4: return data.seasonPhase;
      case 5: return true;
      default: return true;
    }
  }

  return (
    <div className="min-h-screen bg-p2p-dark flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div 
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i + 1 <= step 
                  ? "w-12 bg-p2p-electric" 
                  : "w-8 bg-gray-700"
              }`}
            />
          ))}
        </div>

        <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8">
          {step === 1 && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="font-heading text-2xl md:text-3xl font-bold text-white mb-2">
                  What sport do you play?
                </h2>
                <p className="text-gray-400">We'll tailor your training to your sport</p>
              </div>

              <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
                {sports.map((sport) => (
                  <button
                    key={sport.id}
                    onClick={() => setData({ ...data, sport: sport.id })}
                    className={`p-4 rounded-xl border-2 transition-all text-center
                      ${data.sport === sport.id 
                        ? "border-p2p-electric bg-p2p-electric/10" 
                        : "border-gray-700 hover:border-gray-600"
                      }`}
                    data-testid={`sport-${sport.id}`}
                  >
                    <div className="text-2xl mb-1">{sport.icon}</div>
                    <div className="text-xs text-gray-300">{sport.name}</div>
                  </button>
                ))}
              </div>

              {sportParam && (
                <p className="text-center text-sm text-p2p-electric">
                  Pre-selected based on your organisation
                </p>
              )}

              <div>
                <h3 className="font-heading text-lg font-semibold text-white mb-4">
                  What level do you play at?
                </h3>
                <div className="space-y-3">
                  {levels.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setData({ ...data, playingLevel: level.id })}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left
                        ${data.playingLevel === level.id 
                          ? "border-p2p-electric bg-p2p-electric/10" 
                          : "border-gray-700 hover:border-gray-600"
                        }`}
                      data-testid={`level-${level.id}`}
                    >
                      <div className="font-semibold text-white">{level.name}</div>
                      <div className="text-sm text-gray-400">{level.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="font-heading text-2xl md:text-3xl font-bold text-white mb-2">
                  What position do you play?
                </h2>
                <p className="text-gray-400">This helps us focus on movements relevant to your role</p>
              </div>

              {data.sport === "netball" ? (
                <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
                  {netballPositions.map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setData({ ...data, position: pos })}
                      className={`p-6 rounded-xl border-2 transition-all text-center
                        ${data.position === pos 
                          ? "border-p2p-electric bg-p2p-electric/10" 
                          : "border-gray-700 hover:border-gray-600"
                        }`}
                      data-testid={`position-${pos}`}
                    >
                      <div className="text-xl font-bold text-white">{pos}</div>
                    </button>
                  ))}
                  <button
                    onClick={() => setData({ ...data, position: "multi" })}
                    className={`p-6 rounded-xl border-2 transition-all text-center
                      ${data.position === "multi" 
                        ? "border-p2p-electric bg-p2p-electric/10" 
                        : "border-gray-700 hover:border-gray-600"
                      }`}
                    data-testid="position-multi"
                  >
                    <div className="text-xl font-bold text-white">All</div>
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">Position selection for {data.sport} coming soon!</p>
                  <Button 
                    onClick={() => setData({ ...data, position: "general" })}
                    variant="outline"
                    data-testid="position-skip"
                  >
                    Continue with general training
                  </Button>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="font-heading text-2xl md:text-3xl font-bold text-white mb-2">
                  Any previous injuries?
                </h2>
                <p className="text-gray-400">We'll prioritise exercises to help prevent re-injury</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {injuries.map((injury) => (
                  <button
                    key={injury.id}
                    onClick={() => toggleInjury(injury.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-center
                      ${data.injuryHistory.includes(injury.id) 
                        ? "border-p2p-electric bg-p2p-electric/10" 
                        : "border-gray-700 hover:border-gray-600"
                      }`}
                    data-testid={`injury-${injury.id}`}
                  >
                    <div className="text-2xl mb-2">{injury.icon}</div>
                    <div className="text-sm text-white">{injury.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="font-heading text-2xl md:text-3xl font-bold text-white mb-2">
                  Where are you in your season?
                </h2>
                <p className="text-gray-400">We'll adjust your program intensity accordingly</p>
              </div>

              <div className="space-y-4">
                {phases.map((phase) => (
                  <button
                    key={phase.id}
                    onClick={() => setData({ ...data, seasonPhase: phase.id })}
                    className={`w-full p-6 rounded-xl border-2 transition-all text-left flex items-center gap-4
                      ${data.seasonPhase === phase.id 
                        ? "border-p2p-electric bg-p2p-electric/10" 
                        : "border-gray-700 hover:border-gray-600"
                      }`}
                    data-testid={`phase-${phase.id}`}
                  >
                    <div className="text-3xl">{phase.icon}</div>
                    <div>
                      <div className="font-semibold text-white text-lg">{phase.name}</div>
                      <div className="text-sm text-gray-400">{phase.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="bg-gray-800/50 rounded-xl p-4 flex items-center gap-4">
                <Flame className="w-8 h-8 text-orange-500" />
                <div>
                  <div className="font-semibold text-white">Start your streak today!</div>
                  <div className="text-sm text-gray-400">Complete sessions consistently to build healthy habits</div>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="font-heading text-2xl md:text-3xl font-bold text-white mb-2">
                  Club & Location
                </h2>
                <p className="text-gray-400">Help us connect you with local programs and clinics</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    State
                  </label>
                  <Select
                    value={data.state}
                    onValueChange={(value) => setData({ ...data, state: value })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white" data-testid="select-state">
                      <SelectValue placeholder="Select your state" />
                    </SelectTrigger>
                    <SelectContent>
                      {australianStates.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Club Name
                  </label>
                  <Input
                    value={data.club}
                    onChange={(e) => setData({ ...data, club: e.target.value })}
                    placeholder="e.g. Melbourne Phoenix Netball Club"
                    className="bg-gray-800 border-gray-700 text-white"
                    data-testid="input-club"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional — you can add this later</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
            className="border-gray-700 text-gray-300"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canContinue() || isLoading}
            className="bg-gradient-to-r from-p2p-blue to-p2p-electric hover:opacity-90"
            data-testid="button-next"
          >
            {step === totalSteps ? (
              isLoading ? "Setting up..." : "Start Training"
            ) : (
              "Next"
            )}
            {step < totalSteps && <ArrowRight className="w-4 h-4 ml-2" />}
            {step === totalSteps && <Check className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
