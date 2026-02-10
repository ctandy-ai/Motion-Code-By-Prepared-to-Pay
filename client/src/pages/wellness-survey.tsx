import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Athlete, ReadinessSurvey } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Moon,
  Battery,
  Heart,
  Brain,
  Smile,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

type MetricKey = "sleepQuality" | "muscleSoreness" | "energyLevel" | "stressLevel" | "mood" | "overallReadiness";

interface SurveyMetric {
  key: MetricKey;
  label: string;
  icon: any;
  description: string;
  lowLabel: string;
  highLabel: string;
  color: string;
  invertScale?: boolean;
}

const SURVEY_METRICS: SurveyMetric[] = [
  { 
    key: "sleepQuality", 
    label: "Sleep Quality", 
    icon: Moon, 
    description: "How well did you sleep last night?",
    lowLabel: "Very Poor",
    highLabel: "Excellent",
    color: "from-indigo-500 to-purple-500"
  },
  { 
    key: "muscleSoreness", 
    label: "Muscle Soreness", 
    icon: Activity, 
    description: "How sore are your muscles?",
    lowLabel: "No Soreness",
    highLabel: "Very Sore",
    color: "from-red-500 to-orange-500",
    invertScale: true
  },
  { 
    key: "energyLevel", 
    label: "Energy Level", 
    icon: Battery, 
    description: "How energized do you feel?",
    lowLabel: "Exhausted",
    highLabel: "Fully Charged",
    color: "from-green-500 to-emerald-500"
  },
  { 
    key: "stressLevel", 
    label: "Stress Level", 
    icon: Brain, 
    description: "How stressed do you feel?",
    lowLabel: "Very Calm",
    highLabel: "Very Stressed",
    color: "from-amber-500 to-yellow-500",
    invertScale: true
  },
  { 
    key: "mood", 
    label: "Mood", 
    icon: Smile, 
    description: "How is your overall mood?",
    lowLabel: "Very Low",
    highLabel: "Excellent",
    color: "from-pink-500 to-rose-500"
  },
  { 
    key: "overallReadiness", 
    label: "Overall Readiness", 
    icon: Heart, 
    description: "How ready do you feel to train today?",
    lowLabel: "Not Ready",
    highLabel: "Peak Readiness",
    color: "from-cyan-500 to-blue-500"
  },
];

function MetricSlider({ 
  metric, 
  value, 
  onChange 
}: { 
  metric: SurveyMetric; 
  value: number; 
  onChange: (value: number) => void;
}) {
  const Icon = metric.icon;
  
  const getScoreColor = (score: number, inverted: boolean) => {
    const effectiveScore = inverted ? 11 - score : score;
    if (effectiveScore >= 8) return "text-green-400";
    if (effectiveScore >= 5) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <Card className="border-0 overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${metric.color} flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-semibold text-slate-200">{metric.label}</h3>
            <p className="text-xs text-slate-500">{metric.description}</p>
          </div>
          <div className={`text-3xl font-display font-bold ${getScoreColor(value, metric.invertScale || false)}`}>
            {value}
          </div>
        </div>
        
        <div className="space-y-2">
          <input
            type="range"
            min="1"
            max="10"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary"
            style={{
              background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${(value - 1) * 11.11}%, hsl(var(--muted)) ${(value - 1) * 11.11}%, hsl(var(--muted)) 100%)`
            }}
            data-testid={`slider-${metric.key}`}
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>{metric.lowLabel}</span>
            <span>{metric.highLabel}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SleepHoursInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const hours = [4, 5, 6, 7, 8, 9, 10, 11, 12];
  
  return (
    <Card className="border-0 overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-semibold text-slate-200">Sleep Duration</h3>
            <p className="text-xs text-slate-500">How many hours did you sleep?</p>
          </div>
          <div className="text-3xl font-display font-bold text-slate-200">
            {value}<span className="text-lg text-slate-500 ml-1">hrs</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {hours.map((h) => (
            <Button
              key={h}
              type="button"
              variant={value === h ? "default" : "outline"}
              size="sm"
              className={`min-w-12 ${value === h ? 'bg-primary' : ''}`}
              onClick={() => onChange(h)}
              data-testid={`sleep-hours-${h}`}
            >
              {h}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ReadinessScore({ values }: { values: Record<MetricKey, number> }) {
  const calculateScore = () => {
    const weights = {
      sleepQuality: 0.20,
      muscleSoreness: 0.15,
      energyLevel: 0.20,
      stressLevel: 0.15,
      mood: 0.10,
      overallReadiness: 0.20,
    };
    
    let score = 0;
    score += values.sleepQuality * weights.sleepQuality;
    score += (11 - values.muscleSoreness) * weights.muscleSoreness;
    score += values.energyLevel * weights.energyLevel;
    score += (11 - values.stressLevel) * weights.stressLevel;
    score += values.mood * weights.mood;
    score += values.overallReadiness * weights.overallReadiness;
    
    return Math.round(score * 10);
  };

  const score = calculateScore();
  const getColor = () => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-amber-400";
    return "text-red-400";
  };
  
  const getStatus = () => {
    if (score >= 80) return { label: "Ready to Train", icon: CheckCircle2, color: "text-green-400" };
    if (score >= 60) return { label: "Moderate Readiness", icon: AlertCircle, color: "text-amber-400" };
    return { label: "Consider Recovery", icon: AlertCircle, color: "text-red-400" };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  return (
    <Card className="border-0 overflow-hidden">
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Readiness Score</p>
            <p className={`text-5xl font-display font-bold ${getColor()}`}>{score}</p>
          </div>
          <div className="text-right">
            <div className={`flex items-center gap-2 ${status.color}`}>
              <StatusIcon className="w-5 h-5" />
              <span className="font-medium">{status.label}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Based on your inputs</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function WellnessSurvey() {
  const { athleteId } = useParams<{ athleteId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [values, setValues] = useState({
    sleepQuality: 7,
    sleepHours: 7,
    muscleSoreness: 3,
    energyLevel: 7,
    stressLevel: 3,
    mood: 7,
    overallReadiness: 7,
  });
  const [notes, setNotes] = useState("");

  const { data: athlete, isLoading: athleteLoading } = useQuery<Athlete>({
    queryKey: ["/api/athletes", athleteId],
    enabled: !!athleteId,
  });

  const { data: todaysSurvey, isLoading: surveyLoading } = useQuery<ReadinessSurvey | null>({
    queryKey: ["/api/athletes", athleteId, "readiness-surveys", "today"],
    enabled: !!athleteId,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/readiness-surveys", {
        athleteId,
        sleepQuality: values.sleepQuality,
        sleepHours: values.sleepHours,
        muscleSoreness: values.muscleSoreness,
        energyLevel: values.energyLevel,
        stressLevel: values.stressLevel,
        mood: values.mood,
        overallReadiness: values.overallReadiness,
        notes: notes || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/athletes", athleteId, "readiness-surveys"] });
      queryClient.invalidateQueries({ queryKey: ["/api/athletes", athleteId, "readiness-surveys", "today"] });
      toast({
        title: "Survey Submitted!",
        description: "Your wellness check-in has been recorded.",
      });
      setLocation(`/athlete/${athleteId}/portal`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit survey. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    submitMutation.mutate();
  };

  const updateValue = (key: string, value: number) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  if (athleteLoading || surveyLoading) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-ink-3 rounded w-1/3" />
          <div className="h-32 bg-ink-3 rounded" />
          <div className="h-32 bg-ink-3 rounded" />
        </div>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Card className="border-0">
          <CardContent className="p-8 text-center">
            <p className="text-slate-400">Athlete not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (todaysSurvey) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation(`/athlete/${athleteId}/portal`)}
          className="mb-6 text-slate-400 hover:text-slate-200"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Portal
        </Button>

        <Card className="border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-display font-bold text-slate-100 mb-2">
              Already Checked In!
            </h2>
            <p className="text-slate-400">
              You've already submitted your wellness survey for today.
            </p>
            <p className="text-sm text-slate-500 mt-4">
              Submitted at {new Date(todaysSurvey.surveyDate!).toLocaleTimeString()}
            </p>
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-display font-bold text-slate-200">{todaysSurvey.sleepQuality}</p>
                <p className="text-xs text-slate-500">Sleep</p>
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-slate-200">{todaysSurvey.energyLevel}</p>
                <p className="text-xs text-slate-500">Energy</p>
              </div>
              <div>
                <p className="text-2xl font-display font-bold text-slate-200">{todaysSurvey.overallReadiness}</p>
                <p className="text-xs text-slate-500">Readiness</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLocation(`/athlete/${athleteId}/portal`)}
        className="mb-6 text-slate-400 hover:text-slate-200"
        data-testid="button-back"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Portal
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-slate-100 mb-2">
          Daily Wellness Check
        </h1>
        <p className="text-slate-400">
          How are you feeling today, {athlete.name?.split(' ')[0]}? Complete this quick check-in to help your coach optimize your training.
        </p>
      </div>

      <div className="space-y-4">
        <SleepHoursInput 
          value={values.sleepHours} 
          onChange={(v) => updateValue("sleepHours", v)} 
        />

        {SURVEY_METRICS.map((metric) => (
          <MetricSlider
            key={metric.key}
            metric={metric}
            value={values[metric.key]}
            onChange={(v) => updateValue(metric.key, v)}
          />
        ))}

        <Card className="border-0">
          <CardContent className="p-5">
            <h3 className="font-display font-semibold text-slate-200 mb-3">
              Additional Notes (Optional)
            </h3>
            <Textarea
              placeholder="Any injuries, concerns, or things your coach should know..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="border-slate-700 text-slate-200 placeholder:text-slate-500 min-h-24"
              data-testid="input-notes"
            />
          </CardContent>
        </Card>

        <ReadinessScore values={values} />

        <Button
          onClick={handleSubmit}
          disabled={submitMutation.isPending}
          className="w-full h-14 text-lg font-display font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90"
          data-testid="button-submit-survey"
        >
          {submitMutation.isPending ? "Submitting..." : "Submit Wellness Check"}
        </Button>
      </div>
    </div>
  );
}
