import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  Check,
  Heart,
  Moon,
  Battery,
  Frown,
  Meh,
  Smile,
  Sun,
  Zap
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface WellnessData {
  readiness: number;
  sleep: number;
  soreness: number;
  energy: number;
  mood: number;
  notes: string;
}

const RATING_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function MobileWellness() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);
  const [wellness, setWellness] = useState<WellnessData>({
    readiness: 0,
    sleep: 0,
    soreness: 0,
    energy: 0,
    mood: 0,
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const { data: todaySurvey } = useQuery({
    queryKey: ["/api/mobile/athlete/wellness/today"],
    enabled: !!user,
  });

  const submitMutation = useMutation({
    mutationFn: async (data: WellnessData) => {
      return apiRequest("POST", "/api/mobile/athlete/wellness", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mobile/athlete/wellness/today"] });
      setSubmitted(true);
      toast({ title: "Wellness Logged", description: "Your daily check-in has been recorded." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit wellness data.", variant: "destructive" });
    },
  });

  const questions = [
    {
      key: "readiness" as const,
      title: "How ready do you feel to train today?",
      subtitle: "Rate your overall readiness",
      icon: <Zap className="w-8 h-8" />,
      lowLabel: "Not Ready",
      highLabel: "Very Ready",
      color: "from-red-500 to-green-500",
    },
    {
      key: "sleep" as const,
      title: "How was your sleep last night?",
      subtitle: "Quality and duration",
      icon: <Moon className="w-8 h-8" />,
      lowLabel: "Poor",
      highLabel: "Excellent",
      color: "from-purple-500 to-blue-400",
    },
    {
      key: "soreness" as const,
      title: "How sore are you feeling?",
      subtitle: "Muscle soreness level",
      icon: <Heart className="w-8 h-8" />,
      lowLabel: "Very Sore",
      highLabel: "Not Sore",
      color: "from-red-500 to-green-500",
    },
    {
      key: "energy" as const,
      title: "What's your energy level?",
      subtitle: "How energized do you feel",
      icon: <Battery className="w-8 h-8" />,
      lowLabel: "Exhausted",
      highLabel: "Full Energy",
      color: "from-yellow-500 to-green-500",
    },
    {
      key: "mood" as const,
      title: "How's your mood today?",
      subtitle: "Mental state and motivation",
      icon: <Sun className="w-8 h-8" />,
      lowLabel: "Low",
      highLabel: "Great",
      color: "from-blue-500 to-yellow-400",
    },
  ];

  const handleSelect = (key: keyof WellnessData, value: number) => {
    setWellness(prev => ({ ...prev, [key]: value }));
    if (step < questions.length - 1) {
      setTimeout(() => setStep(step + 1), 300);
    }
  };

  const handleSubmit = () => {
    submitMutation.mutate(wellness);
  };

  const currentQuestion = questions[step];
  const allAnswered = questions.every(q => wellness[q.key] > 0);
  const progress = ((step + 1) / (questions.length + 1)) * 100;

  if (todaySurvey || submitted) {
    return (
      <MobileLayout>
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
            <Check className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-xl font-bold mb-2">Wellness Check Complete</h1>
          <p className="text-slate-400 mb-6">You've already logged your wellness for today</p>
          
          {(todaySurvey || submitted) && (
            <Card className="bglass border-0 w-full max-w-sm mb-6">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Readiness</span>
                  <span className="font-semibold">{wellness.readiness || (todaySurvey as any)?.readiness}/10</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Sleep</span>
                  <span className="font-semibold">{wellness.sleep || (todaySurvey as any)?.sleep}/10</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Energy</span>
                  <span className="font-semibold">{wellness.energy || (todaySurvey as any)?.energy}/10</span>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Link href="/m">
            <Button variant="outline" data-testid="button-back-home">Back to Home</Button>
          </Link>
        </div>
      </MobileLayout>
    );
  }

  if (step === questions.length) {
    return (
      <MobileLayout hideNav>
        <div className="min-h-screen p-4 space-y-6">
          <header className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setStep(step - 1)} data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Any Notes?</h1>
          </header>

          <div className="h-2 bg-ink-3 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-teal-500 transition-all duration-300"
              style={{ width: `100%` }}
            />
          </div>

          <Card className="bglass border-0">
            <CardContent className="p-4 space-y-4">
              <p className="text-sm text-slate-400">Add any additional notes about how you're feeling</p>
              <Textarea
                placeholder="E.g., Slight knee discomfort, feeling stressed about exams..."
                value={wellness.notes}
                onChange={(e) => setWellness(prev => ({ ...prev, notes: e.target.value }))}
                className="min-h-[120px] bg-ink-2 border-0"
                data-testid="textarea-notes"
              />
            </CardContent>
          </Card>

          <Card className="bglass border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 grid grid-cols-5 gap-2">
              {questions.map((q) => (
                <div key={q.key} className="text-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-1 ${
                    wellness[q.key] >= 7 ? 'bg-green-500/30 text-green-400' :
                    wellness[q.key] >= 4 ? 'bg-yellow-500/30 text-yellow-400' :
                    'bg-red-500/30 text-red-400'
                  }`}>
                    {wellness[q.key]}
                  </div>
                  <p className="text-[9px] text-slate-500 uppercase">{q.key.slice(0, 4)}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Button 
            size="lg" 
            className="w-full"
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            data-testid="button-submit-wellness"
          >
            {submitMutation.isPending ? "Submitting..." : "Submit Wellness Check"}
          </Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout hideNav>
      <div className="min-h-screen p-4 space-y-6">
        <header className="flex items-center gap-3">
          {step === 0 ? (
            <Link href="/m">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => setStep(step - 1)} data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <h1 className="text-xl font-bold">Daily Wellness</h1>
        </header>

        <div className="h-2 bg-ink-3 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-teal-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentQuestion.color} flex items-center justify-center mb-6 text-white`}>
            {currentQuestion.icon}
          </div>
          
          <h2 className="text-lg font-bold mb-2">{currentQuestion.title}</h2>
          <p className="text-sm text-slate-400 mb-8">{currentQuestion.subtitle}</p>

          <div className="w-full max-w-sm space-y-4">
            <div className="grid grid-cols-5 gap-2">
              {RATING_OPTIONS.slice(0, 5).map((value) => (
                <Button
                  key={value}
                  variant={wellness[currentQuestion.key] === value ? "default" : "outline"}
                  size="lg"
                  className={`h-14 text-lg font-bold ${
                    wellness[currentQuestion.key] === value ? 'ring-2 ring-primary ring-offset-2 ring-offset-ink-1' : ''
                  }`}
                  onClick={() => handleSelect(currentQuestion.key, value)}
                  data-testid={`button-rating-${value}`}
                >
                  {value}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {RATING_OPTIONS.slice(5).map((value) => (
                <Button
                  key={value}
                  variant={wellness[currentQuestion.key] === value ? "default" : "outline"}
                  size="lg"
                  className={`h-14 text-lg font-bold ${
                    wellness[currentQuestion.key] === value ? 'ring-2 ring-primary ring-offset-2 ring-offset-ink-1' : ''
                  }`}
                  onClick={() => handleSelect(currentQuestion.key, value)}
                  data-testid={`button-rating-${value}`}
                >
                  {value}
                </Button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-2 px-1">
              <span>{currentQuestion.lowLabel}</span>
              <span>{currentQuestion.highLabel}</span>
            </div>
          </div>
        </div>

        {wellness[currentQuestion.key] > 0 && step < questions.length - 1 && (
          <Button 
            size="lg" 
            className="w-full"
            onClick={() => setStep(step + 1)}
            data-testid="button-next"
          >
            Next
          </Button>
        )}
        
        {wellness[currentQuestion.key] > 0 && step === questions.length - 1 && (
          <Button 
            size="lg" 
            className="w-full"
            onClick={() => setStep(questions.length)}
            data-testid="button-continue"
          >
            Continue
          </Button>
        )}
      </div>
    </MobileLayout>
  );
}
