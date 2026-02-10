import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Target, Zap, CheckCircle2 } from "lucide-react";
import type { DailyChallenge } from "@shared/schema";

interface DailyChallengeCardProps {
  challenge: DailyChallenge;
  progress?: number;
  completed?: boolean;
  onAccept?: () => void;
  className?: string;
}

export function DailyChallengeCard({ 
  challenge, 
  progress = 0,
  completed = false,
  onAccept,
  className = "" 
}: DailyChallengeCardProps) {
  const progressPercentage = (progress / challenge.targetValue) * 100;

  return (
    <div 
      className={`p-4 rounded-lg bg-card border border-border ${className}`}
      data-testid={`challenge-card-${challenge.id}`}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`
              p-2 rounded-md border-0
              ${completed ? 'bg-emerald-500/10' : 'bg-amber-500/10'}
            `}>
              {completed ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" data-testid="icon-completed" />
              ) : (
                <Target className="h-4 w-4 text-amber-400" data-testid="icon-target" />
              )}
            </div>
            <h3 className="text-base font-semibold text-slate-100" data-testid="text-challenge-title">
              {challenge.title}
            </h3>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-brand-500/10 border-0">
            <Zap className="h-3 w-3 text-brand-400" />
            <span className="text-xs font-semibold text-brand-400" data-testid="text-xp-reward">
              +{challenge.xpReward}
            </span>
          </div>
        </div>
        
        <p className="text-sm text-slate-400" data-testid="text-challenge-description">
          {challenge.description}
        </p>
        
        {!completed && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Progress</span>
              <span className="font-medium text-slate-200" data-testid="text-progress">
                {progress} / {challenge.targetValue}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" data-testid="progress-challenge" />
          </div>
        )}

        {completed && (
          <div className="flex items-center gap-2 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-medium">Challenge Completed!</span>
          </div>
        )}

        {!completed && onAccept && progress === 0 && (
          <Button 
            onClick={onAccept}
            variant="outline"
            className="w-full"
            data-testid="button-accept-challenge"
          >
            Accept Challenge
          </Button>
        )}
      </div>
    </div>
  );
}
