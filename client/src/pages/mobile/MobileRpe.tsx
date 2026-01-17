import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Check, Trophy } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const RPE_SCALE = [
  { value: 1, label: "Very Easy", description: "Could do many more reps", color: "bg-green-500" },
  { value: 2, label: "Easy", description: "Minimal effort", color: "bg-green-400" },
  { value: 3, label: "Light", description: "Comfortable pace", color: "bg-lime-400" },
  { value: 4, label: "Moderate", description: "Some effort", color: "bg-yellow-400" },
  { value: 5, label: "Challenging", description: "Starting to work", color: "bg-yellow-500" },
  { value: 6, label: "Hard", description: "Getting difficult", color: "bg-orange-400" },
  { value: 7, label: "Very Hard", description: "Pushing yourself", color: "bg-orange-500" },
  { value: 8, label: "Difficult", description: "2-3 reps left", color: "bg-red-400" },
  { value: 9, label: "Very Difficult", description: "1 rep left", color: "bg-red-500" },
  { value: 10, label: "Maximum", description: "All out effort", color: "bg-red-600" },
];

export default function MobileRpe() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedRpe, setSelectedRpe] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async (data: { rpeScore: number; notes: string }) => {
      return apiRequest("POST", "/api/mobile/athlete/session-rpe", data);
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({ title: "RPE Logged", description: "Session feedback recorded successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit RPE.", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (selectedRpe !== null) {
      submitMutation.mutate({ rpeScore: selectedRpe, notes });
    }
  };

  if (submitted) {
    return (
      <MobileLayout hideNav>
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-teal-500 flex items-center justify-center mb-6 animate-bounce">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Great Work!</h1>
          <p className="text-slate-400 mb-8">Your workout is complete and logged</p>
          
          <Link href="/m">
            <Button size="lg" className="w-full max-w-xs" data-testid="button-back-home">
              Back to Home
            </Button>
          </Link>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout hideNav>
      <div className="min-h-screen p-4 space-y-6">
        <header className="flex items-center gap-3">
          <Link href="/m/workout">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Session RPE</h1>
        </header>

        <div className="text-center py-4">
          <h2 className="text-lg font-semibold mb-2">How hard was today's session?</h2>
          <p className="text-sm text-slate-400">Rate your perceived exertion</p>
        </div>

        <div className="space-y-2">
          {RPE_SCALE.map((item) => (
            <Card
              key={item.value}
              className={`bglass border-0 cursor-pointer transition-all ${
                selectedRpe === item.value 
                  ? 'ring-2 ring-primary ring-offset-2 ring-offset-ink-1' 
                  : 'hover-elevate'
              }`}
              onClick={() => setSelectedRpe(item.value)}
              data-testid={`rpe-option-${item.value}`}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center text-white font-bold`}>
                  {item.value}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-slate-400">{item.description}</p>
                </div>
                {selectedRpe === item.value && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedRpe !== null && (
          <div className="space-y-4 pt-4">
            <Textarea
              placeholder="Any notes about today's session? (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px] bg-ink-2 border-0"
              data-testid="textarea-notes"
            />

            <Button 
              size="lg" 
              className="w-full"
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              data-testid="button-submit-rpe"
            >
              {submitMutation.isPending ? "Submitting..." : "Complete Session"}
            </Button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
